import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

let _skillCache = null;

export async function discoverSkills() {
  if (_skillCache) return _skillCache;
  const builtinDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "skills", "builtin");
  const dirs = [
    builtinDir,
    path.join(os.homedir(), ".wrivon", "skills"),
    path.join(process.cwd(), ".wrivon", "skills"),
  ];
  const skills = [];
  const seen = new Set();
  for (const dir of dirs) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        if (seen.has(ent.name)) continue;
        seen.add(ent.name);
        const skillMd = path.join(dir, ent.name, "SKILL.md");
        try {
          const raw = await fs.readFile(skillMd, "utf8");
          const parsed = parseSkillMd(raw);
          if (parsed) {
            skills.push({ ...parsed, directory: path.join(dir, ent.name) });
          }
        } catch { /* no SKILL.md, skip */ }
      }
    } catch { /* directory doesn't exist */ }
  }
  _skillCache = skills;
  return skills;
}

export async function loadSkillGuidance() {
  const skills = await discoverSkills();
  if (!skills.length) return "";
  const lines = [
    "",
    "Skills provide specialized instructions and workflows for specific tasks.",
    "Use the skill tool to load a skill when a task matches its description.",
    "<available_skills>",
  ];
  for (const s of skills) {
    lines.push(`  <skill>`);
    lines.push(`    <name>${s.name}</name>`);
    lines.push(`    <description>${s.description}</description>`);
    lines.push(`  </skill>`);
  }
  lines.push("</available_skills>");
  return lines.join("\n");
}

function parseSkillMd(raw) {
  const fenced = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/.exec(raw);
  if (!fenced) return null;
  const frontmatter = parseYaml(fenced[1]);
  const name = frontmatter?.name;
  const description = frontmatter?.description || "";
  if (!name) return null;
  return { name: String(name), description: String(description), content: fenced[2].trim() };
}

function parseYaml(raw) {
  const obj = {};
  for (const line of raw.split("\n")) {
    const m = /^(\w[\w-]*)\s*:\s*(.*)$/.exec(line);
    if (m) obj[m[1]] = m[2];
  }
  return obj;
}
