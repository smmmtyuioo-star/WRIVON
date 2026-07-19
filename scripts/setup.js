#!/usr/bin/env node
// WRIVON setup wizard — interactive first-run provider configuration.
// Run with: node scripts/setup.js
// Writes API keys to .env.local (gitignored, never committed).

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import process from "node:process";

const PROJECT = path.resolve(import.meta.dirname, "..");
const ENV_FILE = path.join(PROJECT, ".env.local");

const TEAL = "\x1b[38;5;80m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const GRAY = "\x1b[90m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const PROVIDERS = [
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    free: true,
    envKeys: ["NVIDIA_API_KEY"],
    docUrl: "https://build.nvidia.com",
    description: "~90 free models (Llama, Nemotron, Qwen, Mistral, DeepSeek, etc.)",
    prompts: [
      { key: "NVIDIA_API_KEY", label: "NVIDIA API key", hint: "Paste your NVIDIA API key (starts with nvapi-)", url: "https://build.nvidia.com" },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    free: true,
    envKeys: ["CLOUDFLARE_API_KEY", "CLOUDFLARE_ACCOUNT_ID"],
    docUrl: "https://developers.cloudflare.com/workers-ai/",
    description: "Llama, Mistral, DeepSeek models via Cloudflare's global network",
    prompts: [
      { key: "CLOUDFLARE_API_KEY", label: "Cloudflare API token", hint: "Paste your Cloudflare API token", url: "https://dash.cloudflare.com/profile/api-tokens" },
      { key: "CLOUDFLARE_ACCOUNT_ID", label: "Cloudflare Account ID", hint: "Paste your Account ID (hex string, from dashboard)", url: "https://dash.cloudflare.com" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    free: true,
    envKeys: ["GROQ_API_KEY"],
    docUrl: "https://console.groq.com/keys",
    description: "Fast LPU inference — Llama, Mixtral, Gemma models",
    prompts: [
      { key: "GROQ_API_KEY", label: "Groq API key", hint: "Paste your Groq API key (starts with gsk_)", url: "https://console.groq.com/keys" },
    ],
  },
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function header() {
  console.clear();
  console.log(`\n  ${TEAL}${BOLD}WRIVON Setup${RESET}`);
  console.log(`  ${GRAY}${"─".repeat(50)}${RESET}\n`);
}

async function main() {
  header();
  console.log(`  This wizard will set up your AI providers.\n`);
  console.log(`  ${GRAY}You can re-run this anytime to add more providers.${RESET}\n`);

  // Load existing env
  let env = {};
  if (fs.existsSync(ENV_FILE)) {
    const raw = fs.readFileSync(ENV_FILE, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.+)$/);
      if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
  }

  const available = PROVIDERS.filter((p) => p.prompts.some((pp) => !env[pp.key]));
  const configured = PROVIDERS.filter((p) => p.prompts.every((pp) => env[pp.key]));

  if (configured.length) {
    console.log(`  ${GREEN}Already configured:${RESET}`);
    for (const p of configured) {
      const status = p.prompts.every((pp) => env[pp.key]?.length > 10) ? `${GREEN}✓${RESET}` : `${YELLOW}⚠ partial${RESET}`;
      console.log(`    ${status} ${p.name}${RESET}`);
    }
    console.log("");
  }

  if (!available.length) {
    console.log(`  ${GREEN}All providers are already configured!${RESET}\n`);
    console.log(`  ${GRAY}Re-run setup to update keys.${RESET}\n`);
    await finish(env);
    return;
  }

  console.log(`  ${BOLD}Which provider would you like to set up?${RESET}\n`);
  for (let i = 0; i < available.length; i++) {
    console.log(`  ${i + 1}) ${CYAN}${available[i].name}${RESET} — ${GRAY}${available[i].description}${RESET}`);
    console.log(`     ${GRAY}Get a free key: ${available[i].docUrl}${RESET}\n`);
  }
  console.log(`  ${available.length + 1}) ${GRAY}Skip — I'll do this later${RESET}\n`);

  let choice;
  while (true) {
    const ans = await ask(`  ${BOLD}Enter number (1-${available.length + 1}): ${RESET}`);
    const n = parseInt(ans, 10);
    if (n >= 1 && n <= available.length) { choice = available[n - 1]; break; }
    if (n === available.length + 1) { console.log(`\n  ${YELLOW}No problem! Run ${CYAN}npm run setup${YELLOW} anytime to configure providers.${RESET}\n`); await finish(env); return; }
    console.log(`  ${YELLOW}Please enter a number between 1 and ${available.length + 1}.${RESET}`);
  }

  header();
  console.log(`  ${BOLD}Setting up: ${CYAN}${choice.name}${RESET}\n`);
  console.log(`  ${GRAY}${choice.description}${RESET}\n`);
  console.log(`  ${GRAY}Get your free API key at: ${choice.docUrl}${RESET}\n`);

  for (const pp of choice.prompts) {
    let val = "";
    while (!val) {
      val = (await ask(`  ${pp.label}: `)).trim();
      if (!val) console.log(`  ${YELLOW}This field is required.${RESET}`);
    }
    env[pp.key] = val;
  }

  // Write .env.local
  const lines = [];
  const allKeys = [...new Set([...Object.keys(env), ...PROVIDERS.flatMap((p) => p.envKeys)])];
  for (const key of allKeys) {
    if (env[key]) {
      lines.push(`${key}=${env[key]}`);
    }
  }
  fs.writeFileSync(ENV_FILE, lines.join("\n") + "\n", "utf8");

  console.log(`\n  ${GREEN}✓${RESET} ${choice.name} configured and saved to ${GRAY}.env.local${RESET}`);
  console.log(`  ${GRAY}  (This file is gitignored — your keys are safe.)${RESET}\n`);

  // Ask if they want to add another
  const another = (await ask(`  ${BOLD}Add another provider? (y/N): ${RESET}`)).trim().toLowerCase();
  if (another === "y" || another === "yes") {
    await main();
    return;
  }

  await finish(env);
}

async function finish(env) {
  const hasAny = Object.values(env).some((v) => v?.length > 5);
  console.log(`  ${GRAY}${"─".repeat(50)}${RESET}`);
  if (hasAny) {
    console.log(`\n  ${GREEN}${BOLD}Setup complete!${RESET}\n`);
    console.log(`  You can now start WRIVON:`);
    console.log(`\n    ${CYAN}npm start${RESET}\n`);
    console.log(`  ${GRAY}Or use the full path:${RESET}  ${CYAN}node bin/wrivon.js${RESET}\n`);
    console.log(`  ${GRAY}Need help? Type ${RESET}${CYAN}/help${RESET}${GRAY} once WRIVON is running.${RESET}\n`);
  } else {
    console.log(`\n  ${YELLOW}No providers configured yet.${RESET}\n`);
    console.log(`  Run this wizard anytime to add API keys:`);
    console.log(`\n    ${CYAN}npm run setup${RESET}\n`);
    console.log(`  ${GRAY}You can also manually edit ${RESET}${CYAN}.env.local${RESET}${GRAY} with your keys.${RESET}\n`);
  }
  rl.close();
}

main().catch((e) => {
  console.error(`\n  ${YELLOW}Setup failed:${RESET} ${e.message}`);
  rl.close();
  process.exit(1);
});
