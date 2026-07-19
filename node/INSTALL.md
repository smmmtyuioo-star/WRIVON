# WRIVON — Install Guide

## Requirements

- **Node.js 18+** (LTS recommended). Download from [nodejs.org](https://nodejs.org/) or use a version manager like `nvm`, `fnm`, or `volta`.

## Option 1: Direct download

Copy the entire `wrivon/` folder anywhere on your machine. Run it with:

```bash
node /path/to/wrivon/bin/wrivon.js
```

## Option 2: Add to PATH

Add the `wrivon/bin` directory to your `PATH` so `wrivon` works as a command.

### Windows (PowerShell)
```powershell
$env:Path += ";C:\path\to\wrivon\bin"
# To make permanent:
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\path\to\wrivon\bin", "User")
```

### Linux / macOS (bash)
```bash
export PATH="$PATH:/path/to/wrivon/bin"
# Add to ~/.bashrc or ~/.zshrc
```

Then run:
```bash
# Any shell:
wrivon.js           # interactive REPL
wrivon.ps1          # PowerShell launcher (Windows)
wrivon.sh           # bash launcher (Linux/macOS)
```

## Option 3: npx

```bash
npx wrivon --help
```

> Note: if published to npm, `npx wrivon` will work without any install step.

## Verify installation

```bash
node bin/wrivon.js --help
```

If you see the help text, WRIVON is ready.

## API keys

| Provider | Key source |
|---|---|
| **Ollama** | No key needed (runs locally on `http://127.0.0.1:11434`) |
| **OpenAI** | Set `OPENAI_API_KEY` env var or use `--api-key` |
| **NVIDIA NIM** | Sign up at [build.nvidia.com](https://build.nvidia.com/), set `NVIDIA_API_KEY` env var |
| **Cloudflare** | Set `CLOUDFLARE_API_KEY` + `CLOUDFLARE_ACCOUNT_ID` env vars |

## First run

```bash
# If Ollama is running locally:
node bin/wrivon.js --print "Hello, what model are you?"

# To use NVIDIA:
node bin/wrivon.js --provider nvidia --print "List 3 interesting facts."
```
