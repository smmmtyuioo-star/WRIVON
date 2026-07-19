// WRIVON main entry. Parses CLI flags and runs in one of two modes:
//   --print  "message"   — one-shot: send message, print reply, exit.
//   (no args)            — interactive REPL.

import process from "node:process";
import { loadConfig, ensureUserDir, validateAndWarn } from "./config/load.js";
import { createProviderWithFallback, listProviders } from "./llm/index.js";
import { loadSystemPrompt, runTurn } from "./agent/loop.js";
import { openSession, listSessions } from "./session/store.js";
import { repl } from "./tui/repl.js";
import { log } from "./util/log.js";

async function main() {
  const cfg = loadConfig();
  const argv = process.argv.slice(2);
  const printFlag = ["--print", "-p", "--one-shot"].find(f => argv.includes(f));
  const printIdx = printFlag ? argv.indexOf(printFlag) + 1 : -1;
  const msg = printFlag && printIdx > 0 && printIdx < argv.length ? argv[printIdx] : null;
  const agentFlag = ["--agent", "-a"].some(f => argv.includes(f));
  const agentIdx = agentFlag ? argv.indexOf(argv.find(f => ["--agent", "-a"].includes(f))) : -1;
  const agentPrompt = agentFlag && agentIdx >= 0 && agentIdx + 1 < argv.length ? argv[agentIdx + 1] : null;
  const sandboxFlag = ["--sandbox"].find(f => argv.includes(f));
  const sandboxIdx = sandboxFlag ? argv.indexOf(sandboxFlag) + 1 : -1;
  const sandboxVal = sandboxFlag && sandboxIdx > 0 && sandboxIdx < argv.length ? argv[sandboxIdx] : null;
  const showProviders = argv.includes("--list-providers");
  const showKnownProviders = argv.includes("--list-known-providers");
  const connectMode = argv.includes("--connect");
  const modeFlag = ["--mode", "-m"].find(f => argv.includes(f));
  const modeIdx = modeFlag ? argv.indexOf(modeFlag) + 1 : -1;
  const modeVal = modeFlag && modeIdx > 0 && modeIdx < argv.length ? argv[modeIdx] : null;
  const showHelp = argv.includes("--help") || argv.includes("-h");
  const showVersion = argv.includes("--version") || argv.includes("-v");

  if (showVersion) {
    console.log("WRIVON v0.2");
    return;
  }

  if (showHelp) {
    console.log(`
WRIVON v0.2 — a cross-shell CLI AI coding agent.

Usage:
  wrivon [options]              Interactive REPL
  wrivon -p "message"           One-shot mode, print reply and exit
  wrivon -a "prompt"            Agent mode (full tools, one-shot)
  wrivon --connect              Interactive provider setup wizard

Options:
  --provider <name>     Provider to use (ollama | openai | nvidia | cloudflare | groq)
  --model <name>        Override model name
  --base-url <url>      Override provider base URL
  --api-key <key>       Override provider API key
  --sandbox <level>     Filesystem sandbox: read-only | workspace-write | danger-full-access
  -m, --mode <mode>     Chat mode: code | ask | plan (default: code)
  --no-stream           Disable streaming output
  --list-providers      List configured providers and exit
  --list-known-providers List well-known providers available for /connect
  -p, --print "msg"     One-shot: send message, print reply, exit
  -a, --agent "prompt"  Agent mode: full tools in one-shot
  --connect             Interactive CLI wizard to add a new provider
  -h, --help            Show this help
  -v, --version         Show version

Config: ~/.wrivon/config.json and ./.wrivon/config.json (project-specific)
Modes:  /code (edit), /ask (read-only Q&A), /plan (explore + plan)
Serve:  /serve 8080 to preview websites locally
`.trim());
    return;
  }

  // Apply CLI overrides
  if (sandboxVal) {
    if (!["read-only", "workspace-write", "danger-full-access"].includes(sandboxVal)) {
      log.error(`Invalid sandbox level: "${sandboxVal}". Use: read-only, workspace-write, or danger-full-access`);
      process.exit(1);
    }
    cfg.sandbox = cfg.sandbox || {};
    cfg.sandbox.filesystem = sandboxVal;
  }

  if (showProviders) {
    console.table(listProviders(cfg));
    return;
  }

  if (showKnownProviders) {
    const { WELL_KNOWN_PROVIDERS } = await import("./config/providers.js");
    console.log(`\n${"Provider".padEnd(22)} Endpoint`);
    for (const p of WELL_KNOWN_PROVIDERS) {
      console.log(`  ${p.name.padEnd(20)} ${p.baseUrl}`);
    }
    console.log("");
    return;
  }

  if (connectMode) {
    const { default: readline } = await import("node:readline");
    const { saveProviderToConfig } = await import("./config/providers.js");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      const providerId = await new Promise((r) => {
        rl.question("Provider ID (e.g. my-provider): ", (ans) => r(ans.trim() || "custom"));
      });
      const baseUrl = await new Promise((r) => {
        rl.question("Base URL (e.g. https://api.openai.com/v1): ", (ans) => r(ans.trim().replace(/\/+$/, "")));
      });
      const apiKey = await new Promise((r) => {
        rl.question("API key (leave blank if not needed): ", (ans) => r(ans.trim()));
      });
      const model = await new Promise((r) => {
        rl.question("Model name (e.g. gpt-4o-mini): ", (ans) => r(ans.trim() || "gpt-4o-mini"));
      });
      saveProviderToConfig(providerId, { baseUrl, apiKey, model, kind: "openai" });
      console.log(`\n✓ Provider "${providerId}" saved to config. Start REPL with: wrivon --provider ${providerId}`);
    } finally { rl.close(); }
    return;
  }

  // Validate config before starting
  validateAndWarn(cfg);

  // Create the LLM provider client with automatic fallback.
  let provider;
  try {
    provider = createProviderWithFallback(cfg);
  } catch (e) {
    log.error(e.message);
    process.exit(1);
  }

  if (printFlag && msg) {
    await oneShot(provider, cfg, msg, false);
    return;
  }

  // Subagent mode: one-shot with full system prompt and tools.
  if (agentFlag && agentPrompt) {
    await oneShot(provider, cfg, agentPrompt, true);
    return;
  }

  // Set initial mode from CLI flag
  if (modeVal && ["code", "ask", "plan"].includes(modeVal)) {
    globalThis.__WRIVON_INITIAL_MODE = modeVal;
  }

  // Interactive REPL.
  await repl(provider, cfg);
}

async function oneShot(provider, cfg, msg, fullAgent) {
  const systemPrompt = fullAgent
    ? await loadSystemPrompt()
    : "You are WRIVON, a helpful AI assistant. Answer the user's question concisely and accurately.";
  const messages = [{ role: "system", content: systemPrompt }];
  const session = await openSession(null, { provider: cfg.provider, model: cfg.model || cfg.providers?.[cfg.provider]?.model, cwd: process.cwd() });

  const result = await runTurn({
    userText: msg,
    messages,
    provider,
    cfg,
    session,
    signal: null,
    noTools: !fullAgent,
    onEvent: (evt) => {
      if (evt.kind === "token") process.stdout.write(String(evt.content));
      if (evt.kind === "error") process.stdout.write(String(evt.content) + "\n");
    },
  });

  if (result.finishReason === "error") {
    process.exitCode = 1;
    return;
  }

  process.stdout.write("\n");
}

main().catch((e) => {
  log.error(e.message || String(e));
  process.exitCode = 1;
});
