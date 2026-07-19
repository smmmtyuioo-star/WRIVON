---
name: codex
description: Delegate coding to OpenAI Codex CLI via bash.
---

# Codex CLI — Wrivon Orchestration Guide

Delegate coding tasks to [Codex](https://github.com/openai/codex) (OpenAI's autonomous coding agent CLI) via Wrivon's `bash` tool.

## Prerequisites

- `npm install -g @openai/codex`
- Set `OPENAI_API_KEY` or complete Codex OAuth login
- **Must run inside a git repository** — Codex refuses to run outside one
- Verify: `bash(command="codex --version")`

## One-Shot Tasks

```
bash(command="codex exec 'Add dark mode toggle to settings'", workdir="~/project", pty=true)
```

For scratch work (needs a git repo):
```
bash(command="cd $(mktemp -d) && git init && codex exec 'Build a snake game in Python'", pty=true)
```

## Background Mode (Long Tasks)

```
bash(command="codex exec --full-auto 'Refactor the auth module'", workdir="~/project", background=true, pty=true)
```

Monitor by checking process state. Use separate background sessions for parallelism.

## Key Flags

| Flag | Effect |
|------|--------|
| `exec "prompt"` | One-shot execution |
| `--full-auto` | Auto-approves file changes in sandbox |
| `--yolo` | No sandbox, no approvals (fastest) |
| `--sandbox danger-full-access` | No sandbox (use when bubblewrap fails) |

## PR Reviews

```
bash(command="REVIEW=$(mktemp -d) && git clone https://github.com/user/repo.git $REVIEW && cd $REVIEW && gh pr checkout 42 && codex review --base origin/main", pty=true)
```

## Parallel Fixing with Worktrees

```
bash(command="git worktree add -b fix/issue-78 /tmp/issue-78 main", workdir="~/project")
bash(command="git worktree add -b fix/issue-99 /tmp/issue-99 main", workdir="~/project")
bash(command="codex --yolo exec 'Fix issue #78'", workdir="/tmp/issue-78", background=true, pty=true)
bash(command="codex --yolo exec 'Fix issue #99'", workdir="/tmp/issue-99", background=true, pty=true)
```

## Rules

1. Always use `pty=true` — Codex is an interactive terminal app
2. Git repo required — use `mktemp -d && git init` for scratch work
3. Use `exec` for one-shots: `codex exec "prompt"`
4. Use `--full-auto` for building, `--yolo` only when you trust the task
5. Use background mode for long tasks
6. Run parallel Codex instances in separate workdirs to avoid collisions
