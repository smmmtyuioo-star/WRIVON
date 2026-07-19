# WRIVON

A CLI AI coding agent that reads, writes, and edits files in your project. Runs in any terminal — PowerShell, bash, cmd, Windows Terminal.

## Features

- **Chat-based file editing** — describe what you want to build or change; WRIVON reads, writes, and diffs files in your project
- **Multiple free AI providers** — NVIDIA NIM (~90 free models with speed tiers), Cloudflare Workers AI, Groq (fast LPU inference)
- **Smart model tiers** — `/model` shows a numbered picker: 1) Fast, 2) Coder, 3) Power — no memorized model IDs
- **Session management** — every conversation is saved; resume with `/resume`, browse with `/sessions`
- **Streaming responses** — see the model's reply as it's generated, token by token
- **Syntax highlighting** — code blocks and diffs are colorized inline
- **Git integration** — `/diff` to see changes, `/commit` to stage+commit, `/push` to push to remote
- **Graceful error handling** — if a provider fails, WRIVON falls back to alternative models; clear messages, no raw stack traces
- **Zero runtime dependencies** — uses only Node.js built-ins (`fetch`, `readline`, `fs/promises`)

## Quick Start

```bash
git clone <repo-url>
cd wrivon
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

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/model` | Interactive model picker (1=Fast, 2=Coder, 3=Power) |
| `/model <id>` | Set model by exact ID |
| `/models` | List curated models for current provider |
| `/provider <name>` | Switch provider |
| `/providers` | List all configured providers |
| `/connect` | Add a new API provider |
| `/disconnect <name>` | Remove a configured provider |
| `/commit [message]` | Stage all + commit (auto-generates message) |
| `/push` | Push current branch to remote |
| `/diff [target]` | Show git diff (uncommitted, staged, HEAD~1) |
| `/review [target]` | Code review |
| `/refactor <target>` | Refactoring mode |
| `/status` | Show model, provider, session, context stats |
| `/sessions [--all]` | List past sessions |
| `/resume <id>` | Load a past session |
| `/clear` | Clear conversation (keeps system prompt) |
| `/undo` | Remove last turn |
| `/map` | Show project structure |
| `/init` | Project memory setup |
| `/test [provider]` | Test API connectivity |
| `/export [--json]` | Export session as markdown or JSON |
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

Issues and feedback welcome. This is a practical tool built for real use — if something doesn't work or could be clearer, open an issue.

## License

MIT
