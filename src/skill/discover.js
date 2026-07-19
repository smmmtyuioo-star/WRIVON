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
        await scanSkillDir(dir, ent.name, skills, seen);
      }
    } catch { /* directory doesn't exist */ }
  }
  _skillCache = skills;
  return skills;
}

export async function loadSkill(name) {
  const skills = await discoverSkills();
  const match = skills.find(s => s.name === name);
  if (!match) return null;
  const fullFile = match.content;  // already parsed
  // Re-read raw for complete content with frontmatter metadata strip
  const skillMd = path.join(match.directory, "SKILL.md");
  try {
    const raw = await fs.readFile(skillMd, "utf8");
    const parsed = parseSkillMd(raw);
    return parsed ? parsed.content : null;
  } catch {
    return null;
  }
}

async function scanSkillDir(baseDir, entryName, skills, seen) {
  const fullDir = path.join(baseDir, entryName);
  const skillMd = path.join(fullDir, "SKILL.md");
  // Check if this directory itself is a skill (top-level)
  try {
    const raw = await fs.readFile(skillMd, "utf8");
    const parsed = parseSkillMd(raw);
    if (parsed && !seen.has(parsed.name)) {
      seen.add(parsed.name);
      skills.push({ ...parsed, category: "general", directory: fullDir });
      return;
    }
  } catch { /* no SKILL.md — check subdirectories */ }
  // No SKILL.md — this is a category directory; scan subdirectories
  const category = entryName;
  try {
    const sub = await fs.readdir(fullDir, { withFileTypes: true });
    for (const s of sub) {
      if (!s.isDirectory()) continue;
      const subDir = path.join(fullDir, s.name);
      const subMd = path.join(subDir, "SKILL.md");
      try {
        const raw = await fs.readFile(subMd, "utf8");
        const parsed = parseSkillMd(raw);
        if (parsed && !seen.has(parsed.name)) {
          seen.add(parsed.name);
          skills.push({ ...parsed, category, directory: subDir });
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
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
