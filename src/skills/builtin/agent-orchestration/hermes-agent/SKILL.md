---
name: hermes-agent
description: Configure, extend, or spawn Hermes Agent instances.
---

# Hermes Agent — Wrivon Orchestration Guide

[Hermes Agent](https://github.com/NousResearch/hermes-agent) by Nous Research is an open-source AI agent framework (CLI, desktop, messaging, IDE). It runs the same agent core across multiple surfaces and supports 20+ LLM providers.

## Quick Start

```
bash(command="curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash")
bash(command="hermes setup")
bash(command="hermes doctor")
```

## Wrivon ↔ Hermes Integration

### One-Shot Tasks

```
bash(command="hermes chat -q 'Research GRPO papers and write summary to ~/research/grpo.md'", timeout=300)
```

### Background for Long Tasks

```
bash(command="hermes chat -q 'Set up CI/CD for ~/myapp'", background=true)
```

### Interactive via tmux

```
bash(command="tmux new-session -d -s h-agent -x 120 -y 40 'hermes'")
bash(command="sleep 8 && tmux send-keys -t h-agent 'Build a FastAPI auth service' Enter")
bash(command="sleep 20 && tmux capture-pane -t h-agent -p -S -30")
bash(command="tmux send-keys -t h-agent 'Add rate limiting middleware' Enter")
bash(command="tmux send-keys -t h-agent '/exit' Enter && sleep 2 && tmux kill-session -t h-agent")
```

### Session Resume

```
bash(command="tmux new-session -d -s resumed 'hermes --continue'")
bash(command="tmux new-session -d -s resumed 'hermes --resume 20260225_143052_a1b2c3'")
```

## Multi-Agent Coordination

```
bash(command="tmux new-session -d -s backend -x 120 -y 40 'hermes -w'")
bash(command="sleep 8 && tmux send-keys -t backend 'Build REST API for user management' Enter")
bash(command="tmux new-session -d -s frontend -x 120 -y 40 'hermes -w'")
bash(command="sleep 8 && tmux send-keys -t frontend 'Build React dashboard' Enter")
bash(command="tmux capture-pane -t backend -p | tail -20")
```

## Key CLI Commands

| Command | Purpose |
|---------|---------|
| `hermes` | Interactive chat |
| `hermes chat -q "query"` | Single query |
| `hermes setup` | Setup wizard |
| `hermes model` | Model/provider picker |
| `hermes doctor` | Health check |
| `hermes tools` | Enable/disable toolsets |
| `hermes skills install <id>` | Install a skill |
| `hermes -w` | Isolated git worktree mode |
| `hermes -p <profile>` | Use a named profile |
| `hermes dashboard` | Web admin panel |
| `hermes gateway run` | Start messaging gateway |

## Key Config Sections

| Section | Key options |
|---------|-------------|
| `model` | `default`, `provider`, `base_url` |
| `agent` | `max_turns` (90) |
| `terminal` | `backend` (local/docker/ssh), `cwd` |
| `display` | `skin`, `interface` (cli/tui) |
| `delegation` | `model`, `max_iterations` |
| `memory` | `enabled`, `provider` |

## Important Notes for Wrivon Agents

- Hermes uses `AGENTS.md`, `.hermes.md`, or `CLAUDE.md` for project context
- Toolsets are configured per-platform via `hermes tools`
- Use `delegate_task` for subagents (Wrivon's equivalent is the `task` tool)
- Prompt caching is sacred — changes take effect on `/reset`, not mid-session
- Prefer `hermes chat -q` for fire-and-forget tasks (no PTY needed)
- Use tmux for interactive sessions requiring multi-turn conversation
