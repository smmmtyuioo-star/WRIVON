// Interactive REPL. Uses Node's readline.createInterface for input/output,
// and the agent loop for streaming responses. All slash commands start with /.
// Non-/ lines are sent to the agent as user messages.

import readline from "node:readline";
import process from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import { loadSystemPrompt, runTurn, CHAT_MODES } from "../agent/loop.js";
import { openSession, listSessions, loadSession, setSessionName } from "../session/store.js";
import { createProvider } from "../llm/index.js";
import { createOpenAICompat } from "../llm/openai.js";
import { renderStream, printSplash, startSpinner, stopSpinner, drawInputBar } from "./render.js";
import { buildRepoMap, renderRepoMap, getCachedRepoMap } from "../repo/map.js";
import { NVIDIA_MODELS, GROQ_MODELS } from "../config/providers.js";
import { startServer, stopServer, listServers, stopAllServers } from "../tools/serve.js";
import { discoverSkills, loadSkill } from "../skill/discover.js";
import { indexKnowledge, loadDomainKnowledge, listDomains } from "../skill/knowledge.js";
import { runBuild } from "../agent/build.js";

const YELLOW = "\x1b[33m";
const GRAY = "\x1b[90m";
const RESET = "\x1b[0m";

// Pre-register default slash commands. Users can add more via config.
const DEFAULT_COMMANDS = ["help", "model", "models", "provider", "providers", "connect", "disconnect", "test", "map", "diff", "prompt", "config", "export", "name", "search", "init", "refactor", "review", "clear", "undo", "commit", "push", "sessions", "resume", "status", "mode", "ask", "plan", "code", "build", "skills", "agents", "knowledge", "serve", "servers", "stop", "exit"];

function printHelp() {
  const mode = globalThis.__WRIVON_CURRENT_MODE || "code";
  const modeStr = getModeLabel(mode);
  console.log(`
  ${BOLD}WRIVON — All Commands${RESET}

  ${GRAY}Current mode: ${modeStr}${RESET}

  ── Navigation ──────────────────────────────────────
  ${VIOLET}/help${RESET}                     Show this help
  ${VIOLET}/exit${RESET}                     Quit

  ── Modes ────────────────────────────────────────────
  ${VIOLET}/code${RESET}                     Code mode — full tool access, edit files
  ${VIOLET}/ask${RESET}                      Ask mode — read-only Q&A, no edits
  ${VIOLET}/plan${RESET}                     Plan mode — explore + structured plan
  ${VIOLET}/build <prompt>${RESET}           Build mode — create full apps from one prompt
  ${VIOLET}/mode${RESET}                     Show/switch chat mode

  ── Model & Provider ────────────────────────────────
  ${VIOLET}/model${RESET}                    Switch model (interactive picker)
  ${VIOLET}/models${RESET}                   List curated models for current provider
  ${VIOLET}/provider <name>${RESET}          Switch provider
  ${VIOLET}/providers${RESET}                List all configured providers
  ${VIOLET}/connect${RESET}                  Add a new API provider
  ${VIOLET}/disconnect <name>${RESET}        Remove a configured provider
  ${VIOLET}/test [provider]${RESET}          Test API connectivity

  ── Sessions ─────────────────────────────────────────
  ${VIOLET}/sessions [--all]${RESET}         List past sessions
  ${VIOLET}/resume <id>${RESET}              Load a past session
  ${VIOLET}/clear${RESET}                    Clear conversation (keeps system prompt)
  ${VIOLET}/undo${RESET}                     Remove last turn
  ${VIOLET}/export [--json]${RESET}          Export session as markdown or JSON
  ${VIOLET}/search <query>${RESET}           Search past sessions
  ${VIOLET}/name [<name>]${RESET}            Name the current session

  ── Skills, Agents & Knowledge ─────────────────────
  ${VIOLET}/skills${RESET}                   List available skill packs
  ${VIOLET}/skills <name>${RESET}            Load a skill into session
  ${VIOLET}/agents${RESET}                   Alias for /skills
  ${VIOLET}/knowledge${RESET}                List knowledge domains
  ${VIOLET}/knowledge <domain>${RESET}       Load domain knowledge into session

  ── Code & Git ──────────────────────────────────────
  ${VIOLET}/map${RESET}                      Show project structure
  ${VIOLET}/diff [target]${RESET}            Show git diff (uncommitted|staged|HEAD~1)
  ${VIOLET}/review [target]${RESET}          Code review
  ${VIOLET}/refactor <target>${RESET}        Refactoring mode
  ${VIOLET}/init${RESET}                     Project memory setup
  ${VIOLET}/commit [message]${RESET}         Stage all + commit (auto-generates message)
  ${VIOLET}/push${RESET}                     Push current branch to remote
  ${VIOLET}/prompt${RESET}                   Show the system prompt
  ${VIOLET}/config [key=val]${RESET}         View or set config
  ${VIOLET}/status${RESET}                   Show model, provider, session, context

  ── Web Server ──────────────────────────────────────
  ${VIOLET}/serve <port> [dir]${RESET}       Start local HTTP server
  ${VIOLET}/servers${RESET}                  List active HTTP servers
  ${VIOLET}/stop <port>${RESET}              Stop a server
  ${VIOLET}/stop --all${RESET}               Stop all servers

  ${GRAY}Everything else is sent as a prompt to the AI agent.${RESET}
`.trim());
}

function printBanner(cfg) {
  const tier = getModelTierForProvider(cfg.provider, cfg.providers?.[cfg.provider]?.model || cfg.model);
  const tierName = tier === 1 ? "fast" : tier === 2 ? "balanced" : tier === 3 ? "power" : "";
  printSplash(cfg, tierName);
}

export async function repl(provider, cfg) {
  const systemPrompt = await loadSystemPrompt();
  let messages = [{ role: "system", content: systemPrompt }];
  let sessionId = null;
  let currentProvider = provider;
  let session = await openSession(null, { provider: cfg.provider, model: currentProvider.model, cwd: process.cwd() });
  sessionId = session.id;
  let turnCount = 0;
  let initialMode = globalThis.__WRIVON_INITIAL_MODE || "code";
  delete globalThis.__WRIVON_INITIAL_MODE;
  let currentMode = initialMode;
  let modeInstructionInjected = false;

  globalThis.__WRIVON_CURRENT_MODE = initialMode;

  // Inject initial mode instruction if not code
  if (initialMode !== "code") {
    messages.push({ role: "system", content: CHAT_MODES[initialMode].instruction });
  }

  printBanner(cfg);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
    terminal: true,
    tabSize: 2,
    completer: (line) => {
      const hits = DEFAULT_COMMANDS.filter((c) => c.startsWith(line.replace(/^\//, "")));
      return [hits.length ? hits.map((c) => "/" + c) : DEFAULT_COMMANDS.map((c) => "/" + c), line];
    },
  });

  let stdinClosed = false;
  rl.on("close", () => { stdinClosed = true; });

  function showPrompt() {
    if (stdinClosed) return;
    drawInputBar(cfg.provider, currentProvider.model);
    process.stdout.write("> ");
  }
  showPrompt();

  let multiLineBuffer = "";
  const MULTI_LINE_PREFIX = "... ";
  let abortController = new AbortController();

  for await (const line of rl) {
    // Multi-line input: lines ending with \ or starting with ... continue
    const endsWithCont = line.endsWith("\\");
    const isContinuation = multiLineBuffer && (line.startsWith(MULTI_LINE_PREFIX) || endsWithCont || line.trim() === "");

    if (isContinuation) {
      const clean = line.replace(/^\\/, "").replace(/\\$/, "").replace(/^\.\.\. /, "").trimEnd();
      multiLineBuffer += (multiLineBuffer ? "\n" : "") + clean;
      if (endsWithCont) {
        if (!stdinClosed) showPrompt();
        continue;
      }
    } else if (endsWithCont) {
      multiLineBuffer = line.replace(/\\$/, "").trimEnd();
      if (!stdinClosed) showPrompt();
      continue;
    }

    if (stdinClosed) break;

    const trimmed = (multiLineBuffer ? multiLineBuffer + "\n" : "") + line.trim();
    multiLineBuffer = "";

    if (!trimmed) {
      if (!stdinClosed) showPrompt();
      continue;
    }

    // Cancel any in-flight abort (safe if none).
    // Reset abort controller for new request.
    abortController = new AbortController();

    const handled = await handleSlash(trimmed);
    if (handled) { if (!stdinClosed) showPrompt(); continue; }

    // Normal user message — run the agent.
    turnCount++;
    let currentText = "";

    // Wire up approval for dangerous commands
    cfg.askUser = async (cmd) => {
      process.stdout.write(`\n  ${YELLOW}⚠${RESET} Dangerous command: ${cmd}\n`);
      process.stdout.write(`  ${YELLOW}Run? (y/N) ${RESET}`);
      return new Promise((resolve) => {
        const onData = (buf) => {
          process.stdin.off("data", onData);
          const answer = buf.toString().trim().toLowerCase();
          resolve(answer === "y" || answer === "yes");
        };
        process.stdin.once("data", onData);
      });
    };

    startSpinner("thinking...");
    await runTurn({
      userText: trimmed,
      messages,
      provider: currentProvider,
      cfg,
      session,
      mode: currentMode,
      signal: abortController.signal,
      onEvent: (evt) => {
        if (evt.kind === "stream_start" || evt.kind === "token") stopSpinner();
        renderStream(evt, cfg);
        if (evt.kind === "final") currentText = evt.content || currentText;
        if (evt.kind === "token") currentText += evt.content;
      },
    });
    stopSpinner();

    // Safety net: if model responded but nothing was printed, print it now
    if (!currentText && messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.content) {
        process.stdout.write(lastMsg.content + "\n");
      }
    }

    // Save session state on every turn.
    await session.append({ type: "meta", turnCount, messageCount: messages.length });

    // Auto-name session from first user message
    if (turnCount === 1 && trimmed.length > 3) {
      const name = trimmed.length > 50 ? trimmed.slice(0, 47) + "..." : trimmed;
      await setSessionName(sessionId, name).catch(() => {});
    }

    if (!stdinClosed) showPrompt();
  }

  // After stdin closes — print session summary (never calls process.exit)
  console.log(`\nSession ${sessionId} — ${turnCount} turns, ${messages.length} messages`);
  console.log("Goodbye.");

  // ----- slash command handler -----
  async function handleSlash(line) {
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");

    switch (cmd) {
      case "/help":
        printHelp();
        return true;

      case "/models":
        await runModels(cfg.provider);
        return true;

      case "/model":
        if (!arg) {
          // Interactive picker — show tiers and let user pick by number
          const tierModels = getChatModelsForProvider(cfg.provider);
          if (!tierModels.length) {
            console.log(`No models available for provider "${cfg.provider}".`);
            return true;
          }
          // Build tier summary: show one rep per tier
          const tier1 = tierModels.find(m => m.tier === 1);
          const tier2 = tierModels.find(m => m.id === "deepseek-ai/deepseek-v4-pro") || tierModels.find(m => m.tier === 2);
          const tier3 = tierModels.find(m => m.tier === 3);
          console.log(`\n${BOLD}Pick a model tier:${RESET}`);
          console.log(`  ${CYAN}1)⚡ Fast${RESET}     ${GRAY}${tier1?.id || "—"}${RESET}  ${tier1 ? `(${tier1.timing})` : ""}`);
          console.log(`  ${YELLOW}2)◆ Coder${RESET}   ${GRAY}${tier2?.id || "—"}${RESET}  ${tier2 ? `(${tier2.timing})` : ""}`);
          console.log(`  ${RED}3)🔷 Power${RESET}   ${GRAY}${tier3?.id || "—"}${RESET}  ${tier3 ? `(${tier3.timing})` : ""}`);
          console.log(`  ${GRAY}4) List all models${RESET}`);
          console.log(`  ${GRAY}0) Cancel${RESET}`);
          const choice = await promptUser(`\n${GRAY}Enter 1-4: ${RESET}`);
          const n = parseInt(choice, 10);
          let target;
          if (n === 1) target = tier1;
          else if (n === 2) target = tier2;
          else if (n === 3) target = tier3;
          else if (n === 4) {
            // List all models
            await runModels(cfg.provider);
            return true;
          }
          if (target) {
            if (currentProvider && typeof currentProvider === "object" && "model" in currentProvider) {
              currentProvider.model = target.id;
            }
            const badge = tierBadge(target);
            console.log(`\nModel set to: ${badge} ${target.id} (${tierLabel(target)})`);
          } else if (n !== 0) {
            // If user entered an exact model ID, try that
            const exact = tierModels.find(m => m.id === choice.trim());
            if (exact) {
              if (currentProvider && typeof currentProvider === "object" && "model" in currentProvider) {
                currentProvider.model = exact.id;
              }
              console.log(`\nModel set to: ${exact.id}`);
            } else if (n !== 4) {
              console.log(`\nCancelled.`);
            }
          }
          return true;
        }
        // Direct model ID set (e.g. /model deepseek-ai/deepseek-v4-flash)
        if (currentProvider && typeof currentProvider === "object" && "model" in currentProvider) {
          currentProvider.model = arg;
        }
        console.log(`Model set to: ${arg}`);
        return true;

      case "/provider":
        if (!arg) {
          console.log(`Current provider: ${cfg.provider}`);
          return true;
        }
        try {
          const newCfg = { ...cfg };
          newCfg.provider = arg;
          currentProvider = createProvider(newCfg);
          cfg.provider = arg;
          console.log(`Provider switched to: ${arg} (${currentProvider.model})`);
        } catch (e) {
          console.log(`Error switching provider: ${e.message}`);
        }
        return true;

      case "/providers":
        await runProviders(cfg, currentProvider);
        return true;

      case "/connect":
        await runConnect(cfg, currentProvider, rl);
        return true;

      case "/disconnect":
        if (!arg) { console.log("Usage: /disconnect <provider-name>"); return true; }
        await runDisconnect(cfg, arg);
        return true;

      case "/status": {
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
        const estTokens = Math.ceil(chars / 4);
        const limit = 32000;
        const pct = Math.round((estTokens / limit) * 100);
        const bar = pct > 80 ? "🟡" : pct > 60 ? "🟢" : "🟢";
        console.log(`  Mode:     ${getModeLabel(currentMode)}`);
        console.log(`  Provider: ${cfg.provider}`);
        console.log(`  Model:    ${currentProvider.model}`);
        console.log(`  CWD:      ${process.cwd()}`);
        console.log(`  Turns:    ${turnCount}`);
        console.log(`  Session:  ${sessionId}`);
        console.log(`  Messages: ${messages.length}`);
        console.log(`  Context:  ${estTokens} / ${limit} tokens (${pct}%) ${bar}`);
        return true;
      }

      case "/map": {
        const info = await buildRepoMap(process.cwd());
        console.log(renderRepoMap(info));
        if (info.structure) console.log(`\nProject structure:\n${info.structure}`);
        return true;
      }

      case "/clear":
        const backup = messages.slice(0, 1); // keep system prompt
        messages = backup;
        console.log("Conversation cleared (system prompt kept).");
        return true;

      case "/sessions": {
        const showAll = arg === "--all";
        const cwd = showAll ? null : process.cwd();
        const list = await listSessions(cwd);
        if (!list.length) {
          if (showAll) console.log("No sessions yet.");
          else console.log(`No sessions for this project. Use /sessions --all to see all.`);
          return true;
        }
        console.log(`  ${showAll ? "All sessions" : `Sessions for: ${process.cwd()}`}`);
        console.log("  ID                          DATE                      MSGS  NAME                          CWD");
        for (const s of list.slice(0, 20)) {
          const date = new Date(s.mtime).toISOString().replace("T", " ").slice(0, 19);
          const msgs = s.userMessages || s.messages || "?";
          const name = (s.name || "").slice(0, 26);
          const cwdShort = (s.cwd || "").split("\\").pop().split("/").pop().slice(0, 16);
          console.log(`  ${s.id.slice(0, 26).padEnd(26)}  ${date}  ${String(msgs).padStart(3)}   ${name.padEnd(26)}  ${cwdShort}`);
        }
        return true;
      }

      case "/resume":
        if (!arg) { console.log("Usage: /resume <session-id>"); return true; }
        const records = await loadSession(arg);
        if (!records) { console.log(`Session not found: ${arg}`); return true; }
        const restored = [{ role: "system", content: systemPrompt }];
        for (const r of records) {
          if (r.type === "user") restored.push({ role: "user", content: r.content });
          else if (r.type === "assistant") {
            const m = { role: "assistant", content: r.content };
            if (r.toolCalls?.length) m.tool_calls = r.toolCalls;
            restored.push(m);
          } else if (r.type === "tool") {
            restored.push({ role: "tool", tool_call_id: r.tool_call_id || r.id || "none", content: r.output || r.content });
          }
        }
        messages = restored;
        sessionId = arg;
        session = await openSession(arg, { provider: cfg.provider, model: currentProvider.model, cwd: process.cwd() });
        console.log(`Resumed session ${arg} (${restored.length - 1} messages).`);
        return true;

      case "/undo":
        const removed = [];
        while (messages.length > 1 && removed.length < 2) {
          const last = messages.pop();
          removed.push(last);
        }
        console.log(`Undid ${removed.length} message(s).`);
        return true;

      case "/diff": {
        const diffTarget = arg || "uncommitted";
        const cmd = diffTarget === "staged" ? "git diff --cached" : diffTarget.startsWith("HEAD") ? `git diff ${diffTarget}` : "git diff";
        const { runShell } = await import("../util/shell.js");
        const r = await runShell({ command: cmd, cwd: process.cwd(), timeoutMs: 10000 });
        if (!r.ok && r.code !== 1) { console.log(`git diff failed: ${r.stderr || r.stdout}`); return true; }
        const output = r.stdout.trim();
        if (!output) { console.log("No changes."); return true; }
        // Paginate if long
        const lines = output.split("\n");
        const max = 80;
        console.log(lines.slice(0, max).join("\n"));
        if (lines.length > max) console.log(`... ${lines.length - max} more lines. Use /review for full AI review.`);
        return true;
      }

      case "/prompt": {
        console.log("── System prompt ──");
        console.log(systemPrompt.slice(0, 2000));
        if (systemPrompt.length > 2000) console.log(`... ${systemPrompt.length - 2000} more chars`);
        console.log("── ${messages.length} messages in context ──");
        return true;
      }

      case "/config": {
        if (!arg) {
          console.log(JSON.stringify(cfg, null, 2).slice(0, 2000));
          return true;
        }
        const eqIdx = arg.indexOf("=");
        if (eqIdx === -1) {
          // View specific key
          const keys = arg.split(".");
          let val = cfg;
          for (const k of keys) {
            if (val && typeof val === "object") val = val[k];
            else { val = undefined; break; }
          }
          console.log(val !== undefined ? `${arg} = ${JSON.stringify(val)}` : `Config key not found: ${arg}`);
          return true;
        }
        const key = arg.slice(0, eqIdx).trim();
        const valStr = arg.slice(eqIdx + 1).trim();
        const keys = key.split(".");
        let target = cfg;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]] || typeof target[keys[i]] !== "object") target[keys[i]] = {};
          target = target[keys[i]];
        }
        // Try to parse as JSON, otherwise use as string
        try { target[keys[keys.length - 1]] = JSON.parse(valStr); }
        catch { target[keys[keys.length - 1]] = valStr; }
        console.log(`Set ${key} = ${JSON.stringify(target[keys[keys.length - 1]])}`);
        return true;
      }

      case "/name": {
        const ok = await setSessionName(sessionId, arg || "");
        if (ok) console.log(arg ? `Session named: "${arg}"` : "Session name cleared");
        else console.log("Failed to name session");
        return true;
      }

      case "/search": {
        if (!arg) { console.log("Usage: /search <query>"); return true; }
        const { loadSession, listSessions: ls } = await import("../session/store.js");
        const list = await ls(process.cwd());
        const query = arg.toLowerCase();
        let found = 0;
        for (const s of list) {
          if (found >= 10) break;
          try {
            const records = await loadSession(s.id);
            for (const r of records) {
              if ((r.type === "user" || r.type === "assistant") && r.content?.toLowerCase().includes(query)) {
                const date = new Date(s.mtime).toISOString().replace("T", " ").slice(0, 19);
                const name = s.name || s.id.slice(0, 12);
                const preview = (r.content || "").slice(0, 120).replace(/\n/g, " ");
                console.log(`  ${name}  ${date}  ${r.type === "user" ? ">" : "AI"} ${preview}`);
                found++;
                break;
              }
            }
          } catch { /* skip corrupt sessions */ }
        }
        if (!found) console.log("No matches found.");
        return true;
      }

      case "/test": {
        const testName = arg || cfg.provider;
        const testCfg = { ...cfg, provider: testName };
        let testProvider;
        try {
          testProvider = createProvider(testCfg);
        } catch (e) {
          console.log(`  Failed to create provider "${testName}": ${e.message}`);
          return true;
        }
        console.log(`  Testing ${testName}/${testProvider.model}...`);
        const start = Date.now();
        try {
          const models = await testProvider.listModels();
          const elapsed = Date.now() - start;
          const modelCount = Array.isArray(models) ? models.length : "?";
          console.log(`  OK — ${modelCount} models available (${elapsed}ms)`);
        } catch (e) {
          const elapsed = Date.now() - start;
          console.log(`  FAIL — ${e.message} (${elapsed}ms)`);
          // Try a simple chat as fallback test
          console.log("  Trying chat test...");
          const chatStart = Date.now();
          try {
            const result = await testProvider.chat({
              messages: [{ role: "user", content: "say hello" }],
              stream: false,
            });
            const chatElapsed = Date.now() - chatStart;
            console.log(`  Chat OK — ${(result.content || "").slice(0, 100)} (${chatElapsed}ms)`);
          } catch (e2) {
            console.log(`  Chat FAIL — ${e2.message}`);
          }
        }
        return true;
      }

      case "/export": {
        const useJson = arg === "--json";
        const lines = [];
        if (useJson) {
          const exportData = messages.map((m, i) => ({
            turn: i,
            role: m.role,
            content: m.content || "",
            toolCalls: m.tool_calls ? m.tool_calls.map(tc => ({ name: tc.function?.name, args: tc.function?.arguments })) : undefined,
          }));
          const json = JSON.stringify(exportData, null, 2);
          const p = path.join(process.cwd(), `wrivon-session-${sessionId}.json`);
          await fs.writeFile(p, json, "utf8");
          console.log(`Exported ${messages.length} messages to ${p}`);
        } else {
          const title = `# WRIVON Session: ${sessionId}\n\n`;
          const body = messages.map((m, i) => {
            if (m.role === "system") return `## System (turn ${i})\n\n${m.content.slice(0, 500)}...\n`;
            if (m.role === "user") return `## User (turn ${i})\n\n${m.content}\n`;
            if (m.role === "assistant") {
              const tcs = m.tool_calls?.length ? `\n\n*Tool calls: ${m.tool_calls.map(tc => tc.function?.name).join(", ")}*` : "";
              return `## Assistant (turn ${i})\n\n${m.content}${tcs}\n`;
            }
            if (m.role === "tool") return `### Tool result (turn ${i})\n\n\`\`\`\n${(m.content || "").slice(0, 500)}\n\`\`\`\n`;
            return "";
          }).join("\n---\n");
          const md = title + body;
          const p = path.join(process.cwd(), `wrivon-session-${sessionId}.md`);
          await fs.writeFile(p, md, "utf8");
          console.log(`Exported ${messages.length} messages to ${p}`);
        }
        return true;
      }

      case "/refactor": {
        if (!arg) { console.log("Usage: /refactor <file or pattern>"); return true; }
        const template = `You are in refactoring mode.

Target: ${arg}

Analyze the target and propose refactoring that:
1. Improves code quality (readability, maintainability, performance)
2. Preserves existing behavior (no breaking changes)
3. Follows project conventions
4. Adds or updates tests

First read the relevant files, then propose specific changes using SEARCH/REPLACE blocks.
After applying changes, run the test suite to verify nothing is broken.`;
        messages.push({ role: "user", content: template });
        await runTurn({ userText: template, messages, provider, cfg, session, onEvent: (evt) => renderStream(evt, cfg) });
        return true;
      }

      case "/init":
        await runInit(currentProvider, cfg, messages, session);
        return true;

      case "/review":
        await runReview(currentProvider, cfg, arg, messages, session);
        return true;

      case "/commit":
        await runCommit(arg);
        return true;

      case "/push":
        await runPush();
        return true;

      case "/mode": {
        if (!arg) {
          console.log(`\n${BOLD}Current mode:${RESET} ${getModeLabel(currentMode)}`);
          console.log(`\nAvailable modes:`);
          for (const [key, m] of Object.entries(CHAT_MODES)) {
            const active = key === currentMode ? ` ${GREEN}← active${RESET}` : "";
            console.log(`  /mode ${key.padEnd(8)} ${m.label} ${GRAY}— ${m.description}${RESET}${active}`);
          }
          return true;
        }
        const newMode = arg.toLowerCase();
        if (!CHAT_MODES[newMode]) {
          console.log(`Unknown mode: "${arg}". Available: ${Object.keys(CHAT_MODES).join(", ")}`);
          return true;
        }
        currentMode = newMode;
        globalThis.__WRIVON_CURRENT_MODE = newMode;
        modeInstructionInjected = false;
        const modeMsg = { role: "system", content: CHAT_MODES[newMode].instruction };
        messages.push(modeMsg);
        console.log(`\n${GREEN}✓${RESET} Switched to ${getModeLabel(newMode)} mode. ${CHAT_MODES[newMode].description}`);
        return true;
      }

      case "/ask":
        currentMode = "ask";
        globalThis.__WRIVON_CURRENT_MODE = "ask";
        messages.push({ role: "system", content: CHAT_MODES.ask.instruction });
        console.log(`\n${GREEN}✓${RESET} Switched to ${getModeLabel("ask")} mode. I'll only read and explain — no edits.`);
        return true;

      case "/plan":
        currentMode = "plan";
        globalThis.__WRIVON_CURRENT_MODE = "plan";
        messages.push({ role: "system", content: CHAT_MODES.plan.instruction });
        console.log(`\n${GREEN}✓${RESET} Switched to ${getModeLabel("plan")} mode. Explore first, then output a plan.`);
        return true;

      case "/code":
        currentMode = "code";
        globalThis.__WRIVON_CURRENT_MODE = "code";
        messages.push({ role: "system", content: CHAT_MODES.code.instruction });
        console.log(`\n${GREEN}✓${RESET} Switched to ${getModeLabel("code")} mode. Full tool access.`);
        return true;

      case "/build": {
        if (!arg) { console.log(`  ${YELLOW}Usage: /build <description of app to build>${RESET}\n  Example: /build a todo app with React frontend and Express backend`); return true; }
        startSpinner("Planning your app...");
        const buildResult = await runBuild({
          userText: arg,
          messages,
          provider: currentProvider,
          cfg,
          session,
          onEvent: (evt) => {
            stopSpinner();
            renderBuildEvent(evt, cfg);
          },
          signal: abortController.signal,
        });
        if (buildResult) {
          const s = buildResult;
          console.log(`\n${BOLD}${GREEN}✓ Build Complete${RESET}`);
          console.log(`  ${BOLD}App:${RESET} ${s.appName}`);
          console.log(`  ${BOLD}Location:${RESET} ${s.rootDir}`);
          console.log(`  ${BOLD}Stack:${RESET} ${s.techStack}`);
          console.log(`  ${BOLD}Files:${RESET} ${s.filesCreated} created${s.filesFailed ? `, ${s.filesFailed} failed` : ""}`);
          if (s.installOk) console.log(`  ${BOLD}Deps:${RESET} ${GREEN}installed${RESET}`);
          else if (s.filesCreated > 0) console.log(`  ${BOLD}Deps:${RESET} ${YELLOW}install may have issues${RESET}`);
          console.log(`  ${BOLD}Run:${RESET} cd ${s.rootDir} && ${s.runCommand}`);
          if (s.failedFiles.length) {
            console.log(`  ${YELLOW}Failed files:${RESET}`);
            for (const f of s.failedFiles) console.log(`    ${RED}✗${RESET} ${f}`);
          }
        }
        return true;
      }

      case "/skills":
      case "/agents": {
        if (arg) {
          const skillContent = await loadSkill(arg);
          if (!skillContent) {
            console.log(`  ${YELLOW}⚠${RESET} Skill "${arg}" not found. Use /skills to list available skills.`);
            return true;
          }
          const injected = `The following skill "${arg}" has been loaded. Follow its guidance:\n\n${skillContent}`;
          messages.push({ role: "system", content: injected });
          console.log(`  ${GREEN}✓${RESET} Skill "${arg}" loaded into session (${skillContent.length} chars).`);
          return true;
        }
        // List available skills grouped by category
        const all = await discoverSkills();
        if (!all.length) {
          console.log(`  ${GRAY}No skills available.${RESET}`);
          return true;
        }
        console.log(`\n${BOLD}Available Skills:${RESET}`);
        const cats = {};
        for (const s of all) {
          const cat = s.category || "other";
          if (!cats[cat]) cats[cat] = [];
          cats[cat].push(s);
        }
        for (const [cat, skills] of Object.entries(cats)) {
          console.log(`\n  ${CYAN}${cat}${RESET}`);
          for (const s of skills) {
            const name = s.name.padEnd(24);
            const desc = (s.description || "").slice(0, 60);
            console.log(`    ${name} ${GRAY}${desc}${RESET}`);
          }
        }
        console.log(`\n  ${GRAY}Use /skills <name> to load a skill.${RESET}`);
        return true;
      }

      case "/knowledge": {
        if (arg) {
          const knowledge = await loadDomainKnowledge(arg);
          if (!knowledge) {
            console.log(`  ${YELLOW}⚠${RESET} Knowledge domain "${arg}" not found. Use /knowledge to list available domains.`);
            return true;
          }
          const injected = `## Knowledge Domain: ${knowledge.domain}\n${knowledge.label}\n\n${knowledge.content}`;
          messages.push({ role: "system", content: injected });
          console.log(`  ${GREEN}✓${RESET} Knowledge "${knowledge.domain}" loaded (${knowledge.size || knowledge.content.length} chars from ${knowledge.path}).`);
          return true;
        }
        // List available knowledge domains
        const catalog = await indexKnowledge();
        const domains = listDomains();
        console.log(`\n${BOLD}Available Knowledge Domains:${RESET}`);
        for (const d of domains) {
          const status = catalog[d.key]?.exists ? `${GREEN}✓${RESET}` : `${GRAY}—${RESET}`;
          console.log(`  ${status} ${d.key.padEnd(22)} ${GRAY}${d.label}${RESET}`);
        }
        console.log(`\n  ${GRAY}Use /knowledge <domain> to load domain expertise.${RESET}`);
        return true;
      }

      case "/serve": {
        const serveParts = arg.split(/\s+/);
        const servePort = serveParts[0] || "8080";
        const serveDir = serveParts[1] || ".";
        const p = parseInt(servePort, 10);
        if (isNaN(p) || p < 1 || p > 65535) {
          console.log(`  ${RED}✗${RESET} Invalid port: ${servePort}`);
          return true;
        }
        const result = await startServer(p, serveDir);
        if (result.ok) {
          console.log(`  ${GREEN}✓${RESET} ${result.output}`);
        } else {
          console.log(`  ${RED}✗${RESET} ${result.error}`);
        }
        return true;
      }

      case "/servers": {
        const sr = listServers();
        console.log(sr.output);
        return true;
      }

      case "/stop": {
        const stopPort = parseInt(arg, 10);
        if (isNaN(stopPort)) {
          // Stop all or show usage
          if (arg === "--all") {
            const r = stopAllServers();
            console.log(`  ${GREEN}✓${RESET} ${r.output}`);
          } else {
            console.log("Usage: /stop <port> | /stop --all");
          }
          return true;
        }
        const r = stopServer(stopPort);
        if (r.ok) {
          console.log(`  ${GREEN}✓${RESET} ${r.output}`);
        } else {
          console.log(`  ${YELLOW}⚠${RESET} ${r.error}`);
        }
        return true;
      }

      case "/exit":
      case "/quit":
        stopAllServers();
        console.log("Goodbye.");
        process.exit(0);
        return true;

      default:
        if (cmd.startsWith("/")) {
          console.log(`Unknown command: ${cmd}. Type /help for a list.`);
          return true;
        }
        return false;
    }
  }
}

// ----- subroutines for built-in commands -----
async function runInit(provider, cfg, messages, session) {
  // Auto-detect project info
  const { buildRepoMap, renderRepoMap } = await import("../repo/map.js");
  const info = await buildRepoMap(process.cwd());
  const lang = info.language || "unknown";
  const pkg = info.packageJson || path.basename(process.cwd());
  const testCmd = info.testPattern || "unknown";
  const scripts = info.scripts.length ? info.scripts.slice(0, 5).join("\n    ") : "none detected";

  const template = `You are initializing WRIVON.md for the project at ${process.cwd()}.

Detected project info:
- Name: ${pkg}
- Language: ${lang}
- Test command: ${testCmd}
- Scripts:
    ${scripts}
- Git repo: ${info.hasGit ? "yes" : "no"}

Generate a WRIVON.md file that describes:
1. What the project does (one line)
2. Language and framework used
3. Build, test, lint, and run commands
4. Code conventions (naming, formatting, imports)
5. Architecture overview (key directories and their purpose)
6. Environment variables needed

Output the complete WRIVON.md content. The user will review and save it.`;
  messages.push({ role: "user", content: template });
  await runTurn({ userText: template, messages, provider, cfg, session, onEvent: (evt) => renderStream(evt, cfg) });
}

async function runReview(provider, cfg, targetArg, messages, session) {
  const target = targetArg || "uncommitted";
  const template = `You are in code-review mode. Review the "${target}" changes in the current project.
Look for: bugs, security issues, missing error handling, missing tests, API compatibility breaks.
Output: issues sorted by severity with file:line references.`;
  messages.push({ role: "user", content: template });
  await runTurn({ userText: template, messages, provider, cfg, session, onEvent: (evt) => renderStream(evt, cfg) });
}

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";

function promptUser(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const onData = (buf) => {
      process.stdin.off("data", onData);
      resolve(buf.toString().trimEnd());
    };
    process.stdin.once("data", onData);
  });
}

async function runProviders(cfg, currentProvider) {
  const { WELL_KNOWN_PROVIDERS } = await import("../config/providers.js");
  const entries = Object.entries(cfg.providers || {});
  if (!entries.length) { console.log("No providers configured."); return; }

  console.log(`\n${BOLD}Providers${RESET}`);
  console.log(`  ${"ID".padEnd(24)} ${"MODEL".padEnd(34)} ${"STATUS"}`);
  for (const [name, p] of entries) {
    const isActive = name === cfg.provider;
    const isConnected = p.kind === "cloudflare"
      ? !!(p.apiKey && p.accountId)
      : p.kind === "ollama" || !!p.apiKey;
    const model = (p.model || "?").slice(0, 32);
    const status = isActive
      ? `${GREEN}● active${RESET}`
      : isConnected
        ? `${GRAY}  idle${RESET}`
        : `${YELLOW}  not connected${RESET}`;
    const color = isActive ? GREEN : GRAY;
    console.log(`  ${color}${name.padEnd(24)}${RESET} ${color}${model.padEnd(34)}${RESET} ${status}`);
  }
  console.log(`  ${GRAY}Use /provider <name> to switch, /connect to add a provider${RESET}\n`);
}

async function runConnect(cfg, currentProvider, rl) {
  const { WELL_KNOWN_PROVIDERS, saveProviderToConfig } = await import("../config/providers.js");

  const ask = (q) => new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));

  // Step 1: Pick known provider or custom
  let choice;
  while (true) {
    console.log(`\n${BOLD}Select a provider to connect:${RESET}`);
    WELL_KNOWN_PROVIDERS.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.baseUrl})`);
    });
    console.log(`  ${WELL_KNOWN_PROVIDERS.length + 1}. Custom API (OpenAI-compatible)`);
    const ans = await ask("\nEnter number: ");
    const n = parseInt(ans, 10);
    if (n >= 1 && n <= WELL_KNOWN_PROVIDERS.length) { choice = WELL_KNOWN_PROVIDERS[n - 1]; break; }
    if (n === WELL_KNOWN_PROVIDERS.length + 1) { choice = null; break; }
    console.log("Invalid choice. Try again.");
  }

  if (choice) {
    // Known provider — gather API key
    console.log(`\n${CYAN}${choice.name}${RESET}`);
    console.log(`  Endpoint: ${choice.baseUrl}`);
    console.log(`  Default model: ${choice.defaultModel}`);
    console.log(`  Get your API key at: ${choice.docsUrl}`);
    console.log(`  Or set env var: ${choice.envKey}`);

    const apiKey = (await ask("\nAPI key (or leave blank to use env var): ")).trim();
    const model = (await ask(`Model [${choice.defaultModel}]: `)).trim() || choice.defaultModel;

    const cfgEntry = {
      baseUrl: choice.baseUrl,
      apiKey: apiKey || `env:${choice.envKey}`,
      model,
      kind: choice.kind,
    };

    saveProviderToConfig(choice.id, cfgEntry);
    cfg.provider = choice.id;
    cfg.providers[choice.id] = cfgEntry;
    currentProvider.model = model;
    console.log(`\n${GREEN}✓${RESET} Provider "${choice.name}" added and set as active.`);

    await testProviderConnectivity(cfg, choice.id, apiKey, choice.baseUrl, model);

  } else {
    // Custom provider
    console.log(`\n${CYAN}Custom OpenAI-compatible API${RESET}`);
    console.log("  This works with any OpenAI-compatible endpoint (OpenAI, vLLM, Ollama, LM Studio, etc.)");

    const providerId = (await ask("\nProvider ID (e.g. my-local-llm): ")).trim() || "custom";
    const baseUrl = (await ask("Base URL (e.g. https://api.openai.com/v1): ")).trim().replace(/\/+$/, "");
    const apiKey = (await ask("API key (leave blank if not needed): ")).trim();
    const model = (await ask("Model name (e.g. gpt-4o-mini): ")).trim() || "gpt-4o-mini";

    const cfgEntry = { baseUrl, apiKey, model, kind: "openai" };

    saveProviderToConfig(providerId, cfgEntry);
    cfg.provider = providerId;
    cfg.providers[providerId] = cfgEntry;
    currentProvider.model = model;
    console.log(`\n${GREEN}✓${RESET} Custom provider "${providerId}" added and set as active.`);

    await testProviderConnectivity(cfg, providerId, apiKey, baseUrl, model);
  }
}

async function testProviderConnectivity(cfg, name, apiKey, baseUrl, model) {
  console.log(`\n  Testing connectivity to ${name}...`);
  const testClient = createOpenAICompat({ apiKey, baseUrl, model });
  const start = Date.now();
  try {
    const models = await testClient.listModels();
    const elapsed = Date.now() - start;
    const count = Array.isArray(models) ? models.length : "?";
    console.log(`  ${GREEN}✓${RESET} Connected — ${count} models available (${elapsed}ms)`);
  } catch (e) {
    const elapsed = Date.now() - start;
    console.log(`  ${YELLOW}⚠${RESET} List models failed: ${e.message} (${elapsed}ms)`);
    console.log(`  Trying chat test...`);
    const chatStart = Date.now();
    try {
      const result = await testClient.chat({
        messages: [{ role: "user", content: "Say hello in one word." }],
        stream: false,
      });
      const chatElapsed = Date.now() - chatStart;
      console.log(`  ${GREEN}✓${RESET} Chat OK — "${(result.content || "").slice(0, 60)}" (${chatElapsed}ms)`);
    } catch (e2) {
      console.log(`  ${RED}✗${RESET} Chat FAIL — ${e2.message}`);
      console.log(`  Provider saved but connectivity test failed. Check your API key and endpoint.`);
    }
  }
}

async function runDisconnect(cfg, name) {
  const { removeProviderFromConfig } = await import("../config/providers.js");
  if (name === cfg.provider) {
    console.log(`  ${YELLOW}⚠${RESET} "${name}" is currently active. Switch to another provider first with /provider <name>.`);
    return;
  }
  if (!cfg.providers[name]) {
    console.log(`  Provider "${name}" not found.`);
    return;
  }
  if (removeProviderFromConfig(name)) {
    delete cfg.providers[name];
    console.log(`  ${GREEN}✓${RESET} Provider "${name}" removed.`);
  } else {
    console.log(`  Failed to remove provider "${name}".`);
  }
}

function runModelList(providerName) {
  const models = getModelsForProvider(providerName);
  if (!models || !models.length) {
    console.log("  Use /model <id> to set any model ID.");
    return;
  }
  console.log(`\n${BOLD}Available ${providerName} models:${RESET}`);
  for (const m of models) {
    const badge = tierBadge(m);
    console.log(`  ${badge} ${m.id}`);
  }
  console.log(`  Use /models for details. Use /model <id> to switch.\n`);
}

async function runModels(providerName) {
  const models = getModelsForProvider(providerName);
  if (!models || !models.length) {
    console.log(`No curated model list for provider "${providerName}". Use /model <id> to set any model ID.`);
    return;
  }
  console.log(`\n${BOLD}Curated models for ${providerName}:${RESET}`);
  console.log("");
  for (const m of models) {
    const badge = tierBadge(m);
    const label = `${badge} ${tierLabel(m)}`;
    const timing = m.timing ? ` (${m.timing})` : "";
    console.log(`  ${label.padEnd(28)} ${m.id}`);
    if (m.desc) console.log(`  ${"".padEnd(28)} ${GRAY}${m.desc}${timing}${RESET}`);
    console.log("");
  }
}

function getChatModelsForProvider(providerName) {
  const all = getModelsForProvider(providerName);
  if (!all) return [];
  return all.filter(m => m.kind === "chat" || !m.kind);
}

function getModelsForProvider(providerName) {
  if (providerName === "nvidia") {
    return NVIDIA_MODELS;
  }
  if (providerName === "groq") {
    return GROQ_MODELS;
  }
  return null;
}

function tierBadge(m) {
  if (m.tier === 1) return `${CYAN}⚡${RESET}`;
  if (m.tier === 2) return `${YELLOW}◆${RESET}`;
  if (m.tier === 3) return `${RED}🔷${RESET}`;
  return "  ";
}

function tierLabel(m) {
  if (m.tier === 1) return `${CYAN}Tier 1 — Fast${RESET}`;
  if (m.tier === 2) return `${YELLOW}Tier 2 — Balanced${RESET}`;
  if (m.tier === 3) return `${RED}Tier 3 — Power${RESET}`;
  return "";
}

function getModeLabel(mode) {
  const m = CHAT_MODES[mode];
  return m ? `${m.label} ${GRAY}(${m.description})${RESET}` : mode;
}

function getModelTierForProvider(providerName, modelId) {
  const models = getModelsForProvider(providerName);
  if (!models) return null;
  const m = models.find(x => x.id === modelId);
  return m ? m.tier : null;
}

// ── Git commands ─────────────────────────────────────────────────────
function checkGit() {
  if (globalThis.__WRIVON_GIT_AVAIL === false) {
    console.log(`  ${YELLOW}⚠ Git not found. Install it from https://git-scm.com to enable commit/push features.${RESET}`);
    return false;
  }
  return true;
}

async function runCommit(msg) {
  if (!checkGit()) return;
  const { runShell } = await import("../util/shell.js");

  // Stage all
  const stage = await runShell({ command: "git add -A", cwd: process.cwd(), timeoutMs: 10000 });
  if (!stage.ok) {
    console.log(`  ${RED}✗${RESET} Failed to stage files: ${stage.stderr || stage.stdout}`);
    return;
  }

  // Check if there's anything to commit
  const status = await runShell({ command: "git status --porcelain", cwd: process.cwd(), timeoutMs: 5000 });
  if (!status.ok || !status.stdout.trim()) {
    console.log(`  ${YELLOW}Nothing to commit.${RESET}`);
    return;
  }

  if (!msg) {
    // Auto-generate a commit message from the diff
    const diff = await runShell({ command: "git diff --cached --stat", cwd: process.cwd(), timeoutMs: 5000 });
    const files = diff.ok ? diff.stdout.trim().split("\n").map(l => l.trim()).join("; ") : "changes";
    msg = `wrivon: ${files || "update"}`;
    if (msg.length > 100) msg = msg.slice(0, 97) + "...";
  }

  const commit = await runShell({ command: `git commit -m "${msg.replace(/"/g, '\\"')}"`, cwd: process.cwd(), timeoutMs: 10000 });
  if (commit.ok) {
    console.log(`  ${GREEN}✓${RESET} ${commit.stdout.trim()}`);
  } else {
    const err = commit.stderr || commit.stdout;
    if (err.includes("nothing to commit")) {
      console.log(`  ${YELLOW}Nothing to commit.${RESET}`);
    } else if (err.includes("Author identity unknown")) {
      console.log(`  ${YELLOW}Git author not configured. Set your name and email:${RESET}`);
      console.log(`    ${CYAN}git config --global user.name "Your Name"${RESET}`);
      console.log(`    ${CYAN}git config --global user.email "you@example.com"${RESET}`);
    } else {
      console.log(`  ${RED}✗${RESET} Commit failed: ${err.slice(0, 300)}`);
    }
  }
}

async function runPush() {
  if (!checkGit()) return;
  const { runShell } = await import("../util/shell.js");

  // Check remote exists
  const remote = await runShell({ command: "git remote -v", cwd: process.cwd(), timeoutMs: 5000 });
  if (!remote.ok || !remote.stdout.trim()) {
    console.log(`  ${YELLOW}No remote configured.${RESET} Run ${CYAN}git remote add origin <url>${RESET} first.`);
    return;
  }

  // Get current branch
  const branch = await runShell({ command: "git rev-parse --abbrev-ref HEAD", cwd: process.cwd(), timeoutMs: 5000 });
  if (!branch.ok) {
    console.log(`  ${RED}✗${RESET} Could not determine current branch.`);
    return;
  }
  const branchName = branch.stdout.trim();

  // Check if there are unpushed commits
  const ahead = await runShell({ command: `git log --oneline @{u}..HEAD 2>/dev/null || echo "no-upstream"`, cwd: process.cwd(), timeoutMs: 5000 });
  const hasUpstream = !ahead.stdout.trim().includes("no-upstream");
  if (hasUpstream && !ahead.stdout.trim()) {
    console.log(`  ${YELLOW}Nothing to push — branch is up to date.${RESET}`);
    return;
  }

  console.log(`  Pushing ${CYAN}${branchName}${RESET} to remote...`);
  const push = await runShell({ command: `git push origin ${branchName}`, cwd: process.cwd(), timeoutMs: 30000 });
  if (push.ok) {
    console.log(`  ${GREEN}✓${RESET} ${(push.stdout || push.stderr || "").trim().split("\n").pop()}`);
  } else {
    const err = push.stderr || push.stdout;
    if (err.includes("no upstream")) {
      const set = await runShell({ command: `git push --set-upstream origin ${branchName}`, cwd: process.cwd(), timeoutMs: 30000 });
      if (set.ok) {
        console.log(`  ${GREEN}✓${RESET} Pushed ${CYAN}${branchName}${RESET} with upstream set.`);
      } else {
        console.log(`  ${RED}✗${RESET} Push failed: ${(set.stderr || set.stdout || "").slice(0, 300)}`);
      }
    } else if (err.includes("Authentication failed") || err.includes(": 403") || err.includes(": 401")) {
      console.log(`  ${RED}✗${RESET} Authentication failed. Make sure your git credentials are configured:`);
      console.log(`    ${CYAN}gh auth login${RESET}  (GitHub CLI)`);
      console.log(`    ${GRAY}Or use a Personal Access Token via Credential Manager.${RESET}`);
    } else {
      console.log(`  ${RED}✗${RESET} Push failed: ${err.slice(0, 300)}`);
    }
  }
}
