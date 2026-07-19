// Filesystem helpers. All paths in tool calls are absolute; we resolve
// them against the project root (process.cwd()) and check sandbox.

import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";

export function isAbsolute(p) {
  return path.isAbsolute(p);
}

export function resolveWithinCwd(p) {
  // Returns absolute path. If relative, joins with cwd.
  return path.isAbsolute(p) ? path.normalize(p) : path.resolve(process.cwd(), p);
}

export function isInside(parent, child) {
  // True if child is the same as parent or strictly inside it.
  const a = path.resolve(parent);
  const b = path.resolve(child);
  const rel = path.relative(a, b);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export function checkSandbox(p, sandbox) {
  // p must be absolute. Returns null on ok, or an error string.
  if (sandbox === "danger-full-access") return null;
  if (sandbox === "read-only") return `wrivon: filesystem sandbox is 'read-only'; cannot access ${p}`;
  // default 'workspace-write'
  const root = process.cwd();
  if (!isInside(root, p)) {
    return `wrivon: path ${p} is outside project root (${root}). Use --sandbox danger-full-access to override.`;
  }
  return null;
}

export async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

export function readTextSync(p) {
  return fsSync.readFileSync(p, "utf8");
}
