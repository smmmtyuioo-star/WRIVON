"""Tool dispatcher — maps tool names to their implementations."""

from .editor import read_file, write_file, edit_file
from .shell import run_bash
from .search import glob_files, grep_files
from .web import web_fetch, web_search

AVAILABLE_TOOLS = {
    "read": {"name": "read", "description": "Read a file from the filesystem. Returns the file content with line numbers.", "parameters": {
        "type": "object", "properties": {
            "filePath": {"type": "string", "description": "The absolute path to the file to read"}
        }, "required": ["filePath"]
    }},
    "write": {"name": "write", "description": "Write content to a file. Overwrites the existing file.", "parameters": {
        "type": "object", "properties": {
            "filePath": {"type": "string", "description": "The absolute path to the file to write"},
            "content": {"type": "string", "description": "The content to write"}
        }, "required": ["filePath", "content"]
    }},
    "edit": {"name": "edit", "description": "Edit a file by replacing text. Uses exact string replacement.", "parameters": {
        "type": "object", "properties": {
            "filePath": {"type": "string", "description": "The absolute path to the file to edit"},
            "oldString": {"type": "string", "description": "The text to replace"},
            "newString": {"type": "string", "description": "The text to replace it with"}
        }, "required": ["filePath", "oldString", "newString"]
    }},
    "bash": {"name": "bash", "description": "Execute a shell command. Returns stdout, stderr, and exit code.", "parameters": {
        "type": "object", "properties": {
            "command": {"type": "string", "description": "The command to execute"},
            "timeout": {"type": "number", "description": "Timeout in milliseconds (default 120000)"},
            "workdir": {"type": "string", "description": "Working directory (default: CWD)"}
        }, "required": ["command"]
    }},
    "glob": {"name": "glob", "description": "Find files matching a glob pattern.", "parameters": {
        "type": "object", "properties": {
            "pattern": {"type": "string", "description": "The glob pattern (e.g. **/*.js)"},
            "path": {"type": "string", "description": "The directory to search in (default: CWD)"}
        }, "required": ["pattern"]
    }},
    "grep": {"name": "grep", "description": "Search file contents using a regex pattern.", "parameters": {
        "type": "object", "properties": {
            "pattern": {"type": "string", "description": "The regex pattern to search for"},
            "path": {"type": "string", "description": "The directory to search in (default: CWD)"},
            "include": {"type": "string", "description": "File pattern filter (e.g. *.js)"}
        }, "required": ["pattern"]
    }},
    "web_fetch": {"name": "web_fetch", "description": "Fetch content from a URL and convert to markdown.", "parameters": {
        "type": "object", "properties": {
            "url": {"type": "string", "description": "The URL to fetch"},
            "format": {"type": "string", "enum": ["markdown", "text", "html"], "default": "markdown"}
        }, "required": ["url"]
    }},
    "web_search": {"name": "web_search", "description": "Search the web for information.", "parameters": {
        "type": "object", "properties": {
            "query": {"type": "string", "description": "The search query"},
            "numResults": {"type": "number", "default": 8}
        }, "required": ["query"]
    }},
}

TOOL_MAP = {
    "read": read_file,
    "write": write_file,
    "edit": edit_file,
    "bash": run_bash,
    "glob": glob_files,
    "grep": grep_files,
    "web_fetch": web_fetch,
    "web_search": web_search,
}


def execute_tool(name: str, args: dict, sandbox: str = "workspace-write") -> str:
    """Execute a tool by name with given arguments."""
    if name not in TOOL_MAP:
        return f"Error: Unknown tool '{name}'"

    # Sandbox checks
    if sandbox == "read-only" and name in ("write", "edit", "bash"):
        return "Error: File modifications are disabled in read-only mode. Switch to /code mode."
    if sandbox == "workspace-write" and name in ("bash",):
        return "Error: Shell execution is disabled in workspace-write mode."

    try:
        result = TOOL_MAP[name](**args)
        return str(result)
    except Exception as e:
        return f"Error executing {name}: {e}"
