#!/usr/bin/env node
// WRIVON entry point with preflight checks. Prints clear guidance
// instead of raw Node stack traces when something is wrong.

import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";
const RESET = "\x1b[0m";

const DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(DIR, "..");

// ---- preflight 1: is this the wrivon project? ----
const MAIN = resolve(PROJECT, "src", "index.js");
if (!existsSync(MAIN)) {
  console.error(`
  WRIVON: cannot find core module.
  Expected it at:
    ${MAIN}

  Make sure you are running from inside the wrivon project folder:
    cd C:\\WRIVON\\wrivon
    node bin\\wrivon.js
`);
  process.exit(1);
}

// ---- preflight 2: check git availability ----
const GIT_AVAIL = { current: false };
try {
  const gitCheck = await import("node:child_process");
  const result = await new Promise((resolve) => {
    gitCheck.exec("git --version", (err, stdout) => {
      resolve(!err && stdout.startsWith("git"));
    });
  });
  GIT_AVAIL.current = result;
} catch { GIT_AVAIL.current = false; }
if (!GIT_AVAIL.current) {
  console.warn(`
  ${YELLOW}⚠${RESET} Git not found. Install it from ${CYAN}https://git-scm.com${RESET} to enable commit/push features.
    ${GRAY}WRIVON will work without it, but git commands will be unavailable.${RESET}
`);
}
// Expose to the rest of the app via a global
globalThis.__WRIVON_GIT_AVAIL = GIT_AVAIL.current;

// ---- preflight 3: check for configured providers and their env vars ----
const CFG_PATH = resolve(DIR, "..", "src", "config", "defaults.js");
if (existsSync(CFG_PATH)) {
  const raw = await import(pathToFileURL(CFG_PATH));
  const defaults = raw.DEFAULT_CONFIG || {};
  const providers = defaults.providers || {};

  // Warn if a provider references env vars that are not set
  for (const [name, p] of Object.entries(providers)) {
    for (const field of ["apiKey", "accountId"]) {
      const val = p?.[field] || "";
      const m = val.match(/^env:(.+)$/);
      if (m && !process.env[m[1]]) {
        console.warn(`  WRIVON: provider "${name}" references env var ${m[1]} (${field}), which is not set.
    Run the env script first:
      .\\scripts\\env.ps1        (PowerShell)
      . ./scripts/env.sh         (bash)
`);
      }
    }
  }
}

// ---- launch ----
import(pathToFileURL(MAIN));
