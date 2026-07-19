import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { runTool, openAITools } from "./tools.js";
import { loadSkillGuidance } from "../skill/discover.js";
import { buildRepoMap, renderRepoMap } from "../repo/map.js";

const MAX_TURNS = 25;
const SYSTEM_PROMPT_PATH = path.join(import.meta.dirname, "..", "prompt", "system.md");

// Chat modes
export const CHAT_MODES = {
  code: {
    name: "code",
    label: "💻 Code",
    description: "Full tool access — edit files, run commands, build, ship",
    instruction: "You are in CODE mode. You have full access to all tools. Edit files, run commands, and build things.",
    allowEdits: true,
  },
  ask: {
    name: "ask",
    label: "❓ Ask",
    description: "Read-only Q&A — discuss, explain, explore. No file edits.",
    instruction: "You are in ASK mode. Answer questions and explain code using only read-only tools (read, glob, grep). Do NOT edit, write, or run commands that modify the project. Do NOT use bash except for read-only commands like ls, cat, pwd.",
    allowEdits: false,
  },
  plan: {
    name: "plan",
    label: "📋 Plan",
    description: "Explore + output a structured plan. No file edits.",
    instruction: "You are in PLAN mode. Explore the codebase using read-only tools. Then output a numbered plan with: files to modify, approach, and order of changes. Do NOT edit any files. Do NOT run bash except for read-only exploration.",
    allowEdits: false,
  },
};

export function extractToolCalls(text) {
  const results = [];
  const seen = new Set();
  let i = 0;

  while (i < text.length) {
    const start = text.indexOf("{", i);
    if (start === -1) break;

    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;
    for (let j = start; j < text.length; j++) {
      const ch = text[j];
      if (escape) { escape = false; continue; }
      if (inString) {
        if (ch === '\\') escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }

    if (end === -1) break;

    const block = text.slice(start, end + 1);
    i = end + 1;

    if (seen.has(block)) continue;
    seen.add(block);

    try {
      const obj = JSON.parse(block);
      const name = obj.name || obj.function || null;
      const args = obj.arguments || obj.parameters || obj.params || null;
      if (name && args && typeof args === "object") {
        results.push({ name: String(name), args, raw: block });
      }
    } catch {
      // not valid JSON, skip
    }
  }

  return results;
}

export function extractSearchReplace(text) {
  // Detect SEARCH/REPLACE blocks in Aider/Claude Code format:
  //   ### path/to/file
  //   <<<<<<< SEARCH
  //   old text
  //   =======
  //   new text
  //   >>>>>>> REPLACE
  const results = [];
  const seen = new Set();
  const pathRe = /^###\s+(.+)$/gm;

  const parts = text.split(/(<<<<<<<\s*SEARCH\s*[\s\S]*?>>>>>>>\s*REPLACE)/);
  for (const part of parts) {
    if (!part.startsWith("<<<<<<< SEARCH")) continue;
    if (seen.has(part)) continue;
    seen.add(part);

    // Split the block into SEARCH / REPLACE
    const sepIdx = part.indexOf("\n=======\n");
    const endIdx = part.lastIndexOf("\n>>>>>>> REPLACE");
    if (sepIdx === -1 || endIdx === -1) continue;

    const searchBlock = part.slice(part.indexOf("\n") + 1, sepIdx).trimEnd();
    const replaceBlock = part.slice(sepIdx + "\n=======\n".length, endIdx).trimEnd();

    if (!searchBlock || !replaceBlock) continue;

    // Find the path: look for "### path/to/file" before this block
    const beforeText = text.slice(0, text.indexOf(part));
    const pathMatch = [...beforeText.matchAll(pathRe)].pop();
    const filePath = pathMatch ? pathMatch[1].trim() : "";

    results.push({
      search: searchBlock.replace(/\r\n/g, "\n"),
      replace: replaceBlock.replace(/\r\n/g, "\n"),
      path: filePath,
      raw: part,
    });
  }

  return results;
}

export async function loadProjectContext() {
  const candidates = ["WRIVON.md", "WRIVON", ".wrivon.md", "wrivon.md", "AGENTS.md", "CLAUDE.md"];
  const root = process.cwd();
  for (const name of candidates) {
    try {
      const p = path.join(root, name);
      const st = await fs.stat(p);
      if (st.isFile()) {
        const content = await fs.readFile(p, "utf8");
        return { file: name, content: content.trim() };
      }
    } catch { /* not found */ }
  }
  return null;
}

export async function loadSystemPrompt() {
  try {
    const base = await fs.readFile(SYSTEM_PROMPT_PATH, "utf8");
    const guidance = await loadSkillGuidance();
    const repo = renderRepoMap(await buildRepoMap(process.cwd()));
    const ctx = await loadProjectContext();
    let result = base + "\n" + repo + guidance;
    if (ctx) {
      result += `\n\nInstructions from: ${path.join(process.cwd(), ctx.file)}\n${ctx.content}`;
    }
    return result;
  } catch {
    return "You are WRIVON, a CLI coding agent.";
  }
}

// Estimate token count from messages (rough: ~4 chars per token)
function estimateTokens(messages) {
  let chars = 0;
  for (const m of messages) {
    if (m.content) chars += m.content.length;
    if (m.tool_calls) {
      for (const tc of m.tool_calls) {
        if (tc.function?.arguments) chars += tc.function.arguments.length;
        if (tc.function?.name) chars += tc.function.name.length;
      }
    }
  }
  return Math.ceil(chars / 4);
}

const MAX_CONTEXT_TOKENS = 32000; // Conservative limit for most 8B models
const COMPACTION_THRESHOLD = 24000; // Start compacting when approaching limit

export function compactMessages(messages) {
  if (estimateTokens(messages) <= COMPACTION_THRESHOLD) return messages;

  // Keep system prompt (index 0) + last 4 messages, summarize the rest
  const system = messages.slice(0, 1);
  const tail = messages.slice(-4);
  const middle = messages.slice(1, -4);

  if (middle.length < 2) return messages; // Nothing to compact

  // Build a summary of the middle portion
  const summaryParts = [];
  for (const m of middle) {
    if (m.role === "user") summaryParts.push(`User: ${(m.content || "").slice(0, 200)}`);
    else if (m.role === "assistant") {
      const text = (m.content || "").slice(0, 200);
      const tc = m.tool_calls?.length || 0;
      summaryParts.push(`Assistant: ${text}${tc ? ` [${tc} tool calls]` : ""}`);
    } else if (m.role === "tool") summaryParts.push(`Tool result: ${(m.content || "").slice(0, 100)}`);
  }

  const summary = summaryParts.join("\n");
  const compacted = [
    ...system,
    { role: "system", content: `Previous conversation summarized:\n${summary}\n--- End summary ---` },
    ...tail,
  ];

  return compacted;
}

export async function runTurn({
  userText,
  messages,
  provider,
  cfg,
  session,
  onEvent,
  signal,
  noTools,
  mode = "code",
}) {
  messages.push({ role: "user", content: userText });
  await session?.append({ type: "user", content: userText });
  onEvent?.({ kind: "user", content: userText });

  // Apply mode: restrict tools based on mode
  const chatMode = CHAT_MODES[mode] || CHAT_MODES.code;
  let modeTools = noTools || provider.kind === "ollama" ? [] : openAITools();
  if (!chatMode.allowEdits) {
    const readonlyNames = new Set(["read", "glob", "grep", "webfetch", "websearch", "skill"]);
    modeTools = modeTools.filter((t) => readonlyNames.has(t.function.name));
    // Remove write/edit/bash/serve from available tool calls
  }
  const tools = modeTools;

  // Inject mode instruction if not already present
  const hasModeInstruction = messages.some((m) => m.role === "system" && m.content?.includes("You are in"));
  if (!hasModeInstruction) {
    messages.splice(1, 0, { role: "system", content: chatMode.instruction });
  }

  let turn = 0;
  let lastFinish = "stop";
  let toolDupCount = 0;
  let prevToolSig = null;
  let forceTextOnly = false;

  while (turn < MAX_TURNS) {
    turn++;
    let streamedContent = "";
    let toolCalls = [];
    let didStreamHeader = false;

    let content, finalTools, finishReason;
    try {
      ({ content, toolCalls: finalTools, finishReason } = await provider.chat({
        messages,
        tools: forceTextOnly ? [] : tools,
        stream: cfg.ui.stream,
        signal,
        onToken: (chunk) => {
          const s = String(chunk);
          streamedContent += s;
          if (!didStreamHeader) { didStreamHeader = true; onEvent?.({ kind: "stream_start" }); }
          onEvent?.({ kind: "token", content: s });
        },
        onToolCall: (tc) => { toolCalls.push(tc); },
        onDone: (info) => { lastFinish = info.finishReason; },
      }));
    } catch (e) {
      const msg = `No working provider available — check your API keys are loaded (run .\\scripts\\env.ps1)`;
      onEvent?.({ kind: "error", content: msg });
      return { content: msg, finishReason: "error", turns: turn };
    }

    onEvent?.({ kind: "stream_end" });

    // -- fallback: detect inline JSON or SEARCH/REPLACE blocks in content --
    let inlineCalls = [];
    let cleanContent = content;
    if (!finalTools.length && !forceTextOnly) {
      // Try SEARCH/REPLACE blocks first (Aider/Claude Code format)
      const srBlocks = extractSearchReplace(content);
      const validSrBlocks = srBlocks.filter((b) => b.path);
      if (validSrBlocks.length) {
        inlineCalls = validSrBlocks.map((b) => ({
          id: "call_" + crypto.randomBytes(8).toString("hex"),
          type: "function",
          function: { name: "edit", arguments: JSON.stringify({ path: b.path, old_text: b.search, new_text: b.replace }) },
        }));
        cleanContent = content;
        for (const b of validSrBlocks) {
          cleanContent = cleanContent.replace(b.raw, "").trim();
          onEvent?.({ kind: "tool_start", name: "edit", args: { path: b.path, old_text: b.search.slice(0, 40) + "...", new_text: b.replace.slice(0, 40) + "..." } });
        }
        onEvent?.({ kind: "inline_tools_detected", toolCalls: inlineCalls, count: validSrBlocks.length });
      } else {
        // Fall back to inline JSON tool call detection
        const extracted = extractToolCalls(content);
        if (extracted.length) {
          inlineCalls = extracted.map((e) => {
            const id = "call_" + crypto.randomBytes(8).toString("hex");
            return {
              id,
              type: "function",
              function: { name: e.name, arguments: JSON.stringify(e.args) },
            };
          });
          cleanContent = content;
          for (const e of extracted) {
            cleanContent = cleanContent.replace(e.raw, "").trim();
          }
          onEvent?.({ kind: "inline_tools_detected", toolCalls: inlineCalls, count: extracted.length });
        }
      }
    }

    const activeToolCalls = finalTools.length ? finalTools : inlineCalls;

    // -- Dedup guard: block 3+ consecutive identical tool calls --
    if (!forceTextOnly && activeToolCalls.length) {
      const sig = activeToolCalls.map(tc => `${tc.function?.name}:${tc.function?.arguments}`).join("|");
      if (prevToolSig !== null && sig === prevToolSig) {
        toolDupCount++;
        if (toolDupCount >= 2) {
          forceTextOnly = true;
          toolDupCount = 0;
          prevToolSig = null;
        }
      } else {
        toolDupCount = 0;
        prevToolSig = sig;
      }
    }

    // Keep the original content (with JSON) in the message history so Cloudflare
    // doesn't reject it (requires string, not null). Use cleanContent only for events.
    const assistantMsg = { role: "assistant", content: cleanContent || content };
    if (activeToolCalls.length) assistantMsg.tool_calls = activeToolCalls;
    messages.push(assistantMsg);
    await session?.append({ type: "assistant", content: cleanContent || content, toolCalls: activeToolCalls, finishReason: lastFinish });
    onEvent?.({ kind: "assistant_done", content: cleanContent || "", toolCalls: activeToolCalls, finishReason: lastFinish });

    if (!activeToolCalls.length) {
      onEvent?.({ kind: "final", content: cleanContent });
      return { content: cleanContent, finishReason: lastFinish, turns: turn };
    }

    for (const tc of activeToolCalls) {
      const fnName = tc.function?.name;
      let args = {};
      try { args = JSON.parse(tc.function?.arguments || "{}"); } catch { args = {}; }

      onEvent?.({ kind: "tool_start", name: fnName, args });

      // Approval check for dangerous bash commands
      if (fnName === "bash" && args?.command) {
        const { isDangerousCommand } = await import("./tools.js");
        if (isDangerousCommand(args.command)) {
          onEvent?.({ kind: "ask", message: `Run dangerous command?\n  ${args.command}`, toolCallId: tc.id });
          // Grant approval silently (REPL will override via askUser)
          if (typeof cfg.askUser === "function") {
            const approved = await cfg.askUser(args.command);
            if (!approved) {
              const deniedMsg = `Command rejected by user: ${args.command}`;
              onEvent?.({ kind: "tool_end", name: fnName, ok: false, output: deniedMsg });
              const toolMsg = { role: "tool", tool_call_id: tc.id, content: deniedMsg };
              messages.push(toolMsg);
              await session?.append({ type: "tool", name: fnName, args, ok: false, output: deniedMsg });
              continue;
            }
          }
        }
      }

      const r = await runTool(fnName, args, { sandbox: cfg.sandbox.filesystem, tools: cfg.tools });
      const outStr = r.ok ? r.output : (r.error || "tool failed");
      onEvent?.({ kind: "tool_end", name: fnName, ok: r.ok, output: outStr });

      const toolMsg = { role: "tool", tool_call_id: tc.id, content: outStr };
      messages.push(toolMsg);
      await session?.append({ type: "tool", name: fnName, args, ok: r.ok, output: outStr });
    }

    if (forceTextOnly) {
      messages.push({ role: "system", content: "You made 3 identical tool calls. Tools are now blocked. Respond in text only." });
    }

    // Compact context if approaching token limit
    const beforeCompact = messages.length;
    messages = compactMessages(messages);
    if (messages.length < beforeCompact) {
      onEvent?.({ kind: "compacted", from: beforeCompact, to: messages.length });
    }
  }

  onEvent?.({ kind: "final", content: "", note: "max turns reached" });
  return { content: "", finishReason: "max_turns", turns: turn };
}
