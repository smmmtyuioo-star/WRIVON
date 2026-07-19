import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const _cache = { config: null };

export function loadSharedConfig() {
  if (_cache.config) return _cache.config;

  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, "wrivon.config.json");
    if (fs.existsSync(candidate)) {
      _cache.config = JSON.parse(fs.readFileSync(candidate, "utf8"));
      return _cache.config;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback: next to node/ directory
  const nodeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const repoRoot = path.resolve(nodeRoot, "..");
  const fallback = path.join(repoRoot, "wrivon.config.json");
  if (fs.existsSync(fallback)) {
    _cache.config = JSON.parse(fs.readFileSync(fallback, "utf8"));
    return _cache.config;
  }

  throw new Error(
    "wrivon.config.json not found. Expected it at the repository root next to node/ and python/ directories."
  );
}

export function getProviderOrder() {
  return loadSharedConfig().provider_fallback_order || [];
}

export function getCommands() {
  return loadSharedConfig().commands || {};
}

export function getChatModes() {
  return loadSharedConfig().chat_modes || {};
}

export function getTools() {
  return loadSharedConfig().tools || {};
}

export function getDefaults() {
  return loadSharedConfig().defaults || {};
}
