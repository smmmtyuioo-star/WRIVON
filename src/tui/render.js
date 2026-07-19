import process from "node:process";

const TTY = process.stdout.isTTY;

const TEAL = "\x1b[38;5;80m";
const VIOLET = "\x1b[38;5;141m";
const GRAY = "\x1b[90m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const LOGO = [
  "██╗    ██╗██████╗ ██╗██╗   ██╗ ██████╗ ███╗   ██╗",
  "██║    ██║██╔══██╗██║██║   ██║██╔═══██╗████╗  ██║",
  "██║ █╗ ██║██████╔╝██║╚██╗ ██╔╝██║   ██║██╔██╗ ██║",
  "██║███╗██║██╔══██╗██║ ╚████╔╝ ██║   ██║██║╚██╗██║",
  "╚███╔███╔╝██║  ██║██║  ╚██╔╝  ╚██████╔╝██║ ╚████║",
  " ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝",
];

const DIVIDER = `${GRAY}┄${RESET}`.repeat(process.stdout.columns || 60);

let toolTimings = {};
let toolIdx = 0;
let spinnerInterval = null;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function cols() { return Math.min(process.stdout.columns || 80, 120); }
function rows() { return process.stdout.rows || 24; }

export function startSpinner(text) {
  if (!TTY) return;
  let i = 0;
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${TEAL}${SPINNER_FRAMES[i]}${RESET} ${text}`);
    i = (i + 1) % SPINNER_FRAMES.length;
  }, 80);
}

export function stopSpinner() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
    if (TTY) process.stdout.write("\r\x1b[K");
  }
}

export function highlightSyntax(code) {
  const keywords = /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|switch|case|break|default|true|false|null|undefined|require|module|def|print|in|not|and|or)\b/g;
  const strings = /("[^"]*"|'[^']*'|`[^`]*`)/g;
  const comments = /(\/\/.*)/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  let result = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  result = result
    .replace(comments, `${GRAY}$1${RESET}`)
    .replace(strings, `${GREEN}$1${RESET}`)
    .replace(keywords, `${YELLOW}$1${RESET}`)
    .replace(numbers, `${CYAN}$1${RESET}`);
  return result;
}

export function colorizeDiff(text) {
  return text.split("\n").map(line => {
    if (line.startsWith("+") && !line.startsWith("+++")) return `${GREEN}${line}${RESET}`;
    if (line.startsWith("-") && !line.startsWith("---")) return `${RED}${line}${RESET}`;
    if (line.startsWith("@@")) return `${CYAN}${line}${RESET}`;
    return line;
  }).join("\n");
}

function visLen(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// ── Splash screen: top border + logo + minimal commands ──────────────
export function printSplash(cfg, tierName) {
  const p = cfg.provider;
  const m = cfg.providers?.[p]?.model || cfg.model;
  const ver = "v0.2";
  const c = cols();
  const inner = c - 4;
  const top = `┌${"─".repeat(c - 2)}┐`;
  const sep = `│${" ".repeat(c - 2)}│`;
  const bot = `└${"─".repeat(c - 2)}┘`;

  process.stdout.write(`\n${TEAL}${top}${RESET}\n`);
  for (const row of LOGO) {
    const pad = inner - visLen(row);
    process.stdout.write(`│ ${TEAL}${row}${RESET}${" ".repeat(Math.max(0, pad))} │\n`);
  }
  process.stdout.write(`${sep}\n`);
  const tierTag = tierName ? ` (${tierName})` : "";
  const modelLine = `${GRAY}${ver}${RESET} ${GRAY}—${RESET} ${TEAL}${p}/${m}${tierTag}${RESET}`;
  const modelPad = inner - visLen(modelLine);
  process.stdout.write(`│  ${modelLine}${" ".repeat(Math.max(0, modelPad))} │\n`);
  process.stdout.write(`${sep}\n`);
  const msg = "Type a message and press Enter to start.";
  const msgPad = inner - msg.length;
  process.stdout.write(`│  ${msg}${" ".repeat(Math.max(0, msgPad))} │\n`);
  process.stdout.write(`${sep}\n`);
  const cmds = [
    `${VIOLET}/help${RESET}   Show all commands`,
    `${VIOLET}/model${RESET}  Switch model (1=Fast 2=Coder 3=Power)`,
    `${VIOLET}/exit${RESET}   Quit`,
  ];
  for (const cmd of cmds) {
    const pad = inner - visLen(cmd);
    process.stdout.write(`│  ${cmd}${" ".repeat(Math.max(0, pad))} │\n`);
  }
  process.stdout.write(`${sep}\n`);
  process.stdout.write(`${TEAL}${bot}${RESET}\n`);
}

// ── Bottom input bar: boxed row with hint + model ────────────────────
export function drawInputBar(provider, model) {
  if (!TTY) return;
  const c = cols();
  const r = rows();
  const hint = `${GRAY}enter to send${RESET}`;
  const right = `${CYAN}${provider}/${model}${RESET}`;
  const inner = c - 4;
  const gap = inner - visLen(hint) - visLen(right) - 2;
  const gapStr = gap > 0 ? " ".repeat(gap) : " ";

  process.stdout.write(`\x1b7`); // save cursor
  if (r >= 2) {
    process.stdout.write(`\x1b[${r - 1};1f${TEAL}┌${"─".repeat(c - 2)}┐${RESET}`);
  }
  process.stdout.write(`\x1b[${r};1f${TEAL}│${RESET} ${hint}${gapStr}${right} ${TEAL}│${RESET}`);
  process.stdout.write(`\x1b8`); // restore cursor
}

// ── Redraw bottom bar (call after output) ────────────────────────────
export function refreshInputBar(provider, model) {
  drawInputBar(provider, model);
}

// ── Streaming event renderer ─────────────────────────────────────────
export function renderStream(evt, cfg) {
  switch (evt.kind) {
    case "user":
      break;

    case "stream_start":
      toolTimings = {};
      toolIdx = 0;
      stopSpinner();
      if (TTY) {
        process.stdout.write(`\n${GRAY}${DIVIDER}${RESET}\n`);
      }
      break;

    case "token":
      process.stdout.write(evt.content);
      break;

    case "stream_end":
      if (TTY) {
        process.stdout.write(`\n${GRAY}${DIVIDER}${RESET}\n`);
      }
      break;

    case "inline_tools_detected":
      if (TTY) {
        for (let i = 0; i < evt.count; i++) {
          process.stdout.write("\x1b[1A\x1b[2K");
        }
      }
      break;

    case "assistant_done": {
      const fr = evt.finishReason || "stop";
      const tc = evt.toolCalls?.length || 0;
      if (cfg.ui.showTools && (tc > 0 || fr !== "stop")) {
        const frTag = fr === "tool_calls" ? `${CYAN}⚡${RESET}` : `${GRAY}${fr}${RESET}`;
        process.stdout.write(`  ${frTag} ${tc} tool call${tc !== 1 ? "s" : ""}\n`);
      }
      break;
    }

    case "tool_start": {
      toolIdx++;
      const idx = toolIdx;
      toolTimings[idx] = Date.now();
      if (cfg.ui.showTools) {
        const fn = evt.name || "?";
        const a = JSON.stringify(evt.args || {}).slice(0, 120);
        process.stdout.write(`  ${BOLD}${CYAN}→${RESET} ${fn}(${GRAY}${a}${a.length >= 120 ? "..." : ""}${RESET}) `);
      }
      break;
    }

    case "tool_end": {
      if (cfg.ui.showTools) {
        const idx = toolIdx;
        const ms = toolTimings[idx] ? Date.now() - toolTimings[idx] : 0;
        const fn = evt.name || "?";
        const status = evt.ok ? `${GREEN}ok${RESET}` : `${RED}err${RESET}`;
        const preview = (evt.output || evt.error || "").replace(/\n/g, " ").slice(0, 80);
        process.stdout.write(`${status} ${GRAY}${ms}ms${RESET}`);
        if (preview) process.stdout.write(` ${GRAY}— ${preview}${RESET}`);
        process.stdout.write("\n");
      }
      break;
    }

    case "turn_end":
      break;

    case "error":
      process.stdout.write(`\n${RED}${BOLD}Error:${RESET} ${evt.content}\n`);
      break;

    case "final":
      if (evt.note) process.stdout.write(`  ${YELLOW}⚠${RESET} ${evt.note}\n`);
      break;
  }
}
