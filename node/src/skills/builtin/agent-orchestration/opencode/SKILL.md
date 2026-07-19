---
name: opencode
description: Delegate coding to OpenCode CLI via bash (run/PR review).
---

# OpenCode CLI — Wrivon Orchestration Guide

Use [OpenCode](https://opencode.ai) as an autonomous coding worker via Wrivon's `bash` tool. OpenCode is a provider-agnostic, open-source AI coding agent.

## Prerequisites

- `npm i -g opencode` or `npm i -g opencode-ai@latest`
- Auth: `bash(command="opencode auth login")` or set provider env vars
- Verify: `bash(command="opencode --version")`
- Git repo recommended for code tasks

## One-Shot Tasks (opencode run)

```
bash(command="opencode run 'Add retry logic to API calls and update tests'", workdir="~/project")
```

Attach context files:
```
bash(command="opencode run 'Review this config for security' -f config.yaml -f .env.example", workdir="~/project")
```

Force a specific model:
```
bash(command="opencode run 'Refactor auth module' --model openrouter/anthropic/claude-sonnet-4", workdir="~/project")
```

## Interactive Sessions (Background)

For iterative work, start the TUI in background:
```
bash(command="opencode", workdir="~/project", background=true, pty=true)
```

Exit with Ctrl+C or kill the process. Do NOT use `/exit` — it opens an agent selector.

### Resuming Sessions
```
bash(command="opencode -c", workdir="~/project", background=true, pty=true)  # Continue last
bash(command="opencode -s ses_abc123", workdir="~/project", background=true, pty=true)  # Specific
```

## Common Flags

| Flag | Use |
|------|-----|
| `run 'prompt'` | One-shot execution |
| `-c` / `--continue` | Continue last session |
| `-s <id>` | Continue a specific session |
| `--agent <name>` | Choose agent (build/plan) |
| `--model provider/model` | Force specific model |
| `-f <path>` | Attach file(s) to message |
| `--thinking` | Show model thinking |
| `--variant <level>` | Reasoning effort (high, max, minimal) |

## PR Reviews

```
bash(command="opencode pr 42", workdir="~/project", pty=true)
```

Or review in a temp clone:
```
bash(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && opencode run 'Review this PR vs main' -f $(git diff origin/main --name-only | head -20 | tr '\n' ' ')", pty=true)
```

## Parallel Work

```
bash(command="opencode run 'Fix issue #101 and commit'", workdir="/tmp/issue-101", background=true, pty=true)
bash(command="opencode run 'Add parser regression tests'", workdir="/tmp/issue-102", background=true, pty=true)
```

## Session & Cost Management

```
bash(command="opencode session list")
bash(command="opencode stats --days 7 --models anthropic/claude-sonnet-4")
```

## Rules

1. Prefer `opencode run` for one-shot tasks — simpler, no PTY needed
2. Use background TUI mode only when iteration is needed
3. Scope each session to a single repo/workdir
4. Exit interactive sessions with Ctrl+C or kill, never `/exit`
5. Report concrete outcomes: files changed, test results, remaining risks
