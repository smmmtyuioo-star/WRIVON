// Cross-platform shell exec. Default shell:
//   - Windows: cmd.exe /c
//   - Others:  sh -c
// User can force with WRIVON_SHELL=cmd|bash|sh|pwsh.

import { spawn } from "node:child_process";
import process from "node:process";

function pickShell() {
  const forced = (process.env.WRIVON_SHELL || "").toLowerCase();
  if (forced) return forced;
  return process.platform === "win32" ? "cmd" : "sh";
}

function shellArgs(shell, cmd) {
  switch (shell) {
    case "cmd":   return ["cmd.exe", "/d", "/s", "/c", cmd];
    case "bash":  return ["bash", "-c", cmd];
    case "sh":    return ["sh", "-c", cmd];
    case "pwsh":  return ["pwsh", "-NoProfile", "-Command", cmd];
    default:      return ["sh", "-c", cmd];
  }
}

export function runShell({ command, cwd, timeoutMs = 120000 }) {
  return new Promise((resolve) => {
    const shell = pickShell();
    const args = shellArgs(shell, command);
    const child = spawn(args[0], args.slice(1), { cwd, env: process.env, windowsHide: true });

    let stdout = "";
    let stderr = "";
    let killed = false;
    const t = setTimeout(() => { killed = true; child.kill("SIGTERM"); }, timeoutMs);

    child.stdout.on("data", (b) => { stdout += b.toString("utf8"); });
    child.stderr.on("data", (b) => { stderr += b.toString("utf8"); });
    child.on("error", (e) => {
      clearTimeout(t);
      resolve({ ok: false, code: -1, stdout, stderr: stderr + e.message, killed });
    });
    child.on("close", (code) => {
      clearTimeout(t);
      const ok = code === 0 && !killed;
      resolve({ ok, code, stdout, stderr, killed });
    });
  });
}
