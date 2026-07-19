"""Agent loop — multi-turn tool calling."""

import json
import os
from pathlib import Path
from ..provider import ProviderChain
from ..llm import LLMError
from ..tools import execute_tool, AVAILABLE_TOOLS
from ..session import open_session, save_session, list_sessions, resume_session as load_session


SYSTEM_PROMPT_PATH = Path(__file__).parent.parent.parent / "prompt" / "system.md"
FALLBACK_SYSTEM_PROMPT = (
    "You are WRIVON, an AI coding assistant. You have access to tools to read, write, "
    "edit files, run shell commands, search code, and fetch web content. "
    "Use these tools to help the user with their tasks.\n\n"
    "When you need to use a tool, respond with a JSON tool call in the format:\n"
    '{"function": {"name": "tool_name", "arguments": {"key": "value"}}}\n\n'
    "Available tools: read, write, edit, bash, glob, grep, web_fetch, web_search"
)

CHAT_MODES = {
    "code": {"label": "Code", "sandbox": "workspace-write", "desc": "Full tool access"},
    "ask": {"label": "Ask", "sandbox": "read-only", "desc": "Read-only Q&A"},
    "plan": {"label": "Plan", "sandbox": "read-only", "desc": "Explore + structured plan"},
}


def load_system_prompt() -> str:
    """Load system prompt from the prompt file."""
    prompt_path = SYSTEM_PROMPT_PATH
    alt_path = Path(__file__).parent.parent / "prompt" / "system.md"

    for path in [prompt_path, alt_path]:
        if path.exists():
            try:
                return path.read_text(encoding="utf-8")
            except Exception:
                pass

    # Check at node/ path as fallback
    node_path = Path.cwd().parent / "node" / "src" / "prompt" / "system.md"
    if node_path.exists():
        try:
            return node_path.read_text(encoding="utf-8")
        except Exception:
            pass

    return FALLBACK_SYSTEM_PROMPT


def run_turn(user_text, messages, provider, cfg, session, signal=None, no_tools=False, on_event=None):
    """Run a single turn: send messages, handle tool calls, return result."""
    if on_event is None:
        on_event = lambda _: None

    # Add user message
    user_msg = {"role": "user", "content": user_text}
    messages.append(user_msg)

    max_iterations = 25 if not no_tools else 1
    iteration = 0
    full_content = ""

    while iteration < max_iterations:
        iteration += 1

        # Prepare messages
        system_prompt = messages[0]["content"] if messages and messages[0]["role"] == "system" else None
        chat_messages = messages[1:] if messages and messages[0]["role"] == "system" else messages

        # Compact messages to fit context window
        chat_messages = _compact_messages(chat_messages)

        tools_config = list(AVAILABLE_TOOLS.values()) if not no_tools else None

        try:
            content = ""
            tool_calls_accum = None
            finish_reason = None

            for chunk, tc, fr in provider.chat_stream(
                messages=[{"role": "system", "content": system_prompt}] + chat_messages if system_prompt else chat_messages,
                tools=tools_config,
            ):
                if chunk:
                    content += chunk
                    on_event({"kind": "token", "content": chunk})
                if tc:
                    tool_calls_accum = tc
                if fr:
                    finish_reason = fr

            full_content += content

        except LLMError as e:
            on_event({"kind": "error", "content": str(e)})
            return {"content": full_content, "finish_reason": "error", "messages": messages}

        # Check for tool calls
        tool_calls = tool_calls_accum
        if not tool_calls:
            # Add assistant response
            if content.strip():
                messages.append({"role": "assistant", "content": content})
            return {"content": full_content, "finish_reason": finish_reason or "stop", "messages": messages}

        # Process tool calls
        assistant_msg = {"role": "assistant", "content": content or None}
        if tool_calls:
            # Convert tool_calls to OpenAI format
            openai_tc = []
            for i, tc in enumerate(tool_calls):
                openai_tc.append({
                    "id": tc.get("id", f"call_{i}"),
                    "type": "function",
                    "function": {
                        "name": tc["function"]["name"],
                        "arguments": tc["function"]["arguments"],
                    }
                })
            assistant_msg["tool_calls"] = openai_tc
        messages.append(assistant_msg)

        # Execute each tool call
        for tc in tool_calls:
            tool_name = tc["function"]["name"]
            try:
                tool_args = json.loads(tc["function"]["arguments"])
            except json.JSONDecodeError:
                tool_args = {}

            on_event({"kind": "tool_start", "name": tool_name, "args": tool_args})

            sandbox = cfg.get("sandbox", {}).get("filesystem", "workspace-write")
            result = execute_tool(tool_name, tool_args, sandbox=sandbox)

            on_event({"kind": "tool_end", "name": tool_name, "result_preview": result[:200]})

            tool_result_msg = {
                "role": "tool",
                "tool_call_id": tc.get("id", ""),
                "content": str(result),
            }
            messages.append(tool_result_msg)

        if no_tools:
            break

    return {"content": full_content, "finish_reason": "max_iterations", "messages": messages}


def _compact_messages(messages, max_tokens=32000):
    """Compact messages to fit within context window by summarizing older ones."""
    if len(messages) <= 10:
        return messages

    # Estimate token count (rough: 4 chars per token)
    total_chars = sum(len(str(m.get("content", ""))) for m in messages)
    if total_chars < max_tokens * 4:
        return messages

    # Keep first system/user context and last 10 messages, summarize the middle
    keep_first = 2
    keep_last = 10
    middle = messages[keep_first:-keep_last]
    rest = messages[-keep_last:]

    if middle:
        summary = {
            "role": "user",
            "content": f"[Previous conversation summarized: {len(middle)} messages omitted]"
        }
        return messages[:keep_first] + [summary] + rest

    return messages
