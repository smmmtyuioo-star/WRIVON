#!/usr/bin/env bash
# WRIVON launcher for bash (Linux, macOS, WSL, Git Bash on Windows).
# Forwards all arguments to the Node entry point.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTRY="$SCRIPT_DIR/wrivon.js"

if [ ! -f "$ENTRY" ]; then
  echo "wrivon: entry not found at $ENTRY" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "wrivon: 'node' is not on PATH. Install Node.js 18+ from https://nodejs.org/" >&2
  exit 1
fi

exec node "$ENTRY" "$@"
