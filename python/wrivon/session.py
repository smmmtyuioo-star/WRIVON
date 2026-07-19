import json
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

SESSIONS_DIR = Path.home() / ".wrivon" / "sessions"


def _ensure_dir():
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)


def _session_path(session_id: str) -> Path:
    return SESSIONS_DIR / f"{session_id}.jsonl"


def generate_id() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def open_session(previous_id: Optional[str] = None, meta: Optional[dict] = None) -> dict:
    """Create or resume a session."""
    _ensure_dir()
    if previous_id:
        path = _session_path(previous_id)
        if path.exists():
            messages = []
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        try:
                            messages.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
            return {"id": previous_id, "messages": messages, "path": str(path)}
    session_id = generate_id()
    path = _session_path(session_id)
    meta_entry = {"role": "system", "meta": meta or {}, "timestamp": datetime.now().isoformat()}
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(meta_entry) + "\n")
    return {"id": session_id, "messages": [], "path": str(path)}


def save_session(session: dict, messages: list):
    """Append new messages to the session file."""
    if not session or not session.get("path"):
        return
    path = Path(session["path"])
    with open(path, "a", encoding="utf-8") as f:
        for msg in messages:
            f.write(json.dumps(msg, ensure_ascii=False) + "\n")


def list_sessions(all_sessions: bool = False) -> list:
    """List all past sessions."""
    _ensure_dir()
    sessions = []
    for f in sorted(SESSIONS_DIR.glob("*.jsonl"), reverse=True):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                first = fp.readline().strip()
                meta = json.loads(first) if first else {}
            sessions.append({
                "id": f.stem,
                "meta": meta.get("meta", {}),
                "timestamp": meta.get("timestamp", ""),
                "messages": sum(1 for _ in open(f, "r")),
                "path": str(f),
            })
        except (json.JSONDecodeError, IOError):
            continue
        if not all_sessions and len(sessions) >= 20:
            break
    return sessions


def resume_session(session_id: str) -> Optional[dict]:
    """Load a specific session."""
    return open_session(previous_id=session_id)
