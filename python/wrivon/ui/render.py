"""Render utilities — colored terminal output using Rich."""

import re
from rich.console import Console
from rich.markdown import Markdown
from rich.syntax import Syntax
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box

console = Console()

# Color constants matching Node version
CYAN = "cyan"
GREEN = "green"
YELLOW = "yellow"
RED = "red"
GRAY = "bright_black"
TEAL = "dark_cyan"
BOLD = "bold"


def render_header():
    """Render the WRIVON splash header."""
    console.print()
    console.print(Panel(
        Text.from_markup(f"[bold {TEAL}]WRIVON[/bold {TEAL}] [bright_black]v0.2[/bright_black] — [italic]a CLI AI coding agent[/italic]"),
        box=box.ROUNDED,
        border_style=TEAL,
    ))
    console.print()


def render_event(event: dict):
    """Render a single event from the agent loop."""
    kind = event.get("kind", "")

    if kind == "token":
        content = event.get("content", "")
        console.print(content, end="", style="white")

    elif kind == "tool_start":
        name = event.get("name", "")
        args = event.get("args", {})
        args_preview = ", ".join(f"{k}={str(v)[:50]}" for k, v in args.items())
        console.print()
        console.print(f"  [{CYAN}]►[/] [{BOLD}]{name}[/]({args_preview})", style=CYAN)

    elif kind == "tool_end":
        name = event.get("name", "")
        preview = str(event.get("result_preview", ""))
        status = GREEN if "Error" not in preview else RED
        console.print(f"  [{GRAY}]  └─ {name} →[/] [{status}]{preview[:100]}[/]")

    elif kind == "error":
        console.print(f"[{RED}]✗ Error:[/] {event.get('content', '')}")

    elif kind == "plan_ready":
        console.print(f"\n  [{GREEN}]✓[/] [{BOLD}]Plan generated[/] — {event.get('fileCount', 0)} files")

    elif kind == "file_created":
        console.print(f"  [{GREEN}]✓[/] Created: {event.get('path', '')}")
        console.print(f"     [{GRAY}]{event.get('size', 0)} bytes[/]")

    elif kind == "file_failed":
        console.print(f"  [{RED}]✗ Failed:[/] {event.get('path', '')}")
        console.print(f"     [{GRAY}]{event.get('error', '')}[/]")

    elif kind == "install_start":
        console.print(f"\n  [{YELLOW}]⟳[/] Installing dependencies...")

    elif kind == "install_done":
        status = GREEN if event.get("ok") else RED
        console.print(f"  [{status}]✓[/] Install {'succeeded' if event.get('ok') else 'failed'}")

    elif kind == "build_summary":
        summary = event.get("summary", {})
        console.print()
        console.print(Panel(
            f"[bold green]Build Complete: {summary.get('appName', '')}[/]\n\n"
            f"Files created: {len(summary.get('filesCreated', []))}\n"
            f"Files failed: {len(summary.get('filesFailed', []))}\n"
            f"Install: {'✓' if summary.get('installOk') else '✗'}\n"
            f"Run: {summary.get('runCommand', 'None')}",
            box=box.ROUNDED,
            border_style="green",
        ))


def render_markdown(text: str):
    """Render markdown content."""
    console.print(Markdown(text))


def render_code_block(code: str, language: str = ""):
    """Render a syntax-highlighted code block."""
    try:
        syntax = Syntax(code, language or "text", theme="monokai", line_numbers=True)
        console.print(syntax)
    except Exception:
        console.print(code)


def render_table(headers: list, rows: list, title: str = ""):
    """Render a table."""
    table = Table(title=title, box=box.ROUNDED, border_style="bright_black")
    for h in headers:
        table.add_column(h, style=CYAN)
    for row in rows:
        table.add_row(*[str(c) for c in row])
    console.print(table)


def render_model_picker(models: list, current: str):
    """Render the model picker."""
    console.print(f"\n  [{BOLD}]Select a model tier:[/]\n")
    for m in models:
        marker = "[green]►[/]" if m["id"] == current else " "
        console.print(f"  {marker} [{CYAN}]{m['num']}[/] {m['label']:15} [{GRAY}]{m['id']}[/]")
    console.print()


def render_splash_small():
    """Render a minimal splash."""
    console.print(f"[{TEAL}]WRIVON[/] [bright_black]v0.2[/] — Type /help for commands")
