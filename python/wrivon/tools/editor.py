"""File read, write, and edit utilities."""

import os
from pathlib import Path


def read_file(file_path: str) -> str:
    """Read a file and return its content with line numbers."""
    path = Path(file_path)
    if not path.exists():
        return f"Error: File not found: {file_path}"
    try:
        content = path.read_text(encoding="utf-8")
        lines = content.split("\n")
        numbered = [f"{i+1}: {line}" for i, line in enumerate(lines)]
        return "\n".join(numbered)
    except Exception as e:
        return f"Error reading file: {e}"


def write_file(file_path: str, content: str) -> str:
    """Write content to a file."""
    path = Path(file_path)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return f"File written: {file_path} ({len(content)} bytes)"
    except Exception as e:
        return f"Error writing file: {e}"


def edit_file(file_path: str, old_string: str, new_string: str) -> str:
    """Edit a file by replacing old_string with new_string."""
    path = Path(file_path)
    if not path.exists():
        return f"Error: File not found: {file_path}"
    try:
        content = path.read_text(encoding="utf-8")
        if old_string not in content:
            return f"Error: oldString not found in {file_path}"
        count = content.count(old_string)
        if count > 1:
            return f"Error: Found {count} matches for oldString in {file_path}. Provide more context."
        new_content = content.replace(old_string, new_string)
        path.write_text(new_content, encoding="utf-8")
        return f"File edited: {file_path} ({len(content)} -> {len(new_content)} bytes)"
    except Exception as e:
        return f"Error editing file: {e}"
