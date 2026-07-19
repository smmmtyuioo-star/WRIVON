"""Interactive REPL — command line interface."""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from prompt_toolkit import PromptSession
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.styles import Style
from prompt_toolkit.formatted_text import FormattedText

from .render import (
    render_header, render_event, render_markdown,
    render_table, render_model_picker, render_splash_small,
    console,
)
from ..agent.loop import run_turn, load_system_prompt, CHAT_MODES
from ..agent.build import run_build, get_build_label
from ..config import load_config, validate_config
from ..provider import create_provider_chain
from ..session import open_session, save_session, list_sessions, resume_session, generate_id
from ..llm import LLMError

PROMPT_STYLE = Style.from_dict({
    "prompt": "ansiteal bold",
    "input": "white",
})


COMMANDS = {
    "/help": "Show all commands",
    "/exit": "Quit",
    "/clear": "Clear conversation (keeps system prompt)",
    "/model": "Interactive model picker (1=Fast, 2=Power)",
    "/models": "List available models for current provider",
    "/provider": "Switch provider",
    "/providers": "List all configured providers",
    "/diff": "Show git diff (uncommitted, staged, HEAD~1)",
    "/commit": "Stage all + commit (auto-generates message)",
    "/push": "Push current branch to remote",
    "/review": "Code review",
    "/refactor": "Refactoring mode",
    "/status": "Show mode, model, provider, session stats",
    "/map": "Show project structure",
    "/sessions": "List past sessions",
    "/resume": "Load a past session",
    "/export": "Export session as markdown or JSON",
    "/build": "Full-stack one-shot app builder",
    "/skills": "List available skill packs",
    "/knowledge": "List available knowledge domains",
}


def repl(provider, cfg):
    """Start the interactive REPL."""
    render_header()
    render_splash_small()

    mode = cfg.get("mode", "code")
    chat_mode = CHAT_MODES.get(mode, CHAT_MODES["code"])
    sandbox = cfg.get("sandbox", {}).get("filesystem", chat_mode["sandbox"])

    system_prompt = load_system_prompt()
    messages = [{"role": "system", "content": system_prompt}]
    session = open_session(meta={"provider": cfg.get("provider"), "model": cfg.get("model"), "cwd": os.getcwd()})

    history_file = Path.home() / ".wrivon" / "history.txt"
    history_file.parent.mkdir(parents=True, exist_ok=True)

    session_ps = PromptSession(
        history=FileHistory(str(history_file)),
        auto_suggest=AutoSuggestFromHistory(),
        style=PROMPT_STYLE,
    )

    custom_dynamic_prompt = ""

    while True:
        try:
            # Build prompt
            model_label = cfg.get("model", "")
            mode_label = chat_mode["label"]
            prompt_tokens = [
                ("class:prompt", f"wrivon[{mode_label}] "),
                ("", f"{cfg.get('provider', '?')} "),
            ]
            if custom_dynamic_prompt:
                prompt_tokens.append(("", f"({custom_dynamic_prompt}) "))
            prompt_tokens.append(("class:input", "> "))

            user_input = session_ps.prompt(FormattedText(prompt_tokens))

        except (EOFError, KeyboardInterrupt):
            console.print("\n[yellow]Use /exit to quit[/]")
            continue

        user_input = user_input.strip()
        if not user_input:
            continue

        # Handle commands
        if user_input.startswith("/"):
            result = handle_command(user_input, provider, cfg, session, messages, mode)
            if result == "exit":
                break
            elif result is not None:
                # Command might change mode, provider, etc.
                if isinstance(result, dict):
                    if "mode" in result:
                        mode = result["mode"]
                        chat_mode = CHAT_MODES.get(mode, CHAT_MODES["code"])
                        cfg["sandbox"] = cfg.get("sandbox", {})
                        cfg["sandbox"]["filesystem"] = chat_mode["sandbox"]
                    if "provider" in result:
                        cfg["provider"] = result["provider"]
                    if "new_provider" in result:
                        provider = result["new_provider"]
            continue

        # Process user message
        try:
            result = run_turn(
                user_text=user_input,
                messages=messages,
                provider=provider,
                cfg=cfg,
                session=session,
                no_tools=sandbox == "read-only",
                on_event=render_event,
            )

            console.print()

            # Save session
            save_session(session, messages)

            if result.get("finish_reason") == "error":
                console.print(f"[red]Error:[/] {result.get('content', '')}")

        except Exception as e:
            console.print(f"[red]Error:[/] {e}")

    # Save on exit
    save_session(session, messages)


def handle_command(cmd: str, provider, cfg, session, messages, current_mode):
    """Handle a REPL command."""
    parts = cmd.split()
    command = parts[0].lower()
    args = parts[1:]

    if command == "/exit" or command == "/quit":
        console.print("[yellow]Goodbye![/]")
        return "exit"

    elif command == "/help":
        console.print(f"\n  [bold]WRIVON Commands[/]\n")
        for name, desc in COMMANDS.items():
            console.print(f"  [cyan]{name:15}[/] [bright_black]{desc}[/]")
        console.print()
        return

    elif command == "/clear":
        system = messages[0] if messages and messages[0]["role"] == "system" else None
        messages.clear()
        if system:
            messages.append(system)
        console.print("[green]Conversation cleared[/]")
        return

    elif command == "/model":
        return handle_model(provider, cfg, args)

    elif command == "/models" or command == "/provider":
        return handle_provider(provider, cfg, args)

    elif command == "/providers":
        providers = cfg.get("providers", {})
        rows = []
        for name, p in providers.items():
            if isinstance(p, dict):
                active = "[green]ACTIVE[/]" if name == cfg.get("provider") else ""
                rows.append([name, p.get("model", "?"), p.get("kind", "?"), active])
        render_table(["Provider", "Model", "Kind", ""], rows)
        return

    elif command == "/status":
        print_status(cfg, messages, session)
        return

    elif command == "/diff":
        return run_git("diff", args)

    elif command == "/commit":
        return handle_commit(args)

    elif command == "/push":
        return run_git("push", args)

    elif command == "/review":
        return run_git("diff", args + ["--cached"])

    elif command == "/refactor":
        console.print("[yellow]Refactoring mode[/] — preparing context...")
        return

    elif command == "/map":
        return show_project_map()

    elif command == "/sessions":
        all_flag = "--all" in args
        sessions = list_sessions(all_flag)
        if not sessions:
            console.print("[yellow]No saved sessions[/]")
            return
        rows = []
        for s in sessions:
            rows.append([s["id"], s.get("meta", {}).get("provider", "?"), str(s["messages"])])
        render_table(["Session ID", "Provider", "Messages"], rows)
        return

    elif command == "/resume":
        if not args:
            console.print("[yellow]Usage: /resume <session_id>[/]")
            return
        sess = resume_session(args[0])
        if not sess or not sess.get("messages"):
            console.print(f"[red]Session not found: {args[0]}[/]")
            return
        # Replace current messages
        messages.clear()
        system = {"role": "system", "content": load_system_prompt()}
        messages.append(system)
        for msg in sess["messages"]:
            if msg.get("role") != "system":
                messages.append(msg)
        console.print(f"[green]Resumed session: {args[0]} ({len(messages)} messages)[/]")
        return

    elif command == "/export":
        return export_session(session, messages, args)

    elif command == "/build":
        return handle_build(provider, cfg, args)

    elif command == "/skills":
        console.print("[yellow]Skills: Python version — listing bundled skill packs (coming soon)[/]")
        return

    elif command == "/knowledge":
        console.print("[yellow]Knowledge: Python version — domain knowledge (coming soon)[/]")
        return

    elif command == "/mode":
        if args:
            new_mode = args[0].lower()
            if new_mode in CHAT_MODES:
                current_mode = new_mode
                console.print(f"[green]Switched to {CHAT_MODES[new_mode]['label']} mode[/]")
                return {"mode": new_mode}
            else:
                console.print(f"[yellow]Unknown mode: {new_mode}. Use: code, ask, plan[/]")
                return
        rows = []
        for m, info in CHAT_MODES.items():
            active = "[green]ACTIVE[/]" if m == current_mode else ""
            rows.append([m, info["desc"], active])
        render_table(["Mode", "Description", ""], rows)
        return

    elif command == "/code" or command == "/ask" or command == "/plan":
        new_mode = command[1:]  # Remove /
        if new_mode in CHAT_MODES:
            console.print(f"[green]Switched to {CHAT_MODES[new_mode]['label']} mode[/]")
            return {"mode": new_mode}
        return

    else:
        console.print(f"[yellow]Unknown command: {command}. Type /help for available commands.[/]")


def handle_model(provider, cfg, args):
    """Handle /model command."""
    if args:
        # Set model by ID
        cfg["model"] = args[0]
        p = cfg.get("providers", {}).get(cfg.get("provider", ""))
        if isinstance(p, dict):
            p["model"] = args[0]
        console.print(f"[green]Model set to: {args[0]}[/]")
        return

    # Show model picker
    p = cfg.get("providers", {}).get(cfg.get("provider", ""))
    if not isinstance(p, dict):
        console.print("[yellow]No provider selected[/]")
        return

    models = [
        {"num": "1", "id": p.get("fastModel", p.get("model", "")), "label": "Fast"},
        {"num": "2", "id": p.get("model", ""), "label": "Current"},
        {"num": "3", "id": p.get("powerfulModel", p.get("model", "")), "label": "Power"},
    ]
    render_model_picker(models, cfg.get("model", ""))

    try:
        choice = input("  Select (1-3): ").strip()
        if choice in ("1", "2", "3"):
            idx = int(choice) - 1
            model_id = models[idx]["id"]
            if model_id:
                cfg["model"] = model_id
                p["model"] = model_id
                console.print(f"[green]Model set to: {model_id}[/]")
            else:
                console.print("[yellow]No model configured for that slot[/]")
        else:
            console.print("[yellow]Invalid choice[/]")
    except (EOFError, KeyboardInterrupt):
        console.print()


def handle_provider(provider, cfg, args):
    """Handle /provider command."""
    if args:
        name = args[0]
        if name in cfg.get("providers", {}):
            cfg["provider"] = name
            try:
                new_provider = create_provider_chain(cfg)
                console.print(f"[green]Switched to provider: {name}[/]")
                return {"provider": name, "new_provider": new_provider}
            except LLMError as e:
                console.print(f"[red]Error: {e}[/]")
                return
        else:
            console.print(f"[yellow]Provider not found: {name}[/]")
            return

    # List providers
    providers = cfg.get("providers", {})
    rows = []
    for name, p in providers.items():
        if isinstance(p, dict):
            active = "[green]ACTIVE[/]" if name == cfg.get("provider") else ""
            rows.append([name, p.get("model", "?"), active])
    if rows:
        render_table(["Provider", "Model", ""], rows)


def handle_build(provider, cfg, args):
    """Handle /build command."""
    prompt = " ".join(args) if args else ""
    if not prompt:
        console.print("[yellow]Usage: /build <description of app to build>[/]")
        return

    console.print(f"\n  [bold]Build mode[/] — generating {prompt}...\n")

    result = run_build(prompt, provider, cfg)

    if result.get("error"):
        console.print(f"[red]Build failed: {result['error']}[/]")
        return

    # Render results
    for f in result.get("filesCreated", []):
        render_event({"kind": "file_created", "path": f, "size": 0})
    for f in result.get("filesFailed", []):
        render_event({"kind": "file_failed", "path": f["file"], "error": f["error"]})

    render_event({
        "kind": "build_summary",
        "summary": result,
    })


def handle_commit(args):
    """Handle /commit command."""
    msg = " ".join(args) if args else ""
    try:
        # Stage all
        subprocess.run(["git", "add", "-A"], capture_output=True, text=True)

        if not msg:
            # Auto-generate message from diff
            diff_result = subprocess.run(["git", "diff", "--cached"], capture_output=True, text=True)
            if diff_result.stdout.strip():
                lines = diff_result.stdout.strip().split("\n")
                msg = "wrivon: automated commit"
            else:
                console.print("[yellow]No changes to commit[/]")
                return

        result = subprocess.run(["git", "commit", "-m", msg], capture_output=True, text=True)
        if result.returncode == 0:
            console.print(f"[green]✓ Committed:[/] {result.stdout.strip()[:200]}")
        else:
            console.print(f"[red]Commit failed:[/] {result.stderr.strip()[:200]}")

    except FileNotFoundError:
        console.print("[red]Git not found. Install git to use this command.[/]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/]")


def run_git(subcmd, args):
    """Run a git subcommand."""
    try:
        cmd = ["git", subcmd] + args
        result = subprocess.run(cmd, capture_output=True, text=True)
        output = result.stdout or result.stderr
        if output:
            console.print(output[:2000])
        else:
            console.print(f"[yellow]No output from git {subcmd}[/]")
    except FileNotFoundError:
        console.print("[red]Git not found[/]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/]")


def print_status(cfg, messages, session):
    """Print current status."""
    provider_name = cfg.get("provider", "?")
    p = cfg.get("providers", {}).get(provider_name, {})
    model = cfg.get("model", p.get("model", "?")) if isinstance(p, dict) else "?"
    msg_count = len(messages)
    session_id = session.get("id", "?") if session else "?"

    console.print(f"\n  [bold]Status[/]")
    console.print(f"  Provider: [cyan]{provider_name}[/]")
    console.print(f"  Model:    [cyan]{model}[/]")
    console.print(f"  Messages: {msg_count}")
    console.print(f"  Session:  [bright_black]{session_id}[/]")
    console.print()


def show_project_map():
    """Show project structure."""
    try:
        result = subprocess.run(
            "Get-ChildItem -Recurse -Depth 2 -Directory | Select-Object -ExpandProperty FullName",
            shell=True, capture_output=True, text=True, timeout=10
        )
        if result.stdout:
            lines = result.stdout.strip().split("\n")
            console.print("\n  [bold]Project Structure[/]\n")
            for line in lines[:50]:
                console.print(f"  [bright_black]{line}[/]")
            console.print()
    except Exception:
        # Fallback to os.walk
        console.print("\n  [bold]Project Structure[/]\n")
        for root, dirs, files in os.walk(os.getcwd()):
            depth = root.replace(os.getcwd(), "").count(os.sep)
            if depth > 3:
                continue
            indent = "  " * (depth + 1)
            console.print(f"  {indent}{os.path.basename(root)}/")
            for f in files[:5]:
                console.print(f"  {indent}  {f}")
        console.print()


def export_session(session, messages, args):
    """Export session as markdown or JSON."""
    if not messages:
        console.print("[yellow]No messages to export[/]")
        return

    export_json = "--json" in args
    session_id = session.get("id", generate_id()) if session else generate_id()
    export_dir = Path.cwd() / ".wrivon" / "exports"
    export_dir.mkdir(parents=True, exist_ok=True)

    if export_json:
        path = export_dir / f"session-{session_id}.json"
        export_data = {
            "session_id": session_id,
            "exported_at": datetime.now().isoformat(),
            "messages": messages,
        }
        path.write_text(json.dumps(export_data, indent=2, ensure_ascii=False), encoding="utf-8")
    else:
        path = export_dir / f"session-{session_id}.md"
        lines = [f"# WRIVON Session: {session_id}\n"]
        for msg in messages:
            role = msg.get("role", "unknown")
            content = str(msg.get("content", ""))
            if content:
                lines.append(f"## {role.capitalize()}\n\n{content}\n")
        path.write_text("\n".join(lines), encoding="utf-8")

    console.print(f"[green]Session exported: {path}[/]")
