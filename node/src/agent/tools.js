// Tool registry. Each tool is { name, description, parameters (JSON Schema), run(args, ctx) }.
// We expose the OpenAI-style tool schema so any OpenAI-compatible API can use them.

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { runShell } from "../util/shell.js";
import { resolveWithinCwd, checkSandbox, fileExists } from "../util/fs.js";
import { discoverSkills } from "../skill/discover.js";
import { startServer, stopServer, listServers } from "../tools/serve.js";

// Commands and patterns that require user approval before execution
const DANGEROUS_PATTERNS = [
  /^rm\s+-rf/, /^rm\s+--recursive/, /^rmdir\s+\/s/,
  /^format/, /^diskpart/, /^del\s+\/f/, /^rd\s+\/s/,
  /^git\s+push\s+--force/, /^git\s+push\s+-f/,
  /^git\s+reset\s+--hard/, /^git\s+clean\s+-f[d]?/,
  /^git\s+rebase/, /^git\s+merge\s+--no-ff/,
  /^npm\s+publish/, /^npm\s+unpublish/, /^yarn\s+publish/,
  /^drop\s+(table|database|schema)/i,
  /^truncate\s+/i,
  /^alter\s+.*drop/i,
  /^docker\s+rm\s+-f/, /^docker\s+system\s+prune/,
  /^cargo\s+publish/,
  /^gh\s+delete/, /^gh\s+repo\s+delete/,
];

export function isDangerousCommand(cmd) {
  return DANGEROUS_PATTERNS.some((re) => re.test(cmd.trim()));
}

const SUGGESTIONS = {
  "file not found": "File or directory not found. Check the path and try again.",
  "ENOENT": "File or directory not found. Check the path and try again.",
  "EACCES": "Permission denied. Try using a different path or running with appropriate permissions.",
  "EISDIR": "Expected a file but found a directory. Use glob to list directory contents.",
  "ENOTDIR": "Expected a directory but found a file.",
  "EEXIST": "File already exists.",
  "EBUSY": "File is in use by another process. Wait and try again.",
  "ECONNREFUSED": "Connection refused. Check if the service is running and the URL is correct.",
  "ECONNRESET": "Connection was reset. This is often a transient network error.",
  "ETIMEDOUT": "Operation timed out. The command may be too slow or the network is down.",
  "MODULE_NOT_FOUND": "A required dependency is missing. Try running npm install.",
  "maxFileSize": "File is too large. Read it with offset and limit parameters.",
};

function suggestForError(msg) {
  for (const [code, hint] of Object.entries(SUGGESTIONS)) {
    if (msg.includes(code)) return `\n  Suggestion: ${hint}`;
  }
  return "";
}

function errResult(msg) {
  return { ok: false, error: String(msg) + suggestForError(String(msg)) };
}

const PARA = {
  type: "object",
  properties: {},
  additionalProperties: true,
};

function jsonResult(payload) {
  return { ok: true, output: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) };
}

export const TOOLS = {
  read: {
    name: "read",
    description: "Read a file and return its contents with line numbers. Use offset/limit to read parts of large files.",
    schema: { ...PARA, properties: { path: { type: "string" }, offset: { type: "integer" }, limit: { type: "integer" } }, required: ["path"] },
    async run({ path: p, offset, limit }, ctx) {
      try {
        const abs = resolveWithinCwd(p);
        if (!(await fileExists(abs))) return errResult(`file not found: ${abs}`);
        const raw = await fs.readFile(abs, "utf8");
        const lines = raw.split(/\r?\n/);
        const start = Math.max(0, (offset || 1) - 1);
        const end = limit ? start + limit : lines.length;
        const slice = lines.slice(start, end).map((l, i) => `${String(start + i + 1).padStart(4)} | ${l}`).join("\n");
        return jsonResult(slice);
      } catch (e) { return errResult(e.message); }
    },
  },

  write: {
    name: "write",
    description: "Create or overwrite a file with the given content. Refuses to write outside the project root unless sandbox is 'danger-full-access'.",
    schema: { ...PARA, properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] },
    async run({ path: p, content }, ctx) {
      try {
        const abs = resolveWithinCwd(p);
        const sandboxErr = checkSandbox(abs, ctx.sandbox);
        if (sandboxErr) return errResult(sandboxErr);
        await fs.mkdir(path.dirname(abs), { recursive: true });
        await fs.writeFile(abs, content, "utf8");
        return jsonResult(`wrote ${content.length} bytes to ${abs}`);
      } catch (e) { return errResult(e.message); }
    },
  },

  edit: {
    name: "edit",
    description: "Replace exact text in a file. Fails if old_text is not found or appears more than once.",
    schema: { ...PARA, properties: { path: { type: "string" }, old_text: { type: "string" }, new_text: { type: "string" } }, required: ["path", "old_text", "new_text"] },
    async run({ path: p, old_text, new_text }, ctx) {
      try {
        const abs = resolveWithinCwd(p);
        const sandboxErr = checkSandbox(abs, ctx.sandbox);
        if (sandboxErr) return errResult(sandboxErr);
        if (!(await fileExists(abs))) return errResult(`file not found: ${abs}`);
        const raw = await fs.readFile(abs, "utf8");
        const count = raw.split(old_text).length - 1;
        if (count === 0) return errResult(`old_text not found in ${abs}`);
        if (count > 1) return errResult(`old_text appears ${count} times in ${abs}; must be unique`);
        const next = raw.replace(old_text, new_text);
        await fs.writeFile(abs, next, "utf8");
        return jsonResult(`edited ${abs}: -${old_text.length} +${new_text.length} bytes`);
      } catch (e) { return errResult(e.message); }
    },
  },

  glob: {
    name: "glob",
    description: "Find files matching a glob pattern, relative to the project root. Returns absolute paths.",
    schema: { ...PARA, properties: { pattern: { type: "string" } }, required: ["pattern"] },
    async run({ pattern }) {
      try {
        const { glob } = await import("node:fs/promises").then(m => m);
        // Node 22+: fs.promises.glob; fall back to manual walk.
        let matches = [];
        if (typeof glob === "function") {
          for await (const m of glob(pattern, { cwd: process.cwd() })) matches.push(path.resolve(process.cwd(), m));
        } else {
          matches = await manualGlob(process.cwd(), pattern);
        }
        return jsonResult(matches.slice(0, 500));
      } catch (e) { return errResult(e.message); }
    },
  },

  grep: {
    name: "grep",
    description: "Search files for a regex pattern. Returns 'path:line:text' matches. If 'rg' is available, uses it; otherwise a small JS walker.",
    schema: { ...PARA, properties: { pattern: { type: "string" }, path: { type: "string" }, include: { type: "string" } }, required: ["pattern"] },
    async run({ pattern, path: p, include }) {
      try {
        const root = p ? resolveWithinCwd(p) : process.cwd();
        const { spawnSync } = await import("node:child_process");
        const rg = spawnSync("rg", ["--no-heading", "--line-number", "--color=never", "-g", include || "*", pattern, root], { encoding: "utf8" });
        if (rg.status === 0) return jsonResult(rg.stdout.trim().split("\n").slice(0, 200));
        if (rg.status === 1) return jsonResult("(no matches)");
        // fallback: simple walker
        const re = new RegExp(pattern);
        const out = [];
        await walkGrep(root, re, include, out);
        return jsonResult(out.length ? out.slice(0, 200) : "(no matches)");
      } catch (e) { return errResult(e.message); }
    },
  },

  bash: {
    name: "bash",
    description: "Run a shell command. Only use for real commands (build, test, git, ls, cat, node, etc.). Never run greetings or random words as commands.",
    schema: { ...PARA, properties: { command: { type: "string" }, timeout_ms: { type: "integer" } }, required: ["command"] },
    async run({ command, timeout_ms }, ctx) {
      const trimmed = (command || "").trim();
      // Guard: reject commands that look like typos or greetings
      if (trimmed.length < 3 && !/^[.\/\\]/.test(trimmed)) {
        return errResult(`command "${trimmed}" is too short to be a valid command. If the user is just chatting, reply normally without calling bash.`);
      }
      if (/^[a-zA-Z]{2,10}$/.test(trimmed) && !["ls", "cat", "cd", "pwd", "dir", "git", "npm", "npx", "node", "echo", "type", "set", "code", "more", "find", "sort", "where", "help", "cls", "clear", "whoami", "hostname"].includes(trimmed.toLowerCase())) {
        return errResult(`"${trimmed}" is not a known command. If the user is just chatting, reply normally without calling bash.`);
      }
      try {
        const r = await runShell({ command, cwd: process.cwd(), timeoutMs: timeout_ms || ctx?.tools?.bash?.timeoutMs || 120000 });
        const body = { ok: r.ok, code: r.code, killed: r.killed, stdout: r.stdout, stderr: r.stderr };
        if (!r.ok) return { ok: false, error: `exit ${r.code}`, output: JSON.stringify(body, null, 2) };
        return jsonResult(body);
      } catch (e) { return errResult(e.message); }
    },
  },

  task: {
    name: "task",
    description: `Launch a new agent to handle complex, multistep tasks autonomously.
Use this when you need to execute isolated, focused work that benefits from a fresh context.
Specify a subagent_type to select the appropriate agent.
Launch multiple agents concurrently whenever possible, to maximize performance.
Once you have delegated work, continue with non-overlapping tasks, or wait for the result.
The result returned by the subagent is not visible to the user; you must summarize it for them.
Provide a task_id to resume a prior subagent session.`,
    schema: {
      ...PARA,
      properties: {
        description: { type: "string", description: "A short (3-5 words) description of the task" },
        prompt: { type: "string", description: "The task for the agent to perform. Clearly specify what the agent should do and what info to return." },
        subagent_type: { type: "string", description: "The type of specialized agent to use for this task. Options: general (full agent with all tools), explore (fast, for research/search only)" },
        task_id: { type: "string", description: "This should only be set if you mean to resume a previous task (you can pass a prior task_id and the task will continue the same subagent session as before instead of creating a fresh one)" },
        command: { type: "string", description: "The command that triggered this task" },
      },
      required: ["description", "prompt"],
    },
    async run({ description, prompt, subagent_type, task_id, command }, ctx) {
      const id = task_id || crypto.randomBytes(8).toString("hex");
      const nodeBin = process.execPath;
      const script = path.join(import.meta.dirname, "..", "..", "bin", "wrivon.js");
      const agentType = subagent_type === "explore" ? "explore" : "general";
      return new Promise((resolve) => {
        const child = spawn(nodeBin, [script, "--agent", `[${agentType} subagent] ${prompt}`], {
          cwd: process.cwd(),
          env: { ...process.env, WRIVON_SUBAGENT: id },
          stdio: ["pipe", "pipe", "pipe"],
          windowsHide: true,
        });
        let stdout = "", stderr = "";
        const t = setTimeout(() => { child.kill("SIGTERM"); }, 300000);
        child.stdout.on("data", (b) => { stdout += b.toString(); });
        child.stderr.on("data", (b) => { stderr += b.toString(); });
        child.on("error", (e) => {
          clearTimeout(t);
          resolve(errResult(`<task id="${id}" state="error"><task_error>${e.message}</task_error></task>`));
        });
        child.on("close", (code) => {
          clearTimeout(t);
          if (code === 0) {
            resolve(jsonResult(`<task id="${id}" state="completed">\n<summary>${description || "Task"}</summary>\n<task_result>\n${stdout.trim()}\n</task_result>\n</task>`));
          } else {
            resolve({ ok: false, error: `<task id="${id}" state="error">\n<task_error>exit ${code}: ${(stderr || stdout).trim()}</task_error>\n</task>` });
          }
        });
      });
    },
  },

  serve: {
    name: "serve",
    description: "Start a local HTTP server to serve static files (HTML, JS, CSS) for local preview. Runs in background until stopped. Use for previewing websites you build. Defaults to serving the current directory.",
    schema: { ...PARA, properties: { port: { type: "integer", description: "Port number (e.g. 8080)" }, directory: { type: "string", description: "Directory to serve (default: current directory)" } }, required: ["port"] },
    async run({ port, directory }) {
      if (typeof port !== "number" && typeof port !== "string") return errResult("port must be a number");
      const p = parseInt(port, 10);
      if (isNaN(p) || p < 1 || p > 65535) return errResult(`invalid port: ${port}`);
      return await startServer(p, directory);
    },
  },

  webfetch: {
    name: "webfetch",
    description: "Fetch a URL and return its content as text. Use for documentation, API responses, web pages.",
    schema: { ...PARA, properties: { url: { type: "string", description: "The URL to fetch" } }, required: ["url"] },
    async run({ url }) {
      if (!url || typeof url !== "string") return errResult("url is required");
      try {
        new URL(url);
      } catch {
        return errResult(`invalid URL: ${url}`);
      }
      try {
        const r = await fetch(url, {
          headers: { "user-agent": "WRIVON/1.0" },
          signal: AbortSignal.timeout(30000),
        });
        if (!r.ok) return errResult(`HTTP ${r.status} ${r.statusText}`);
        const text = await r.text();
        const maxLen = 100000;
        const content = text.length > maxLen ? text.slice(0, maxLen) + `\n... (truncated ${text.length - maxLen} chars)` : text;
        return { ok: true, output: content };
      } catch (e) {
        return errResult(`fetch failed: ${e.message}`);
      }
    },
  },

  websearch: {
    name: "websearch",
    description: "Search the web for information. Use for finding documentation, solutions, recent news, APIs, libraries.",
    schema: { ...PARA, properties: { query: { type: "string", description: "Search query" }, numResults: { type: "integer", description: "Number of results (default 5)" } }, required: ["query"] },
    async run({ query, numResults }) {
      if (!query || typeof query !== "string") return errResult("query is required");
      try {
        const n = Math.min(Math.max(parseInt(numResults, 10) || 5, 1), 10);
        const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
          headers: { "user-agent": "WRIVON/1.0" },
          signal: AbortSignal.timeout(15000),
        });
        if (!r.ok) return errResult(`websearch failed: HTTP ${r.status}`);
        const html = await r.text();
        const results = [];
        const linkRe = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        const links = [];
        while ((match = linkRe.exec(html)) !== null && links.length < n) {
          const href = match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, "").replace(/&rut=.*$/, "");
          const title = match[2].replace(/<[^>]*>/g, "").trim();
          if (title && href && !href.startsWith("/")) {
            links.push({ title, href: decodeURIComponent(href) });
          }
        }
        const snippets = [];
        while ((match = snippetRe.exec(html)) !== null) {
          snippets.push(match[1].replace(/<[^>]*>/g, "").trim());
        }
        for (let i = 0; i < links.length; i++) {
          const snippet = snippets[i] || "";
          results.push(`${i + 1}. ${links[i].title}\n   ${links[i].href}\n   ${snippet}`);
        }
        if (!results.length) return jsonResult(`(no results for "${query}")`);
        return jsonResult(results.join("\n\n"));
      } catch (e) {
        return errResult(`websearch failed: ${e.message}`);
      }
    },
  },

  skill: {
    name: "skill",
    description: "Load a specialized skill when the task at hand matches one of the skills listed in the system prompt.",
    schema: {
      ...PARA,
      properties: {
        name: { type: "string", description: "The name of the skill from the available skills list" },
      },
      required: ["name"],
    },
    async run({ name }) {
      const skills = await discoverSkills();
      const skill = skills.find((s) => s.name === name);
      if (!skill) return errResult(`Skill "${name}" not found. Available: ${skills.map(s => s.name).join(", ")}`);
      let files = [];
      try {
        const entries = await fs.readdir(skill.directory, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isFile() && ent.name !== "SKILL.md") files.push(ent.name);
        }
      } catch { /* ignore */ }
      const lines = [
        `<skill_content name="${skill.name}">`,
        skill.content,
        `<skill_files>`,
        ...files.map((f) => `  <file>${skill.directory}/${f}</file>`),
        `</skill_files>`,
        `</skill_content>`,
      ];
      return jsonResult(lines.join("\n"));
    },
  },
};

// Build the OpenAI-style tool list from TOOLS.
export function openAITools() {
  return Object.values(TOOLS).map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.schema },
  }));
}

// Run a tool by name. Returns { ok, output, error? }.
export async function runTool(name, args, ctx) {
  const t = TOOLS[name];
  if (!t) return { ok: false, error: `unknown tool: ${name}` };
  return await t.run(args || {}, ctx);
}

// ----- helpers -----

async function walkGrep(dir, re, include, out) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "dist" || ent.name === "build") continue;
      await walkGrep(full, re, include, out);
    } else if (ent.isFile()) {
      if (include && !matchInclude(ent.name, include)) continue;
      try {
        const raw = await fs.readFile(full, "utf8");
        const lines = raw.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            out.push(`${full}:${i + 1}:${lines[i]}`);
            if (out.length >= 500) return;
          }
        }
      } catch { /* skip binary */ }
    }
  }
}

function matchInclude(name, pat) {
  // Tiny glob-to-regex: only supports * and ?.
  const re = new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
  return re.test(name);
}

async function manualGlob(root, pattern) {
  // Tiny recursive glob: supports **, *, ?.
  const re = globToRegExp(pattern);
  const out = [];
  await walkGlob(root, "", re, out);
  return out;
}

function globToRegExp(p) {
  let s = p.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  s = s.replace(/\\\*\\\*/g, "::DOUBLESTAR::")
       .replace(/\*/g, "[^/]*")
       .replace(/\?/g, "[^/]")
       .replace(/::DOUBLESTAR::/g, ".*");
  return new RegExp("^" + s + "$");
}

async function walkGlob(dir, rel, re, out) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const ent of entries) {
    const childRel = rel ? `${rel}/${ent.name}` : ent.name;
    if (re.test(childRel)) out.push(path.resolve(dir, ent.name));
    if (ent.isDirectory() && !ent.name.startsWith(".") && ent.name !== "node_modules") {
      await walkGlob(path.join(dir, ent.name), childRel, re, out);
    }
  }
}
