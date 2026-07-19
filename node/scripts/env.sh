#!/usr/bin/env bash
# Load WRIVON API keys from .env.local (gitignored, never committed).
# Create .env.local from .env.local.example or manually:
#   NVIDIA_API_KEY=your_key_here
#   CLOUDFLARE_API_KEY=your_key_here
#   CLOUDFLARE_ACCOUNT_ID=your_account_id

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "  [MISSING] .env.local not found at $ENV_FILE"
  return 1 2>/dev/null || exit 1
fi

set -a
. "$ENV_FILE"
set +a

ok=true
[ -z "$NVIDIA_API_KEY" ] && echo "  [MISSING] NVIDIA_API_KEY" && ok=false
[ -z "$CLOUDFLARE_API_KEY" ] && echo "  [MISSING] CLOUDFLARE_API_KEY" && ok=false
[ -z "$CLOUDFLARE_ACCOUNT_ID" ] && echo "  [MISSING] CLOUDFLARE_ACCOUNT_ID" && ok=false
[ -z "$GROQ_API_KEY" ] && echo "  [MISSING] GROQ_API_KEY" && ok=false
$ok && echo "  [OK] WRIVON API keys loaded"
