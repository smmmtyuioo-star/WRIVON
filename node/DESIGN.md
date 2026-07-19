# WRIVON — Design & Build Plan

> A CLI AI coding agent inspired by opencode, Codex CLI, Claude Code, aider, Hermes, and Ollama. Reuses the leaked system prompts as a study reference, but writes every prompt and every line of code from scratch for WRIVON.

---

## 0. What is WRIVON?

A single-binary, cross-shell (PowerShell + bash) interactive coding agent that lives in your terminal. It:

- Talks to **Ollama locally** (default) **or any OpenAI-compatible API** (OpenAI, Anthropic via gateway, OpenRouter, vLLM, LM Studio, etc.) — user picks at runtime.
- Uses a small set of **filesystem/shell tools** (read, write, edit, glob, grep, bash, apply_patch).
- Runs an **agent loop** that streams model output, parses tool calls, executes them, and feeds results back until the model returns a final answer.
- Carries a **persistent system prompt + per-project memory** (AGENTS.md, WRIVON.md).
- Has a **REPL** with slash commands (`/help`, `/model`, `/provider`, `/init`, `/review`, `/clear`, `/undo`, `/exit`).
- Stores **session history** in a local JSONL rollout file (Codex-style) plus a tiny SQLite state DB (optional, JSON-only fallback if sqlite missing).
- Cross-platform launcher: `wrivon.ps1` (Windows) and `wrivon.sh` (Linux/macOS) both call the same Node binary.

It is **not** a full TUI ratatui app in v0.1 — it's a clean text REPL (read-eval-print loop) with a streaming renderer, so the same code works in any terminal. The TUI can be added later on top of the same agent core.

---

## 1. Goals & non-goals

### Goals
- **Goal G1:** Works on Windows PowerShell 5.1 and bash/Linux/macOS with zero changes.
- **Goal G2:** Talks to Ollama (local) and OpenAI-compatible APIs with one switch.
- **Goal G3:** Has a working agent loop with the 6 core tools listed above.
- **Goal G4:** Persists sessions (JSONL) and can resume.
- **Goal G5:** Has a real, hand-written system prompt (not a copy of any leaked prompt) that pulls in the best lessons.
- **Goal G6:** Single binary distribution — `wrivon` is a Node script (no Bun/TypeScript build step needed) so it runs anywhere Node 18+ exists.
- **Goal G7:** v0.1 ships as a self-contained `wrivon/` folder you can copy anywhere.

### Non-goals (for v0.1)
- No TUI/ratatui — plain terminal REPL only.
- No multi-agent / subagent spawn — single in-process agent loop.
- No MCP server/client — can be added later.
- No background daemon / `wrivon agents` daemon — local REPL only.
- No IDE integration.
- No hooks system (PreToolUse/PostToolUse) — permission policy only.
- No patch-grammar parser (Codex's `apply_patch`) — use simple JSON tool calls in v0.1; add the grammar later if needed.

---

## 2. Architecture

```
wrivon/
├── bin/
│   ├── wrivon.js          # Node entry (cross-platform)
│   ├── wrivon.ps1         # Windows launcher
│   └── wrivon.sh          # bash launcher
├── src/
│   ├── agent/
│   │   ├── loop.js        # the core agent loop (stream → tool → repeat)
│   │   ├── tools.js       # tool registry (read, write, edit, glob, grep, bash)
│   │   └── patch.js       # small apply_patch-style grammar (v0.2)
│   ├── llm/
│   │   ├── ollama.js      # Ollama /api/chat client (SSE)
│   │   ├── openai.js      # OpenAI-compatible /v1/chat/completions client (SSE)
│   │   ├── anthropic.js   # Anthropic /v1/messages (SSE)  -- optional
│   │   └── stream.js      # shared SSE parser
│   ├── session/
│   │   ├── store.js       # JSONL append-only rollout log
│   │   ├── state.js       # in-memory session state
│   │   └── resume.js      # load previous session
│   ├── config/
│   │   ├── load.js        # load .wrivon/config.json (project) + ~/.wrivon/config.json (user)
│   │   └── defaults.js
│   ├── prompt/
│   │   ├── system.md      # the WRIVON system prompt
│   │   ├── init.md        # /init command template
│   │   ├── review.md      # /review command template
│   │   └── reminders/     # injected reminders (plan mode, compact, etc.)
│   ├── tui/
│   │   ├── repl.js        # readline-based REPL with streaming render
│   │   └── render.js      # markdown-ish rendering
│   ├── util/
│   │   ├── fs.js          # absolute path resolution, sandbox checks
│   │   ├── shell.js       # cross-platform shell exec
│   │   ├── log.js         # logger
│   │   └── tokens.js      # rough token counter
│   └── index.js           # wires everything
├── prompts/               # mirror of src/prompt as plain text (for editing)
├── examples/
│   └── config.json
├── package.json
├── README.md
└── INSTALL.md
```

### Key design decisions (line by line reasoning)

- **Node, not Rust/Python/Go.** Node 18+ ships with `fetch`, `ReadableStream`, `readline`, and `node:fs/promises` — every primitive we need. No build step, no Cargo workspace, no Python venv. Drops a 75 MB Rust binary's worth of complexity.
- **JSON tool calls, not a custom patch grammar.** v0.1 uses OpenAI's standard `tools=[{...}]` / `tool_calls` schema that every local model already understands. The Codex `apply_patch.lark` grammar is great but adds a parsing layer most models don't need; we add it as a v0.2 enhancement.
- **JSONL rollout, not SQLite.** One file per session, append-only, easy to `tail` and `grep`. We add SQLite only if we need to query across many sessions.
- **System prompt is a file, not a string in code.** `src/prompt/system.md` — so users can edit it without rebuilding. This mirrors how opencode and Claude Code ship the prompt as a separate resource.

---

## 3. The agent loop (the single most important file)

`src/agent/loop.js` — the turn-execution loop. Reconstructed from the leaked Codex prompt and the analysis doc (sections A2 and A5):

1. Receive user input.
2. Load system prompt + AGENTS.md/WRIVON.md project memory + slash command template if any.
3. Append user turn to JSONL rollout.
4. Build message list (system + prior turns + new user input).
5. Call LLM with streaming.
6. Stream chunks to terminal. If the model emits `tool_calls`, pause at the first tool.
7. For each tool call: safety-check the path (must be inside cwd unless `danger-full-access`) and shell command (deny list), then execute.
8. Append tool call + tool result to message list.
9. If the model returned a final assistant message (no tool calls), append it and break.
10. Else loop back to step 5.

This is a faithful simplification of the Codex `run_turn` flow described in the analysis doc.

---

## 4. Tools (v0.1 inventory)

| Tool | Args | Description |
|---|---|---|
| `read` | `path`, `offset?`, `limit?` | Read a file, returns text + line numbers. |
| `write` | `path`, `content` | Create or overwrite a file. Refuses outside cwd unless `danger-full-access`. |
| `edit` | `path`, `old_text`, `new_text` | Replace `old_text` with `new_text`. Fails if not found or not unique. |
| `glob` | `pattern` | Find files matching a glob (powered by Node `fs.glob` or a tiny impl). |
| `grep` | `pattern`, `path?`, `include?` | Regex search (uses ripgrep `rg` if available, else node `fs.readdir` + regex). |
| `bash` | `command`, `timeout_ms?` | Run a shell command. Default 120s timeout, default cwd = project root. |

All tools return `{ ok, output, error? }` JSON. The model always gets back a string for the `output` (or `error`) field.

### Tool descriptions (sent to the model)

These are short, plain, and direct — modeled on the opencode prompt style, not lifted verbatim from the leaks.

---

## 5. The system prompt

We write our own, but borrow these structural lessons from the leaked prompts:
- **Identity block** (who the agent is, in 1-2 lines).
- **Core mandates** (conventions, libraries, style, comments, proactiveness, path construction).
- **Primary workflows** (software-engineering tasks: understand → plan → implement → verify).
- **Operational guidelines** (tone, security, tool usage, parallelism).
- **Final reminder** (concise, safe, persistent agent).

The full prompt lives in `src/prompt/system.md` (about 4-5 KB). I'll show it to you before writing it to disk so you can edit it.

---

## 6. Slash commands

| Command | What it does |
|---|---|
| `/help` | Show available commands. |
| `/model <name>` | Switch model at runtime. |
| `/provider <name>` | Switch provider (ollama/openai/anthropic) at runtime. |
| `/init` | Walk through creating `WRIVON.md` for the project. |
| `/review [staged\|branch\|commit]` | Run a code-review agent. |
| `/clear` | Clear session memory (keeps the rollout file). |
| `/undo` | Revert last turn's file changes (uses our JSONL check-ins). |
| `/sessions` | List previous sessions. |
| `/resume <id>` | Resume a session. |
| `/status` | Show tokens used, model, provider, cwd. |
| `/exit` | Exit. |

All non-`/` input is sent to the agent as a normal user message.

---

## 7. Configuration

`~/.wrivon/config.json` (user-level) and `./.wrivon/config.json` (project-level) merge, project wins.

```json
{
  "provider": "ollama",
  "model": "minimax-m3",
  "providers": {
    "ollama":   { "baseUrl": "http://127.0.0.1:11434", "model": "minimax-m3" },
    "openai":   { "baseUrl": "https://api.openai.com/v1", "apiKey": "env:OPENAI_API_KEY", "model": "gpt-4o-mini" },
    "anthropic":{ "baseUrl": "https://api.anthropic.com",  "apiKey": "env:ANTHROPIC_API_KEY", "model": "claude-sonnet-4-6" }
  },
  "tools": { "bash": { "timeoutMs": 120000 } },
  "sandbox": { "filesystem": "workspace-write", "network": "allow" },
  "ui": { "theme": "auto", "stream": true }
}
```

`apiKey: "env:NAME"` means read from env var `NAME` at call time. Never written to disk.

---

## 8. Distribution

- **Single-folder drop:** `wrivon/` is self-contained. Copy it anywhere.
- **No install required:** `node bin/wrivon.js` works immediately.
- **Optional PATH install:** add `wrivon/bin` to PATH so `wrivon` works.
- **Cross-shell launchers:** `wrivon.ps1` and `wrivon.sh` both just call `node bin/wrivon.js "$@"`.

---

## 9. Build plan (the step-by-step you'll see executed)

The plan has 4 phases. Each phase ends in a runnable, testable artifact.

### Phase 1 — Skeleton + LLM clients (v0.1)
**Deliverable:** `node bin/wrivon.js --provider ollama --model minimax-m3 "say hi"` prints a streamed reply and exits.
1. `package.json` (no deps initially; uses Node built-ins).
2. `bin/wrivon.js` argument parser.
3. `bin/wrivon.ps1` + `bin/wrivon.sh` launchers.
4. `src/config/load.js` — config loader.
5. `src/llm/stream.js` — SSE parser.
6. `src/llm/ollama.js` — Ollama `/api/chat` client.
7. `src/llm/openai.js` — OpenAI-compatible `/v1/chat/completions` client.
8. `src/index.js` — one-shot `--print` mode (no REPL yet).
9. `README.md` with install + usage.

**Verify:** `wrivon --print "say hi"` works against a real Ollama and a real OpenAI key.

### Phase 2 — Tools + agent loop (v0.2)
**Deliverable:** `wrivon "list the files here and summarize README.md"` reads files and answers.
1. `src/util/fs.js` — absolute paths, sandbox check.
2. `src/util/shell.js` — cross-platform exec.
3. `src/agent/tools.js` — register 6 tools, run by name.
4. `src/agent/loop.js` — the streaming agent loop with tool dispatch.
5. `src/prompt/system.md` — the WRIVON system prompt.
6. `src/session/store.js` — JSONL rollout.
7. Wire system prompt + tools into the loop.

**Verify:** `wrivon "what's in README.md?"` reads + answers; `wrivon "create hello.js with console.log('hi')"` writes + confirms.

### Phase 3 — REPL + slash commands + memory (v0.3)
**Deliverable:** `wrivon` with no args enters an interactive REPL with `/help`, `/model`, `/init`, session resume.
1. `src/tui/repl.js` — readline REPL with streaming render.
2. Slash command dispatcher.
3. `src/prompt/init.md`, `src/prompt/review.md` — command templates.
4. `src/session/resume.js` — load `~/.wrivon/sessions/*.jsonl`.
5. AGENTS.md / WRIVON.md auto-load (project memory).

**Verify:** `wrivon` → type `say hi` → streams → `/model minimax-m3` → `/sessions` → `/exit`.

### Phase 4 — Polish + cross-platform + docs (v0.4)
**Deliverable:** installable, documented, test-covered.
1. Cross-platform sandbox policy (Windows ACL aware, Linux read-only mount via `chmod`).
2. JSON config validation.
3. `INSTALL.md`, `EXAMPLES.md`.
4. Tiny smoke test script (`scripts/smoke.js`) that hits a fixture prompt.
5. Example `WRIVON.md` for the user.

**Verify:** run on Windows PowerShell, then on WSL/Linux bash, against both Ollama and OpenAI.

---

## 10. Files I'm about to create (and where they go)

| Path | Purpose |
|---|---|
| `C:\WRIVON\wrivon\package.json` | Node manifest. |
| `C:\WRIVON\wrivon\bin\wrivon.js` | Node entry. |
| `C:\WRIVON\wrivon\bin\wrivon.ps1` | Windows launcher. |
| `C:\WRIVON\wrivon\bin\wrivon.sh` | bash launcher. |
| `C:\WRIVON\wrivon\src\index.js` | CLI top-level. |
| `C:\WRIVON\wrivon\src\config\defaults.js` | Default config. |
| `C:\WRIVON\wrivon\src\config\load.js` | Config loader + merge. |
| `C:\WRIVON\wrivon\src\llm\stream.js` | SSE parser. |
| `C:\WRIVON\wrivon\src\llm\ollama.js` | Ollama client. |
| `C:\WRIVON\wrivon\src\llm\openai.js` | OpenAI-compatible client. |
| `C:\WRIVON\wrivon\src\agent\loop.js` | Agent loop. |
| `C:\WRIVON\wrivon\src\agent\tools.js` | Tool registry. |
| `C:\WRIVON\wrivon\src\util\fs.js` | FS helpers. |
| `C:\WRIVON\wrivon\src\util\shell.js` | Shell exec. |
| `C:\WRIVON\wrivon\src\util\log.js` | Logger. |
| `C:\WRIVON\wrivon\src\session\store.js` | JSONL rollout. |
| `C:\WRIVON\wrivon\src\session\resume.js` | Session resume. |
| `C:\WRIVON\wrivon\src\tui\repl.js` | REPL. |
| `C:\WRIVON\wrivon\src\tui\render.js` | Renderer. |
| `C:\WRIVON\wrivon\src\prompt\system.md` | System prompt. |
| `C:\WRIVON\wrivon\src\prompt\init.md` | /init template. |
| `C:\WRIVON\wrivon\src\prompt\review.md` | /review template. |
| `C:\WRIVON\wrivon\examples\config.json` | Sample config. |
| `C:\WRIVON\wrivon\README.md` | Quick start. |
| `C:\WRIVON\wrivon\INSTALL.md` | Install guide. |
| `C:\WRIVON\wrivon\scripts\smoke.js` | Smoke test. |

Total: **~26 files**, ~1200-1500 lines of code. No external runtime deps in v0.1.

---

## 11. Things I'm explicitly NOT copying from the leaks

- **No verbatim large blocks** of Claude Code's or Codex's system prompt. The WRIVON system prompt is original, with structural lessons applied.
- **No copy of Codex's `apply_patch.lark` grammar** in v0.1 (we add it as a v0.2 enhancement).
- **No reproduction of any license-bearing source** beyond short structural paraphrases.

The leaked prompts are read for *how* the systems are wired, not for *what* to copy.

---

## 12. Risks & open questions

- **R1:** Some Ollama models don't support `tools=`. v0.1 will warn and gracefully fall back to plain chat if a model rejects tools. I'll detect by parsing the model card.
- **R2:** Streaming + tool-calls is fiddly across providers. v0.1 supports both, but with a simple "stream text, when done parse tool calls from the final message" approach. Mid-stream tool deltas land in v0.2.
- **R3:** Windows shell quoting is the eternal hell. v0.1 runs `bash -c` on Windows when Git Bash / WSL is detected, and `cmd.exe /c` otherwise; user can force with `WRIVON_SHELL=cmd|bash|pwsh`.
- **R4:** Long sessions blow up context. v0.3 adds a simple summarizer that runs when the JSONL exceeds N tokens.
- **Q1 for you:** Do you want v0.1 to be a single Node script (simplest), or a TypeScript build with `tsx`? **Default: plain Node, no build step.** Confirm.
- **Q2 for you:** Do you want a real TUI (with `readline` + colors) or a minimal plain-text REPL for v0.1? **Default: minimal plain-text REPL** (faster, fewer bugs, works in any terminal).
