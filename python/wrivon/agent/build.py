"""Build mode — one-shot full-stack app builder."""

import json
import os
import re
import subprocess
from pathlib import Path
from ..llm import LLMError
from ..provider import ProviderChain


BUILD_INSTRUCTION = """
## BUILD MODE — One-Shot App Builder

You are in BUILD MODE. The user wants you to build an entire application from scratch.
Follow this process:

### Phase 1: Plan
Output a structured JSON plan like:
```json
{
  "appName": "my-app",
  "directory": "my-app",
  "techStack": {"frontend": "React", "backend": "Express", "database": "SQLite"},
  "installCommand": "npm install",
  "runCommand": "npm start",
  "files": [
    {"path": "package.json", "purpose": "Project config and dependencies"},
    {"path": "src/index.js", "purpose": "Main server entry point"},
    ...
  ],
  "architecture": "Brief description of the app structure"
}
```

### Phase 2: Generate Files
For each file in the plan, generate complete, production-quality code.
- Every file must be fully working with no placeholders or TODOs
- Include proper error handling, input validation, and security
- Follow best practices for the chosen tech stack

### Phase 3: Install
After all files are created, provide the install command.

### Phase 4: Report
Return a JSON summary:
```json
{
  "appName": "...",
  "filesCreated": 5,
  "installCommand": "...",
  "runCommand": "..."
}
```
"""

TOOL_DESCRIPTION = {
    "write": {"name": "write", "description": "Write content to a file", "parameters": {
        "type": "object", "properties": {
            "filePath": {"type": "string"}, "content": {"type": "string"}
        }, "required": ["filePath", "content"]
    }},
    "bash": {"name": "bash", "description": "Run a shell command", "parameters": {
        "type": "object", "properties": {
            "command": {"type": "string"}, "timeout": {"type": "number"}
        }, "required": ["command"]
    }},
}


def extract_plan(text: str) -> dict:
    """Extract JSON plan from model output."""
    # Try ```json ... ``` blocks
    match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try bare { ... }
    match = re.search(r"\{[^{}]*\"appName\"[^{}]*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None


def generate_file_content(provider, file_info: dict, plan: dict, messages: list) -> str:
    """Generate content for a single file."""
    prompt = (
        f"Generate the complete content for the file '{file_info['path']}'.\n"
        f"Purpose: {file_info.get('purpose', '')}\n"
        f"App: {plan.get('appName', '')}\n"
        f"Tech Stack: {json.dumps(plan.get('techStack', {}))}\n\n"
        f"Output ONLY the file content. No explanations, no markdown wrappers, no code fences. "
        f"The content will be written directly to the file."
    )

    file_messages = [
        {"role": "system", "content": "You are a code generator. Output ONLY the file content, no explanations."},
        {"role": "user", "content": prompt},
    ]

    try:
        result = provider.chat(file_messages, stream=False)
        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

        # Strip code fences if present
        content = re.sub(r"^```(?:\w+)?\n", "", content)
        content = re.sub(r"\n```$", "", content)

        return content
    except LLMError as e:
        return f"/* ERROR generating file: {e} */"


def get_build_label():
    """Return build mode metadata."""
    return {
        "name": "build",
        "instruction": BUILD_INSTRUCTION,
    }


def run_build(prompt: str, provider: ProviderChain, cfg: dict) -> dict:
    """Run the full build lifecycle: Plan -> Generate -> Install -> Report."""
    result = {
        "appName": "",
        "directory": "",
        "filesCreated": [],
        "filesFailed": [],
        "installOk": False,
        "runCommand": "",
        "error": None,
    }

    # ---- Phase 1: Plan ----
    plan_messages = [
        {"role": "system", "content": "You are a software architect. Given a user request, output a JSON plan for building the application. Include appName, directory, techStack, installCommand, runCommand, files (array of {path, purpose}), and architecture."},
        {"role": "user", "content": f"Plan an application for: {prompt}"},
    ]

    try:
        plan_response = provider.chat(plan_messages, stream=False)
        plan_text = plan_response.get("choices", [{}])[0].get("message", {}).get("content", "")
        plan = extract_plan(plan_text)
    except LLMError as e:
        result["error"] = f"Planning failed: {e}"
        return result

    if not plan:
        result["error"] = "Failed to extract build plan from model response"
        return result

    result["appName"] = plan.get("appName", "app")
    result["directory"] = plan.get("directory", "app")
    result["runCommand"] = plan.get("runCommand", "")

    # ---- Phase 2: Generate Files ----
    files = plan.get("files", [])
    if not files:
        result["error"] = "No files in build plan"
        return result

    build_dir = Path.cwd() / result["directory"]
    build_dir.mkdir(parents=True, exist_ok=True)

    for idx, file_info in enumerate(files):
        file_path = file_info.get("path", "")
        if not file_path:
            continue

        full_path = build_dir / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # Generate file content
        try:
            content = generate_file_content(provider, file_info, plan, plan_messages)
            full_path.write_text(content, encoding="utf-8")
            result["filesCreated"].append(str(file_path))
        except Exception as e:
            result["filesFailed"].append({"file": file_path, "error": str(e)})

    # ---- Phase 3: Install ----
    install_cmd = plan.get("installCommand", "")
    if install_cmd and result["filesCreated"]:
        try:
            subprocess.run(
                install_cmd,
                shell=True,
                capture_output=True,
                text=True,
                cwd=str(build_dir),
                timeout=120,
            )
            result["installOk"] = True
        except subprocess.TimeoutExpired:
            result["installOk"] = False
        except Exception as e:
            result["installOk"] = False

    return result
