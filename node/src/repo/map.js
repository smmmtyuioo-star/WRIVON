import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileExists } from "../util/fs.js";

let _repoMap = null;

export async function buildRepoMap(root) {
  const info = {
    root,
    language: detectLanguage(root),
    packageJson: null,
    testPattern: guessTestPattern(root),
    scripts: [],
    hasGit: await isGitRepo(root),
    structure: "",
  };

  // Read package.json
  const pkgPath = path.join(root, "package.json");
  if (await fileExists(pkgPath)) {
    try {
      const raw = await fs.readFile(pkgPath, "utf8");
      const pkg = JSON.parse(raw);
      info.packageJson = pkg.name || path.basename(root);
      const scripts = pkg.scripts || {};
      info.scripts = Object.entries(scripts).map(([k, v]) => `${k}: ${v}`);
    } catch { /* ignore */ }
  }

  // Build structure overview
  info.structure = await scanStructure(root);

  _repoMap = info;
  return info;
}

export function getCachedRepoMap() {
  return _repoMap;
}

export function renderRepoMap(info) {
  if (!info) return "";
  const lines = [
    "<env>",
    `  Working directory: ${process.cwd()}`,
    `  Project root: ${info.root}`,
    `  Is directory a git repo: ${info.hasGit ? "yes" : "no"}`,
    `  Platform: ${process.platform}`,
    `  Today's date: ${new Date().toDateString()}`,
    info.packageJson ? `  Package: ${info.packageJson}` : "",
    info.language ? `  Language: ${info.language}` : "",
    info.testPattern ? `  Test command: ${info.testPattern}` : "",
    info.scripts.length ? `  Scripts:\n    npm run ${info.scripts.map(s => s.split(":")[0]).join("\n    npm run ")}` : "",
    "</env>",
  ];
  return lines.filter(Boolean).join("\n");
}

function detectLanguage(root) {
  const markers = [
    ["package.json", "Node.js"],
    ["tsconfig.json", "TypeScript"],
    ["Cargo.toml", "Rust"],
    ["go.mod", "Go"],
    ["Gemfile", "Ruby"],
    ["requirements.txt", "Python"],
    ["Makefile", "C/C++"],
    ["pom.xml", "Java"],
    ["build.gradle", "Java"],
    ["composer.json", "PHP"],
  ];
  for (const [file, lang] of markers) {
    if (fsSync.existsSync(path.join(root, file))) return lang;
  }
  return "";
}

function guessTestPattern(root) {
  const pkgPath = path.join(root, "package.json");
  if (fsSync.existsSync(pkgPath)) {
    try {
      const raw = fsSync.readFileSync(pkgPath, "utf8");
      const pkg = JSON.parse(raw);
      const s = pkg.scripts || {};
      if (s.test) return `npm test (${s.test})`;
      if (s["test:run"]) return `npm run test:run`;
    } catch { /* */ }
  }
  if (fsSync.existsSync(path.join(root, "vitest.config.ts")) || fsSync.existsSync(path.join(root, "vitest.config.js"))) return "vitest";
  if (fsSync.existsSync(path.join(root, "jest.config.ts")) || fsSync.existsSync(path.join(root, "jest.config.js"))) return "jest";
  if (fsSync.existsSync(path.join(root, ".mocharc.yml")) || fsSync.existsSync(path.join(root, ".mocharc.js"))) return "mocha";
  return "";
}

async function isGitRepo(root) {
  try {
    await fs.access(path.join(root, ".git"));
    return true;
  } catch {
    return false;
  }
}

async function scanStructure(root) {
  const entries = [];
  try {
    const dirs = await fs.readdir(root, { withFileTypes: true });
    for (const d of dirs) {
      if (d.name.startsWith(".") || d.name === "node_modules") continue;
      if (d.isDirectory()) {
        entries.push(`  ${d.name}/`);
        try {
          const sub = await fs.readdir(path.join(root, d.name), { withFileTypes: true });
          const shown = sub.filter(e => e.isFile() && !e.name.startsWith(".")).slice(0, 3);
          for (const f of shown) entries.push(`    ${d.name}/${f.name}`);
        } catch { /* */ }
      } else if (d.isFile() && !d.name.startsWith(".")) {
        entries.push(`  ${d.name}`);
      }
    }
  } catch { /* */ }
  return entries.join("\n");
}
