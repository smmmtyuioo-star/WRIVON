"""Shared config loader — reads wrivon.config.json from the repo root."""

import json
from pathlib import Path

_cache = {"config": None}


def load_shared_config():
    """Find and load wrivon.config.json by walking up directory tree."""
    if _cache["config"] is not None:
        return _cache["config"]

    current = Path(__file__).resolve().parent  # python/wrivon/
    for _ in range(10):
        candidate = current / "wrivon.config.json"
        if candidate.exists():
            _cache["config"] = json.loads(candidate.read_text(encoding="utf-8"))
            return _cache["config"]
        parent = current.parent
        if parent == current:
            break
        current = parent

    # Fallback: check next to repo root markers
    current = Path(__file__).resolve().parent.parent.parent  # repo root
    candidate = current / "wrivon.config.json"
    if candidate.exists():
        _cache["config"] = json.loads(candidate.read_text(encoding="utf-8"))
        return _cache["config"]

    raise FileNotFoundError(
        "wrivon.config.json not found. Expected it at the repository root "
        "next to node/ and python/ directories."
    )


def get_provider_order():
    return load_shared_config().get("provider_fallback_order", [])


def get_commands():
    return load_shared_config().get("commands", {})


def get_chat_modes():
    return load_shared_config().get("chat_modes", {})


def get_tools():
    return load_shared_config().get("tools", {})


def get_defaults():
    return load_shared_config().get("defaults", {})
