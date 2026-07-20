#!/usr/bin/env node
// WRIVON cross-version benchmark — compares Node.js vs Python on identical tasks.
// Usage: node benchmark.js
// Results written to BENCHMARK.md

import { spawn, execSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = __dirname;
const NODE_DIR = path.join(REPO_ROOT, "node");
const PYTHON_DIR = path.join(REPO_ROOT, "python");
const RUNS = 5;

// Find node and python executables
const NODE_BIN = process.execPath;
let PYTHON_BIN = "python";
try {
  const out = execSync("where python", { encoding: "utf8", timeout: 5000 }).toString().trim();
  PYTHON_BIN = out.split("\n")[0].trim();
} catch {}

const VERSIONS = [
  { id: "node", label: "Node.js", cmd: NODE_BIN, args: ["bin/wrivon.js"] },
  { id: "python", label: "Python", cmd: PYTHON_BIN, args: ["-m", "wrivon", "start"] },
];

const hasApiKeys = !!(process.env.NVIDIA_API_KEY || process.env.CLOUDFLARE_API_KEY || process.env.GROQ_API_KEY);
const hasGit = (() => { try { execSync("git --version", { stdio: "ignore" }); return true; } catch { return false; }})();

function average(arr) {
  const v = arr.filter(x => x != null && x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

function stddev(arr) {
  const v = arr.filter(x => x != null && x > 0);
  if (v.length < 2) return 0;
  const avg = average(v);
  return Math.sqrt(v.map(x => (x - avg) ** 2).reduce((a, b) => a + b, 0) / (v.length - 1));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getPidMemory(pid) {
  try {
    if (os.platform() === "win32") {
      const raw = execSync(
        `powershell -NoProfile -Command "(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).WorkingSet64 / 1MB"`,
        { timeout: 5000, encoding: "utf8" }
      ).toString().trim();
      return parseFloat(raw) || 0;
    } else {
      const raw = execSync(`ps -o rss= -p ${pid}`, { timeout: 5000, encoding: "utf8" }).toString().trim();
      return (parseFloat(raw) || 0) / 1024;
    }
  } catch { return 0; }
}

function execAndTime(cmd, args, opts = {}) {
  const fullCmd = `"${cmd}" ${args.join(" ")}`;
  const start = performance.now();
  try {
    execSync(fullCmd, { ...opts, timeout: opts.timeout || 30000, stdio: "pipe", encoding: "utf8", shell: true });
    return { elapsed: performance.now() - start, error: false };
  } catch (e) {
    return { elapsed: performance.now() - start, error: true, stderr: e.stderr?.toString().slice(0, 200) };
  }
}

// ── Test 1: CLI Startup Time (--help exits after loading modules) ──
async function measureStartup() {
  const results = {};
  for (const v of VERSIONS) {
    const times = [];
    for (let i = 0; i < RUNS; i++) {
      const r = execAndTime(v.cmd, [...v.args, "--help"], { cwd: path.dirname(v.args[0]) === "bin" ? NODE_DIR : PYTHON_DIR, timeout: 15000 });
      if (r.elapsed) times.push(r.elapsed);
      await sleep(300);
    }
    results[v.id] = { values: times, avg: average(times), stddev: stddev(times), unit: "ms" };
  }
  return results;
}

// ── Test 2: Time to First Token (--print mode) ──
async function measureTTFT() {
  if (!hasApiKeys) {
    const r = {};
    for (const v of VERSIONS) r[v.id] = { values: [], avg: 0, stddev: 0, unit: "ms", skipped: true };
    return r;
  }
  const results = {};
  for (const v of VERSIONS) {
    const times = [];
    for (let i = 0; i < RUNS; i++) {
      const cwd = v.cmd === NODE_BIN ? NODE_DIR : PYTHON_DIR;
      const start = performance.now();
      let firstByte = null;
      const child = spawn(v.cmd, [...v.args, "-p", "say hello in one word"], { cwd, stdio: ["pipe", "pipe", "pipe"], env: process.env });
      child.stdout.on("data", d => { if (firstByte === null && d.toString().trim()) firstByte = performance.now() - start; });
      await new Promise(r => { child.on("exit", () => { if (firstByte) times.push(firstByte); r(); }); setTimeout(() => { child.kill(); r(); }, 30000); });
      await sleep(500);
    }
    results[v.id] = { values: times, avg: average(times), stddev: stddev(times), unit: "ms", skipped: false };
  }
  return results;
}

// ── Test 3: Memory Usage ──
async function measureMemory() {
  const results = {};
  for (const v of VERSIONS) {
    const values = [];
    for (let i = 0; i < RUNS; i++) {
      let cmd, args, cwd;
      if (v.id === "python") {
        // Python REPL needs a TTY; import modules and sleep instead
        cmd = v.cmd;
        args = ["-c", "import wrivon.cli, wrivon.ui.repl, wrivon.ui.render, wrivon.provider, wrivon.tools.editor, wrivon.tools.search, wrivon.tools.shell, wrivon.tools.web, wrivon.shared; import time; time.sleep(5)"];
        cwd = PYTHON_DIR;
      } else {
        cmd = v.cmd;
        args = v.args;
        cwd = NODE_DIR;
      }
      const child = spawn(cmd, args, { cwd, stdio: ["pipe", "pipe", "pipe"], env: process.env });
      await sleep(4000); // let modules load
      let mem = 0;
      for (let retry = 0; retry < 5 && mem === 0; retry++) { mem = getPidMemory(child.pid); if (mem === 0) await sleep(500); }
      if (mem > 0) values.push(mem);
      try { child.kill(); } catch {}
      await sleep(500);
    }
    results[v.id] = { values, avg: average(values), stddev: stddev(values), unit: "MB" };
  }
  return results;
}

// ── Test 4: Git operations (measure underlying git directly) ──
async function measureGitOps() {
  if (!hasGit) {
    return {
      node: { diff: { values: [], avg: 0, skipped: true }, commit: { values: [], avg: 0, skipped: true } },
      python: { diff: { values: [], avg: 0, skipped: true }, commit: { values: [], avg: 0, skipped: true } },
    };
  }

  const diffTimes = [], commitTimes = [];
  for (let i = 0; i < RUNS; i++) {
    // Create a temp file for git to track
    const stamp = Date.now() + i;
    const tmpFile = path.join(REPO_ROOT, `.benchmark_tmp_${stamp}.txt`);
    fs.writeFileSync(tmpFile, `benchmark content ${stamp}\n`, "utf8");

    await sleep(200);
    let start = performance.now();
    try { execSync("git diff --stat", { cwd: REPO_ROOT, stdio: "pipe" }); } catch {}
    diffTimes.push(performance.now() - start);

    // Clean up the temp file without making any commits
    try { fs.unlinkSync(tmpFile); } catch {}
    await sleep(200);
  }

  const addTimes = [];
  for (let i = 0; i < RUNS; i++) {
    const stamp = Date.now() + i + 100;
    const tmpFile = path.join(REPO_ROOT, `.benchmark_tmp_${stamp}.txt`);
    fs.writeFileSync(tmpFile, `content ${stamp}\n`, "utf8");

    await sleep(200);
    let start = performance.now();
    try { execSync(`git add .benchmark_tmp_${stamp}.txt`, { cwd: REPO_ROOT, stdio: "ignore" }); } catch {}
    addTimes.push(performance.now() - start);

    // Restore: unstage and delete
    try { execSync(`git rm --cached .benchmark_tmp_${stamp}.txt`, { cwd: REPO_ROOT, stdio: "ignore" }); } catch {}
    try { fs.unlinkSync(tmpFile); } catch {}
    await sleep(200);
  }

  return {
    node: { diff: { values: diffTimes, avg: average(diffTimes), stddev: stddev(diffTimes), unit: "ms" }, commit: { values: addTimes, avg: average(addTimes), stddev: stddev(addTimes), unit: "ms" } },
    python: { diff: { values: diffTimes, avg: average(diffTimes), stddev: stddev(diffTimes), unit: "ms" }, commit: { values: addTimes, avg: average(addTimes), stddev: stddev(addTimes), unit: "ms" } },
  };
}

function renderValue(val, std, unit, skipped) {
  if (skipped) return "—";
  if (val === 0) return "N/A";
  if (unit === "ms") return `${val.toFixed(1)} ±${std.toFixed(1)} ms`;
  if (unit === "MB") return `${val.toFixed(1)} ±${std.toFixed(1)} MB`;
  return `${val.toFixed(1)} ${unit}`;
}

function renderRow(label, nodeV, nodeS, pyV, pyS, unit, skipped) {
  const n = renderValue(nodeV, nodeS, unit, skipped);
  const p = renderValue(pyV, pyS, unit, skipped);
  return `| ${label.padEnd(9)} | ${n.padEnd(18)} | ${p.padEnd(18)} |`;
}

function renderMinMax(label, nodeVals, pyVals, unit) {
  const nMin = nodeVals.length ? Math.min(...nodeVals.filter(x => x > 0)) : 0;
  const nMax = nodeVals.length ? Math.max(...nodeVals) : 0;
  const pMin = pyVals.length ? Math.min(...pyVals.filter(x => x > 0)) : 0;
  const pMax = pyVals.length ? Math.max(...pyVals) : 0;
  const u = unit === "MB" ? " MB" : " ms";
  return `| ${label.padEnd(9)} | ${nMin.toFixed(1)} / ${nMax.toFixed(1)}${u}${" ".repeat(5)} | ${pMin.toFixed(1)} / ${pMax.toFixed(1)}${u}${" ".repeat(5)} |`;
}

async function main() {
  console.log("WRIVON Cross-Version Benchmark");
  console.log(`Platform: ${os.platform()} ${os.release()} | Node ${process.version}`);
  console.log(`Runs per test: ${RUNS} | API keys: ${hasApiKeys ? "yes" : "no"} | Git: ${hasGit ? "yes" : "no"}\n`);

  console.log("  [1/4] Startup time...");
  const startup = await measureStartup();
  for (const v of VERSIONS) console.log(`    ${v.label}: ${startup[v.id].avg.toFixed(1)}ms ±${startup[v.id].stddev.toFixed(1)}`);

  console.log("  [2/4] Time to first token...");
  const ttft = await measureTTFT();
  for (const v of VERSIONS) console.log(`    ${v.label}: ${ttft[v.id].skipped ? "SKIPPED (no API keys)" : `${ttft[v.id].avg.toFixed(1)}ms`}`);

  console.log("  [3/4] Memory usage...");
  const mem = await measureMemory();
  for (const v of VERSIONS) console.log(`    ${v.label}: ${mem[v.id].avg.toFixed(1)}MB ±${mem[v.id].stddev.toFixed(1)}`);

  console.log("  [4/4] Git operations...");
  const git = await measureGitOps();
  for (const v of VERSIONS) console.log(`    ${v.label}: diff=${git[v.id].diff.avg.toFixed(1)}ms | add=${git[v.id].commit.avg.toFixed(1)}ms`);

  // ── Build markdown ──
  const stamp = new Date().toISOString().split("T")[0];
  const skip = !hasApiKeys;
  const separator = `|${"-".repeat(9)}|${"-".repeat(20)}|${"-".repeat(20)}|`;

  let md = "";
  md += `# WRIVON Benchmark\n\n`;
  md += `> Generated ${stamp} | ${os.platform()} ${os.release()} | Node ${process.version}\n`;
  md += `> ${RUNS} runs per metric | ${hasApiKeys ? "API keys set" : "TTFT skipped (no API keys)"} | ${hasGit ? "Git available" : "Git ops skipped"}\n\n`;

  md += `## Startup (\`--help\` exit time)\n\n`;
  md += `| Metric    | Node.js             | Python              |\n`;
  md += `${separator}\n`;
  md += renderRow("Average", startup.node.avg, startup.node.stddev, startup.python.avg, startup.python.stddev, "ms") + "\n";
  md += renderMinMax("Min / Max", startup.node.values, startup.python.values, "ms") + "\n";

  md += `\n## Time to First Token\n\n`;
  md += `| Metric    | Node.js             | Python              |\n`;
  md += `${separator}\n`;
  md += renderRow("Average", ttft.node.avg, ttft.node.stddev, ttft.python.avg, ttft.python.stddev, "ms", skip) + "\n";

  md += `\n## Memory (RSS after startup)\n\n`;
  md += `| Metric    | Node.js             | Python              |\n`;
  md += `${separator}\n`;
  md += renderRow("Average", mem.node.avg, mem.node.stddev, mem.python.avg, mem.python.stddev, "MB") + "\n";
  md += renderMinMax("Min / Max", mem.node.values, mem.python.values, "MB") + "\n";

  md += `\n## Git Operations\n\n`;
  md += `| Operation | Node.js             | Python              |\n`;
  md += `${separator}\n`;
  const gSkip = !hasGit;
  md += renderRow("diff --stat", git.node.diff.avg, git.node.diff.stddev, git.python.diff.avg, git.python.diff.stddev, "ms", gSkip) + "\n";
  md += renderRow("add", git.node.commit.avg, git.node.commit.stddev, git.python.commit.avg, git.python.commit.stddev, "ms", gSkip) + "\n";

  md += `\n## Summary\n\n`;
  const nMem = mem.node.avg || 0;
  const pMem = mem.python.avg || 0;
  md += `| | Node.js | Python | Winner |\n|${"-".repeat(2)}|${"-".repeat(10)}|${"-".repeat(10)}|${"-".repeat(8)}|\n`;
  md += `| Startup | ${startup.node.avg.toFixed(0)} ms | ${startup.python.avg.toFixed(0)} ms | ${startup.node.avg < startup.python.avg ? "Node.js" : "Python"} |\n`;
  md += `| Memory  | ${nMem.toFixed(0)} MB | ${pMem.toFixed(0)} MB | ${nMem && pMem ? (nMem < pMem ? "Node.js" : "Python") : "N/A"} |\n`;
  if (!skip) md += `| TTFT    | ${ttft.node.avg.toFixed(0)} ms | ${ttft.python.avg.toFixed(0)} ms | ${ttft.node.avg < ttft.python.avg ? "Node.js" : "Python"} |\n`;

  md += `\n---\n*Runner: \`node benchmark.js\`*\n`;

  fs.writeFileSync(path.join(REPO_ROOT, "BENCHMARK.md"), md, "utf8");
  console.log("\n\nResults written to BENCHMARK.md");
  console.log(md);
}

main().catch(e => { console.error("Benchmark failed:", e); process.exit(1); });
