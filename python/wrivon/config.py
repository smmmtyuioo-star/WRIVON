import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

from .shared import load_shared_config


def _build_defaults():
    """Build DEFAULT_CONFIG from the shared wrivon.config.json + env vars."""
    shared = load_shared_config()
    providers = {}

    for name, pdef in shared.get("providers", {}).items():
        env = pdef.get("env", {})
        p = {
            "baseUrl": os.environ.get(env.get("baseUrl", ""), pdef.get("base_url", "")),
            "apiKey": os.environ.get(env.get("apiKey", ""), ""),
            "model": os.environ.get(env.get("model", ""), pdef.get("models", {}).get("default", "")),
            "fastModel": pdef.get("models", {}).get("fast", ""),
            "powerfulModel": pdef.get("models", {}).get("powerful", ""),
            "kind": pdef.get("kind", "openai"),
        }
        if env.get("accountId"):
            p["accountId"] = os.environ.get(env["accountId"], "")
        providers[name] = p

    d = shared.get("defaults", {})
    return {
        "provider": shared.get("default_provider", "nvidia"),
        "model": shared.get("default_model", "deepseek-ai/deepseek-v4-flash"),
        "providers": providers,
        "sandbox": d.get("sandbox", {"filesystem": "workspace-write", "network": "allow"}),
        "ui": d.get("ui", {"stream": True, "showTools": True}),
    }


DEFAULT_CONFIG = _build_defaults()


def find_env_file():
    """Find .env.local — walk up from CWD to find it."""
    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents):
        env_path = parent / ".env.local"
        if env_path.exists():
            return env_path
    return None


def load_env():
    """Load .env.local into process environment."""
    env_path = find_env_file()
    if env_path:
        load_dotenv(env_path)


def expand_env(value):
    """Expand env:VARNAME references."""
    if not isinstance(value, str):
        return value
    if not value.startswith("env:"):
        return value
    name = value[4:]
    return os.environ.get(name, "")


def read_json(path):
    """Read and parse a JSON file, returning None on failure."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def deep_merge(base, override):
    """Deep merge two dicts."""
    if override is None:
        return base
    if not isinstance(base, dict) or not isinstance(override, dict):
        return override
    out = dict(base)
    for k, v in override.items():
        out[k] = deep_merge(base.get(k), v) if k in base else v
    return out


def load_config():
    """Load and merge config from ~/.wrivon/config.json and ./.wrivon/config.json."""
    load_env()

    cfg = dict(DEFAULT_CONFIG)

    user_cfg_path = Path.home() / ".wrivon" / "config.json"
    user_cfg = read_json(user_cfg_path)
    if user_cfg:
        cfg = deep_merge(cfg, user_cfg)

    proj_cfg_path = Path.cwd() / ".wrivon" / "config.json"
    proj_cfg = read_json(proj_cfg_path)
    if proj_cfg:
        cfg = deep_merge(cfg, proj_cfg)

    # Expand env: references in provider strings
    for pname, pdata in cfg.get("providers", {}).items():
        if isinstance(pdata, dict):
            for key in list(pdata.keys()):
                pdata[key] = expand_env(pdata[key])

    # Re-read env vars for apiKey (they may have been set via load_env)
    for pname, pdata in cfg.get("providers", {}).items():
        if isinstance(pdata, dict):
            shared = load_shared_config()
            if pname in shared.get("providers", {}):
                env_map = shared["providers"][pname].get("env", {})
                for config_key, env_var in env_map.items():
                    val = os.environ.get(env_var)
                    if val and not pdata.get(config_key):
                        pdata[config_key] = val

    # CLI overrides
    argv = sys.argv[1:]
    for i, a in enumerate(argv):
        if a == "--provider" and i + 1 < len(argv):
            cfg["provider"] = argv[i + 1]
        elif a == "--model" and i + 1 < len(argv):
            cfg["model"] = argv[i + 1]
            if cfg["provider"] in cfg.get("providers", {}):
                cfg["providers"][cfg["provider"]]["model"] = argv[i + 1]
        elif a == "--base-url" and i + 1 < len(argv):
            p = cfg.get("providers", {}).get(cfg.get("provider", ""))
            if p:
                p["baseUrl"] = argv[i + 1]
        elif a == "--api-key" and i + 1 < len(argv):
            p = cfg.get("providers", {}).get(cfg.get("provider", ""))
            if p:
                p["apiKey"] = argv[i + 1]
        elif a == "--no-stream":
            cfg["ui"]["stream"] = False

    return cfg


def validate_config(cfg):
    """Validate config, return (warnings, errors)."""
    warnings = []
    errors = []
    provider = cfg.get("provider")
    providers = cfg.get("providers", {})

    if provider not in providers:
        errors.append(f'Provider "{provider}" not found in config')

    for name, p in providers.items():
        if not isinstance(p, dict):
            continue
        if not p.get("kind"):
            errors.append(f'Provider "{name}" has no "kind" field')
        if not p.get("baseUrl"):
            warnings.append(f'Provider "{name}" has no baseUrl')

    if not any(
        isinstance(p, dict) and p.get("apiKey")
        for p in providers.values()
    ):
        warnings.append("No API keys found — API calls will likely fail")

    return warnings, errors
