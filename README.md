# WRIVON

<p align="center">
  <strong>A CLI AI coding agent</strong> — reads, writes, and edits files in your project. Runs in any terminal.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-green" alt="License: MIT"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-v0.1_–_Early_Stage-yellow" alt="Status: v0.1"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Runtime-Node.js_18%2B-blue" alt="Node.js 18+"></a>
  <a href="#"><img src="https://img.shields.io/badge/Setup-BYOK_–_Bring_Your_Own_Key-orange" alt="BYOK"></a>
  <a href="https://discord.gg/X7Rtphrxn"><img src="https://img.shields.io/badge/Discord-join_chat-7289DA" alt="Discord"></a>
</p>

## Community

Join the Discord to report bugs, request features, or just chat about the project:  
[discord.gg/X7Rtphrxn](https://discord.gg/X7Rtphrxn)

## Features

- **Agentic coding** — reads, writes, edits, and searches files using AI-powered tools. Build anything with natural language prompts.
- **Multiple free AI providers** — NVIDIA NIM (~90 free models with speed tiers), Cloudflare Workers AI, Groq (fast LPU inference)
- **Smart model tiers** — `/model` shows a numbered picker: 1) Fast, 2) Coder, 3) Power — no memorized model IDs
- **Chat modes** — `/ask` (read-only Q&A), `/plan` (explore + structured plan), `/code` (full tool access)
- **Local web server** — `/serve 8080` to preview websites you build, with SPA routing and directory listings
- **Web fetch & search** — the AI can browse documentation and search the web for solutions
- **Built-in skills** — 19 pre-installed skill packs across 7 categories: code-review, debugging, deep-research, TDD, planning, architecture, frontend-design, GitHub workflow, agent-orchestration (5 agents) + 6 domain packs (engineering, marketing, c-level-advisor, research, business, compliance) covering 362 extracted skills from the claude-code-skills library
- **Knowledge system** — `/knowledge <domain>` loads full extracted expertise from 337 system prompt leaks (19 AI vendors), 362 domain skills, and 15,134 files of engineering/marketing/business/research/compliance knowledge
- **Subagents** — spawn isolated agents for parallel tasks (refactoring, test generation, research)
- **Session management** — every conversation is saved; resume with `/resume`, browse with `/sessions`
- **Streaming responses** — see the model's reply as it's generated, token by token
- **Syntax highlighting** — code blocks and diffs are colorized inline
- **Git integration** — `/diff` to see changes, `/commit` to stage+commit, `/push` to push to remote
- **Graceful error handling** — if a provider fails, WRIVON falls back to alternative models; clear messages, no raw stack traces
- **Zero runtime dependencies** — uses only Node.js built-ins (`fetch`, `readline`, `fs/promises`)

## Quick Start

```bash
git clone https://github.com/smmmtyuioo-star/WRIVON
cd WRIVON
npm install
npm run setup
npm start
```

**Four commands, zero manual file editing.** The setup wizard asks which provider you want to use, prompts for your API key (with a link to get a free one), and writes `.env.local` automatically. When WRIVON starts, just type what you want and press Enter.

## Supported Providers

| Provider | Cost | Free Tier | Get a Key |
|----------|------|-----------|-----------|
| NVIDIA NIM | Free | ~90 models, rate-limited | https://build.nvidia.com |
| Cloudflare Workers AI | Free | 10k requests/day | https://dash.cloudflare.com/profile/api-tokens |
| Groq | Free | LPU inference, rate-limited | https://console.groq.com/keys |
| OpenAI | Paid | — | https://platform.openai.com/api-keys |
| Anthropic | Paid | — | https://console.anthropic.com/settings/keys |
| Ollama | Free | Local, no key needed | https://ollama.ai |

## Usage Examples

Once WRIVON is running (`npm start`), type anything as a prompt:

```
> explain how this project is structured
```
```
> add error handling to the config loader
```
```
> what changed in the last 3 commits?
```
```
> write a unit test for the session store
```
```
> /model
```

## Chat Modes

WRIVON has three modes you can switch between with a command:

| Mode | Command | Behavior |
|------|---------|----------|
| **Code** | `/code` | Full tool access — edit files, run commands, build, ship (default) |
| **Ask** | `/ask` | Read-only Q&A — discuss, explain, explore code. No edits allowed |
| **Plan** | `/plan` | Explore codebase + output a structured numbered plan. No edits |

Use `/mode` to see the current mode and switch. Why toggle modes? `/ask` prevents accidental edits while exploring, `/plan` forces structured thinking before coding, and `/code` gives full freedom when you're ready.

## Local Web Server

WRIVON can host websites locally for preview:

```bash
# Start a server on port 8080 serving the current directory
/serve 8080
# Or specify a directory
/serve 3000 ./dist
# List active servers
/servers
# Stop a specific server
/stop 8080
# Stop all servers
/stop --all
```

The server serves static files (HTML, CSS, JS) with proper MIME types, directory listings, and SPA fallback (index.html for unknown routes).

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/mode` | Show/switch chat mode (code, ask, plan) |
| `/code` | Switch to code mode (full tool access) |
| `/ask` | Switch to ask mode (read-only) |
| `/plan` | Switch to plan mode (explore + structured plan) |
| `/model` | Interactive model picker (1=Fast, 2=Coder, 3=Power) |
| `/model <id>` | Set model by exact ID |
| `/models` | List curated models for current provider |
| `/provider <name>` | Switch provider |
| `/providers` | List all configured providers |
| `/connect` | Add a new API provider |
| `/disconnect <name>` | Remove a configured provider |
| `/serve <port> [dir]` | Start local HTTP server for preview |
| `/servers` | List active HTTP servers |
| `/stop <port>` | Stop a local HTTP server |
| `/commit [message]` | Stage all + commit (auto-generates message) |
| `/push` | Push current branch to remote |
| `/diff [target]` | Show git diff (uncommitted, staged, HEAD~1) |
| `/review [target]` | Code review |
| `/refactor <target>` | Refactoring mode |
| `/status` | Show mode, model, provider, session, context stats |
| `/sessions [--all]` | List past sessions |
| `/resume <id>` | Load a past session |
| `/clear` | Clear conversation (keeps system prompt) |
| `/undo` | Remove last turn |
| `/map` | Show project structure |
| `/init` | Project memory setup |
| `/test [provider]` | Test API connectivity |
| `/export [--json]` | Export session as markdown or JSON |
| `/skills` | List available skill packs |
| `/skills <name>` | Load a skill pack into session |
| `/agents` | Alias for /skills |
| `/knowledge` | List available knowledge domains |
| `/knowledge <domain>` | Load domain knowledge (engineering, marketing, c-level-advisor, etc.) |
| `/search <query>` | Search past sessions |
| `/prompt` | Show the system prompt |
| `/config [key=val]` | View or set config |
| `/name [<name>]` | Name the current session |
| `/exit` | Quit |

## Model Tiers

NVIDIA NIM's ~90 free models are organized by speed and capability:

| Tier | Badge | Response Time | Use Case | Example Model |
|------|-------|---------------|----------|---------------|
| Fast | ⚡ | <3s | Quick chat, simple code | `deepseek-ai/deepseek-v4-flash` |
| Balanced | ◆ | 3-30s | Complex reasoning | `mistralai/mistral-medium-3.5-128b` |
| Power | 🔷 | >30s | Architecture, deep thinking | `mistralai/mistral-large-3-675b-instruct-2512` |

Use `/model` to select by tier — no model IDs to memorize.

## Configuration

### Environment variables (`.env.local`)

WRIVON reads API keys from `.env.local` in the project root (gitignored). The setup wizard creates this file for you:

```
NVIDIA_API_KEY=nvapi-...
CLOUDFLARE_API_KEY=cfut_...
CLOUDFLARE_ACCOUNT_ID=...
GROQ_API_KEY=gsk_...
```

### Config file (`~/.wrivon/config.json`)

For advanced setup (custom endpoints, sandbox level, default model), create `~/.wrivon/config.json`:

```json
{
  "provider": "nvidia",
  "providers": {
    "nvidia": {
      "baseUrl": "https://integrate.api.nvidia.com/v1",
      "apiKey": "env:NVIDIA_API_KEY",
      "model": "deepseek-ai/deepseek-v4-flash",
      "kind": "openai"
    }
  },
  "sandbox": {
    "filesystem": "workspace-write",
    "network": "allow"
  },
  "ui": {
    "stream": true,
    "showTools": true
  }
}
```

Project-level `.wrivon/config.json` overrides user-level. Use `"env:VARNAME"` to reference environment variables — never store real key values in config files.

### Manual setup (no wizard)

```bash
git clone https://github.com/smmmtyuioo-star/WRIVON
cd WRIVON
npm install

# Create .env.local with your keys
echo NVIDIA_API_KEY=nvapi-your-key-here > .env.local
echo CLOUDFLARE_API_KEY=your-cf-key >> .env.local

# Start WRIVON
npm start
```

## Project Status

**v0.1** — actively developed. Works reliably for file editing, code review, and general coding tasks with the NVIDIA, Cloudflare, and Groq providers.

Known limitations:
- No multi-turn tool editing (each edit is independent)
- Context window limited to ~32k tokens
- Only OpenAI-compatible providers supported
- Windows path handling may differ from Unix in edge cases

## Contributing

Issues and feedback welcome — report bugs or request features on GitHub or join the Discord. Every contribution helps shape what this becomes.

## Disclaimer

WRIVON is built by **Rishav Jha** — a solo developer, working with AI coding tools and some creativity. This project is in early stages and built one piece at a time.

Please don't compare it directly to large-team or well-funded tools. It's made by hand, with care, and it will grow better with your contributions and feedback.

---

## License

MIT
