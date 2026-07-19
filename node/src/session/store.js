// JSONL session store. One file per session under ~/.wrivon/sessions/<id>.jsonl.
// Each line is { ts, type, ... } where type is "user", "assistant", "tool", "system", "meta".
// The first record is always a "meta" type with provider, model, cwd info.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ensureUserDir } from "../config/load.js";

function sessionDir() {
  return path.join(ensureUserDir(), "sessions");
}

export function newSessionId() {
  return new Date().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomBytes(3).toString("hex");
}

export function sessionPath(id) {
  return path.join(sessionDir(), `${id}.jsonl`);
}

export async function openSession(id, meta) {
  const p = id ? sessionPath(id) : path.join(sessionDir(), `${newSessionId()}.jsonl`);
  if (!fs.existsSync(p)) await fsp.mkdir(path.dirname(p), { recursive: true });
  const session = {
    id: path.basename(p, ".jsonl"),
    path: p,
    async append(record) {
      const line = JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n";
      await fsp.appendFile(p, line, "utf8");
    },
  };
  // Write metadata on first creation
  if (meta && !fs.existsSync(p.replace(/\.jsonl$/, ".meta"))) {
    await session.append({ type: "session", ...meta });
  }
  return session;
}

export async function loadSession(id) {
  const p = sessionPath(id);
  if (!fs.existsSync(p)) return null;
  const raw = await fsp.readFile(p, "utf8");
  return raw.split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

export async function getSessionInfo(id) {
  const p = sessionPath(id);
  if (!fs.existsSync(p)) return null;
  const raw = await fsp.readFile(p, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  if (!lines.length) return null;
  const st = fs.statSync(p);
  const first = JSON.parse(lines[0]);
  const meta = first.type === "session" ? first : null;
  const userCount = lines.filter((l) => { try { return JSON.parse(l).type === "user"; } catch { return false; } }).length;
  return {
    id,
    size: st.size,
    mtime: st.mtimeMs,
    provider: meta?.provider || "?",
    model: meta?.model || "?",
    cwd: meta?.cwd || "",
    name: meta?.name || "",
    messages: lines.length,
    userMessages: userCount,
  };
}

export async function setSessionName(id, name) {
  const p = sessionPath(id);
  if (!fs.existsSync(p)) return false;
  const raw = await fsp.readFile(p, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  if (!lines.length) return false;
  const first = JSON.parse(lines[0]);
  if (first.type !== "session") return false;
  first.name = name;
  lines[0] = JSON.stringify(first);
  await fsp.writeFile(p, lines.join("\n") + "\n", "utf8");
  return true;
}

export async function listSessions(filterCwd) {
  const dir = sessionDir();
  if (!fs.existsSync(dir)) return [];
  const files = await fsp.readdir(dir);
  const sessions = [];
  for (const f of files) {
    if (!f.endsWith(".jsonl")) continue;
    const id = f.replace(/\.jsonl$/, "");
    const info = await getSessionInfo(id);
    if (!info) continue;
    // If filtering by cwd, skip sessions that don't match
    if (filterCwd) {
      const normalizedFilter = filterCwd.replace(/\\/g, "/").replace(/\/+$/, "");
      const normalizedCwd = (info.cwd || "").replace(/\\/g, "/").replace(/\/+$/, "");
      if (normalizedCwd !== normalizedFilter) continue;
    }
    sessions.push(info);
  }
  return sessions.sort((a, b) => b.mtime - a.mtime);
}
