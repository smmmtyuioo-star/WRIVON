---
name: claude-code
description: Delegate coding tasks to Claude Code CLI via bash.
---

# Claude Code — Wrivon Orchestration Guide

Delegate coding tasks to [Claude Code](https://claude.ai/code) (Anthropic's autonomous coding agent CLI) via Wrivon's `bash` tool. Claude Code can read files, write code, run shell commands, and manage git workflows.

## Prerequisites

- `npm install -g @anthropic-ai/claude-code`
- Run `claude` once to log in (OAuth) or set `ANTHROPIC_API_KEY`
- Check: `bash(command="claude --version")`

## Print Mode (One-Shot Tasks — Preferred)

Use `-p` for non-interactive one-shot tasks. No PTY needed.

```
bash(command="claude -p 'Add error handling to all API calls in src/' --allowedTools Read,Edit --max-turns 10", workdir="~/project")
```

Piped input:
```
bash(command="git diff HEAD~3 | claude -p 'Review this diff for bugs' --max-turns 1")
```

Structured JSON output:
```
bash(command="claude -p 'Analyze auth.py for security issues' --output-format json --max-turns 5", workdir="~/project")
```

### Session Continuation
```
bash(command="claude -p 'Start refactoring the database layer' --output-format json --max-turns 10 > /tmp/session.json", workdir="~/project")
bash(command="claude -p 'Add connection pooling' --resume $(cat /tmp/session.json | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"session_id\"])') --max-turns 5", workdir="~/project")
```

## Interactive Mode (Background PTY)

For multi-turn iterative work, start Claude Code in the background:

```
bash(command="cd ~/project && claude", background=true, pty=true)
```

Then send input:
- Wrivon doesn't have a `process` tool. For background processes, use the process monitoring approach.

Or use tmux for full control:
```
bash(command="tmux new-session -d -s cc-work -x 140 -y 40")
bash(command="tmux send-keys -t cc-work 'cd ~/project && claude' Enter")
bash(command="sleep 5 && tmux send-keys -t cc-work 'Refactor the auth module' Enter")
bash(command="sleep 15 && tmux capture-pane -t cc-work -p -S -50")
```

## Parallel Tasks

```
bash(command="tmux new-session -d -s task1 -x 120 -y 40 && tmux send-keys -t task1 'cd ~/project && claude -p \"Fix auth bug in src/auth.py\" --allowedTools Read,Edit --max-turns 10' Enter")
bash(command="tmux new-session -d -s task2 -x 120 -y 40 && tmux send-keys -t task2 'cd ~/project && claude -p \"Write integration tests\" --allowedTools Read,Write,Bash --max-turns 15' Enter")
bash(command="sleep 30 && for s in task1 task2; do echo '=== '$s' ==='; tmux capture-pane -t $s -p -S -5; done")
```

## Key CLI Flags

| Flag | Purpose |
|------|---------|
| `-p "query"` | Print mode (non-interactive) |
| `--max-turns <n>` | Cap agentic loops (print mode) |
| `--allowedTools <tools>` | Whitelist tools (Read, Edit, Write, Bash) |
| `--output-format json` | Structured JSON output |
| `--model <model>` | Model: sonnet, opus, haiku |
| `--dangerously-skip-permissions` | Auto-approve all tool use |
| `-c` / `--continue` | Resume most recent session |

## Rules

1. Prefer `-p` print mode for single tasks — no dialog handling needed
2. Set `workdir` to keep Claude in the right project directory
3. Always use `--max-turns` in print mode to prevent runaway costs
4. Use parallel sessions for independent tasks
5. Report results: summarize what changed, test outcomes, next steps
