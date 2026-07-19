# WRIVON

<p align="center">
  <strong>A CLI AI coding agent</strong> — reads, writes, and edits files in your project. Runs in any terminal.
  Available in <strong>Node.js</strong> and <strong>Python</strong>.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-green" alt="License: MIT"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-v0.2_–_Early_Stage-yellow" alt="Status: v0.2"></a>
  <a href="#"><img src="https://img.shields.io/badge/Setup-BYOK_–_Bring_Your_Own_Key-orange" alt="BYOK"></a>
  <a href="https://github.com/smmmtyuioo-star/WRIVON/actions"><img src="https://github.com/smmmtyuioo-star/WRIVON/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

## Installation

### Node.js

```bash
git clone https://github.com/smmmtyuioo-star/WRIVON
cd WRIVON
npm install
npm run setup
npm start
```

Or install globally:

```bash
npm install -g wrivon
wrivon setup
wrivon
```

### Python

```bash
pip install wrivon
wrivon setup
wrivon start
```

Or from source:

```bash
git clone https://github.com/smmmtyuioo-star/WRIVON
cd WRIVON/python
pip install -e .
wrivon setup
wrivon start
```

## Quick Start

Both versions read API keys from `.env.local` in the project root. The setup wizard walks you through configuring one or more free providers:

- **NVIDIA NIM** — ~90 free models (Llama, Nemotron, DeepSeek, Mistral)
- **Cloudflare Workers AI** — 10k requests/day free
- **Groq** — fast LPU inference, rate-limited

Once configured, just type what you want:

```
> explain how this project is structured
> add error handling to the config loader
> build a todo app with React and Express
```

## Project Structure

```
WRIVON/
├── node/                Node.js implementation (src/, bin/, scripts/)
├── python/              Python implementation (wrivon/ package)
├── _extracted/          Knowledge base (15,134 extracted skill files)
├── wrivon.config.json   Shared config — providers, commands, tools, modes
├── .github/workflows/   CI workflows (Node + Python on every push)
├── .env.local           Shared API keys (gitignored)
└── README.md
```

## Features

- **Agentic coding** — reads, writes, edits, searches files using AI-powered tools
- **Multiple free AI providers** — NVIDIA NIM, Cloudflare Workers AI, Groq with automatic fallback
- **Smart model tiers** — `/model` shows a numbered picker: Fast, Coder, Power
- **Chat modes** — `/ask` (read-only), `/plan` (explore + plan), `/code` (full tools), `/build` (one-shot app builder)
- **Local web server** — `/serve 8080` to preview websites with SPA routing
- **Web fetch & search** — AI can browse docs and search the web
- **Built-in skills** — 19 skill packs across 7 categories
- **Knowledge system** — `/knowledge <domain>` loads extracted expertise
- **Git integration** — `/diff`, `/commit`, `/push`
- **Session management** — auto-save, resume with `/resume`
- **Shared config** — single `wrivon.config.json` drives both Node.js and Python implementations
- **CI tested** — GitHub Actions runs Node smoke test + Python pytest on every push

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/mode` | Show/switch chat mode (code, ask, plan) |
| `/build <prompt>` | Full-stack one-shot builder |
| `/model` | Interactive model picker |
| `/provider <name>` | Switch provider |
| `/commit [msg]` | Stage + commit |
| `/push` | Push to remote |
| `/diff [target]` | Git diff |
| `/review [target]` | Code review |
| `/refactor <target>` | Refactoring mode |
| `/status` | Current mode, model, session |
| `/sessions` | List past sessions |
| `/resume <id>` | Load a past session |
| `/clear` | Clear conversation |
| `/map` | Show project structure |
| `/export [--json]` | Export session |
| `/skills` | List available skill packs |
| `/knowledge [domain]` | Load domain knowledge |
| `/serve <port> [dir]` | Start HTTP server |
| `/exit` | Quit |

## License

MIT
