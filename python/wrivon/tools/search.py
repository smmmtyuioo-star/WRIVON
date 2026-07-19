"""File search utilities — glob and grep."""

import os
import re
from pathlib import Path


def glob_files(pattern: str, path: str = "") -> str:
    """Find files matching a glob pattern."""
    search_dir = Path(path) if path else Path.cwd()
    if not search_dir.exists():
        return f"Error: Directory not found: {path}"

    try:
        matches = list(search_dir.rglob(pattern))
        if not matches:
            return f"No files found matching '{pattern}' in {search_dir}"
        return "\n".join(str(m.relative_to(search_dir)) for m in matches)
    except Exception as e:
        return f"Error in glob: {e}"


def grep_files(pattern: str, path: str = "", include: str = "") -> str:
    """Search file contents using a regex pattern."""
    search_dir = Path(path) if path else Path.cwd()
    if not search_dir.exists():
        return f"Error: Directory not found: {path}"

    results = []
    try:
        regex = re.compile(pattern)
    except re.error as e:
        return f"Error in regex: {e}"

    try:
        for file_path in search_dir.rglob("*"):
            if file_path.is_dir():
                continue
            if "__pycache__" in file_path.parts:
                continue
            if file_path.suffix == ".pyc":
                continue
            if include:
                if not file_path.match(include) and not file_path.suffix == include:
                    continue
            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
                for i, line in enumerate(content.split("\n"), 1):
                    if regex.search(line):
                        results.append(f"{file_path.relative_to(search_dir)}:{i}: {line[:200]}")
            except (IOError, OSError):
                continue

        if not results:
            return f"No matches found for '{pattern}' in {search_dir}"
        return "\n".join(results)
    except Exception as e:
        return f"Error in grep: {e}"
