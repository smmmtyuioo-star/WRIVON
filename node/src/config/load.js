// Config loader. Reads ~/.wrivon/config.json and ./.wrivon/config.json,
// merges on top of DEFAULT_CONFIG. Project overrides user.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { DEFAULT_CONFIG, expandEnv } from "./defaults.js";

const USER_DIR = path.join(os.homedir(), ".wrivon");
const USER_CFG = path.join(USER_DIR, "config.json");
const PROJ_CFG = path.join(process.cwd(), ".wrivon", "config.json");

function readJsonIfExists(p) {
  try {
    if (!fs.existsSync(p)) return null;
    let raw = fs.readFileSync(p, "utf8");
    // Strip UTF-8 BOM if present
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`wrivon: failed to parse config at ${p}: ${e.message}`);
    return null;
  }
}

function deepMerge(base, override) {
  if (override == null) return base;
  if (typeof base !== "object" || typeof override !== "object" || Array.isArray(override)) {
    return override;
  }
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = (k in base) ? deepMerge(base[k], v) : v;
  }
  return out;
}

export function loadConfig() {
  const user = readJsonIfExists(USER_CFG) || {};
  const proj = readJsonIfExists(PROJ_CFG) || {};
  const merged = deepMerge(deepMerge(DEFAULT_CONFIG, user), proj);

  // Expand env: refs in any provider string field.
  for (const [name, p] of Object.entries(merged.providers || {})) {
    if (p && typeof p === "object") {
      for (const k of Object.keys(p)) {
        if (typeof p[k] === "string") p[k] = expandEnv(p[k]);
      }
    }
    merged.providers[name] = p;
  }

  // CLI overrides: --provider, --model, --base-url, --api-key, --no-stream
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--provider" && argv[i + 1]) {
      merged.provider = argv[++i];
    } else if (a === "--model" && argv[i + 1]) {
      merged.model = argv[++i];
      if (merged.providers[merged.provider]) merged.providers[merged.provider].model = argv[i];
    } else if (a === "--base-url" && argv[i + 1]) {
      const p = merged.providers[merged.provider];
      if (p) p.baseUrl = argv[++i];
    } else if (a === "--api-key" && argv[i + 1]) {
      const p = merged.providers[merged.provider];
      if (p) p.apiKey = argv[++i];
    } else if (a === "--no-stream") {
      merged.ui.stream = false;
    }
  }

  return merged;
}

const VALID_SANDBOX = new Set(["read-only", "workspace-write", "danger-full-access"]);
const VALID_KINDS = new Set(["openai", "ollama", "cloudflare"]);

export function validateConfig(cfg) {
  const warnings = [];
  const errors = [];

  // Check selected provider exists
  if (!cfg.providers[cfg.provider]) {
    errors.push(`Provider "${cfg.provider}" not found in config.providers`);
  }

  // Check each provider
  for (const [name, p] of Object.entries(cfg.providers || {})) {
    if (!p.kind) errors.push(`Provider "${name}" has no "kind" field`);
    else if (!VALID_KINDS.has(p.kind)) warnings.push(`Provider "${name}" has unknown kind "${p.kind}"`);

    if (!p.baseUrl) warnings.push(`Provider "${name}" has no baseUrl`);
    if (p.kind === "cloudflare" && !p.accountId) warnings.push(`Provider "${name}" (cloudflare) has no accountId`);

    // Check for empty API key
    if (!p.apiKey) warnings.push(`Provider "${name}" has no apiKey — API calls will likely fail`);
  }

  // Check sandbox
  if (!VALID_SANDBOX.has(cfg.sandbox?.filesystem)) {
    warnings.push(`Invalid sandbox level "${cfg.sandbox?.filesystem}". Use: read-only, workspace-write, danger-full-access`);
  }

  return { warnings, errors };
}

export function validateAndWarn(cfg) {
  const { errors, warnings } = validateConfig(cfg);
  for (const e of errors) console.error(`  Config error: ${e}`);
  for (const w of warnings) console.warn(`  Config warning: ${w}`);
}

export function ensureUserDir() {
  if (!fs.existsSync(USER_DIR)) fs.mkdirSync(USER_DIR, { recursive: true });
  return USER_DIR;
}
