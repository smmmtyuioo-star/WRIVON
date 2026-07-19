#!/usr/bin/env python3
"""WRIVON CLI entry point — parses args and launches REPL or one-shot mode."""

import sys
import os
import re
from pathlib import Path

from . import __version__
from .config import load_config, validate_config
from .provider import create_provider_chain
from .agent.loop import load_system_prompt, run_turn, CHAT_MODES
from .session import open_session
from .ui.repl import repl
from .ui.render import console


def main():
    """Main entry point."""
    cfg = load_config()
    argv = sys.argv[1:]

    # Handle built-in commands
    if not argv or argv[0] in ("-h", "--help", "help"):
        show_help()
        return

    if argv[0] in ("-v", "--version", "version"):
        console.print(f"WRIVON v{__version__}")
        return

    if argv[0] in ("start",):
        # Start interactive REPL
        _validate_and_launch(cfg)
        return

    if argv[0] in ("setup", "configure"):
        _run_setup()
        return

    if argv[0] == "--list-providers" or argv[0] == "providers":
        providers = cfg.get("providers", {})
        console.print(f"\n  {'Provider':20} {'Model':35} {'Kind':12}")
        console.print(f"  {'-'*20} {'-'*35} {'-'*12}")
        for name, p in providers.items():
            if isinstance(p, dict):
                active = " (ACTIVE)" if name == cfg.get("provider") else ""
                console.print(f"  {name+active:20} {p.get('model','?'):35} {p.get('kind','?'):12}")
        console.print()
        return

    if argv[0] in ("-p", "--print", "--one-shot"):
        msg = " ".join(argv[1:]) if len(argv) > 1 else ""
        if not msg:
            console.print("[yellow]Usage: wrivon --print \"message\"[/]")
            return
        _validate_and_launch(cfg, one_shot=msg)
        return

    if argv[0] in ("-a", "--agent"):
        msg = " ".join(argv[1:]) if len(argv) > 1 else ""
        if not msg:
            console.print("[yellow]Usage: wrivon --agent \"prompt\"[/]")
            return
        _validate_and_launch(cfg, one_shot=msg, full_agent=True)
        return

    # Default: treat first arg as start
    _validate_and_launch(cfg)


def _validate_and_launch(cfg, one_shot="", full_agent=False):
    """Validate config and launch REPL or one-shot mode."""
    warnings, errors = validate_config(cfg)
    for w in warnings:
        console.print(f"[yellow]Warning: {w}[/]")
    for e in errors:
        console.print(f"[red]Error: {e}[/]")
    if errors:
        sys.exit(1)

    # Check git availability
    try:
        import subprocess
        result = subprocess.run(["git", "--version"], capture_output=True, text=True, timeout=5)
        git_avail = result.returncode == 0
    except Exception:
        git_avail = False

    if not git_avail:
        console.print("[yellow]Git not found. Install git to enable commit/push features.[/]")

    try:
        provider = create_provider_chain(cfg)
    except Exception as e:
        console.print(f"[red]Failed to create provider chain: {e}[/]")
        console.print("[yellow]Run 'wrivon setup' to configure API keys.[/]")
        sys.exit(1)

    if one_shot:
        system_prompt = load_system_prompt() if full_agent else (
            "You are WRIVON, a helpful AI assistant. Answer concisely and accurately."
        )
        messages = [{"role": "system", "content": system_prompt}]
        session = open_session(meta={"provider": cfg.get("provider"), "model": cfg.get("model"), "cwd": os.getcwd()})

        result = run_turn(
            user_text=one_shot,
            messages=messages,
            provider=provider,
            cfg=cfg,
            session=session,
            no_tools=not full_agent,
            on_event=lambda evt: (
                console.print(evt.get("content", ""), end="")
                if evt.get("kind") == "token" else None
            ),
        )

        console.print()
        if result.get("finish_reason") == "error":
            sys.exit(1)
    else:
        repl(provider, cfg)


def _run_setup():
    """Interactive setup wizard for API keys."""
    from .ui.render import console as c

    c.print("\n  [bold teal]WRIVON Setup[/]")
    c.print("  [bright_black]" + "─" * 50 + "[/]\n")
    c.print("  This wizard will set up your AI providers.\n")

    providers_config = [
        {
            "name": "NVIDIA NIM",
            "keys": [("NVIDIA_API_KEY", "NVIDIA API key (starts with nvapi-)")],
            "url": "https://build.nvidia.com",
            "desc": "~90 free models (Llama, Nemotron, DeepSeek, Mistral)",
        },
        {
            "name": "Cloudflare Workers AI",
            "keys": [
                ("CLOUDFLARE_API_KEY", "Cloudflare API token"),
                ("CLOUDFLARE_ACCOUNT_ID", "Cloudflare Account ID (hex string)"),
            ],
            "url": "https://dash.cloudflare.com/profile/api-tokens",
            "desc": "10k requests/day free — Llama, Mistral, DeepSeek",
        },
        {
            "name": "Groq",
            "keys": [("GROQ_API_KEY", "Groq API key (starts with gsk_)")],
            "url": "https://console.groq.com/keys",
            "desc": "Fast LPU inference — Llama, Mixtral, Gemma",
        },
    ]

    # Find .env.local (walk up from CWD)
    env_path = None
    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents):
        p = parent / ".env.local"
        if p.exists():
            env_path = p
            break

    if not env_path:
        # Check repo root
        for parent in [cwd] + list(cwd.parents):
            if (parent / "node").exists() or (parent / "python").exists():
                env_path = parent / ".env.local"
                break
        if not env_path:
            env_path = cwd / ".env.local"

    # Load existing env
    env = {}
    if env_path.exists():
        for line in env_path.read_text().split("\n"):
            m = re.match(r"^\s*([A-Za-z_]\w*)\s*=\s*(.+)$", line.strip())
            if m:
                env[m.group(1)] = m.group(2).strip("\"'")
        c.print(f"  [green]Existing .env.local found at {env_path}[/]\n")

    for prov in providers_config:
        if all(k in env and env[k] for k, _ in prov["keys"]):
            c.print(f"  [green]✓[/] {prov['name']} — already configured")
            continue

        c.print(f"\n  [cyan]{prov['name']}[/] — [bright_black]{prov['desc']}[/]")
        c.print(f"    Get a free key: {prov['url']}")

        for key_name, label in prov["keys"]:
            if key_name in env and env[key_name]:
                c.print(f"    [green]✓[/] {label} [bright_black](already set)[/]")
                continue

            val = input(f"    {label}: ").strip()
            if val:
                env[key_name] = val

    # Write .env.local
    lines = []
    for key, val in env.items():
        lines.append(f"{key}={val}")
    env_path.parent.mkdir(parents=True, exist_ok=True)
    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    c.print(f"\n  [green]✓[/] Configuration saved to {env_path}")
    c.print(f"\n  Run [bold cyan]wrivon start[/] to begin.\n")


def show_help():
    """Show help text."""
    console.print(f"""
WRIVON v{__version__} — a CLI AI coding agent.

Usage:
  wrivon start              Interactive REPL
  wrivon --print "msg"      One-shot mode
  wrivon --agent "prompt"   Agent mode (full tools, one-shot)
  wrivon setup              Interactive provider setup
  wrivon providers          List configured providers
  wrivon --help             Show this help
  wrivon --version          Show version

Config: ~/.wrivon/config.json and ./.wrivon/config.json
Providers: NVIDIA NIM, Cloudflare Workers AI, Groq (free)
Modes: /code (edit), /ask (read-only), /plan (explore + plan)

Commands: /help, /model, /diff, /commit, /push, /review, /refactor,
          /status, /map, /sessions, /resume, /export, /build, /clear, /exit
""".strip())
