"""Shell command execution utility."""

import subprocess
import os
import tempfile
from pathlib import Path


def run_bash(command: str, timeout: int = 120000, workdir: str = "") -> str:
    """Execute a shell command and return the output."""
    cwd = workdir if workdir else os.getcwd()
    timeout_sec = timeout / 1000 if timeout else 120

    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=timeout_sec,
        )
        output_parts = []
        if result.stdout:
            output_parts.append(result.stdout)
        if result.stderr:
            output_parts.append(f"STDERR:\n{result.stderr}")
        if result.returncode != 0:
            output_parts.append(f"Exit code: {result.returncode}")

        output = "\n".join(output_parts) if output_parts else "(no output)"

        # Truncate if too large
        if len(output) > 50000:
            output = output[:50000] + "\n... (truncated, 50000 chars)"

        return output

    except subprocess.TimeoutExpired:
        return f"Error: Command timed out after {timeout_sec}s"
    except Exception as e:
        return f"Error executing command: {e}"
