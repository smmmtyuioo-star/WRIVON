// Installs built-in skills to ~/.wrivon/skills/ on npm postinstall or first run.
// Copies all skill directories from src/skills/builtin/ to the user's skill dir.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const SKILLS_SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "skills", "builtin");
const USER_SKILLS_DIR = path.join(os.homedir(), ".wrivon", "skills");

async function installSkills() {
  // Check if skills are already installed
  const marker = path.join(USER_SKILLS_DIR, ".installed");
  if (fs.existsSync(marker)) {
    // Check if source has changed (compare mtime)
    try {
      const srcStat = await fsp.stat(SKILLS_SOURCE);
      const markerStat = await fsp.stat(marker);
      if (srcStat.mtimeMs <= markerStat.mtimeMs) {
        return; // Already installed and up-to-date
      }
    } catch {
      // If stat fails, re-install
    }
  }

  // Ensure user skills directory exists
  await fsp.mkdir(USER_SKILLS_DIR, { recursive: true });

  // Read built-in skill directories
  let entries;
  try {
    entries = await fsp.readdir(SKILLS_SOURCE, { withFileTypes: true });
  } catch {
    return; // No built-in skills source
  }

  let installed = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const srcDir = path.join(SKILLS_SOURCE, entry.name);
    const destDir = path.join(USER_SKILLS_DIR, entry.name);

    // Check if SKILL.md exists in source
    const skillMdPath = path.join(srcDir, "SKILL.md");
    if (!fs.existsSync(skillMdPath)) continue;

    // Copy skill directory
    await fsp.mkdir(destDir, { recursive: true });

    // Copy all files in the skill directory
    const files = await fsp.readdir(srcDir);
    for (const file of files) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      const stat = await fsp.stat(srcFile);
      if (stat.isFile()) {
        await fsp.copyFile(srcFile, destFile);
      }
    }
    installed++;
  }

  // Write installation marker
  await fsp.writeFile(marker, new Date().toISOString(), "utf8");

  if (installed > 0) {
    console.log(`  ✓ Installed ${installed} built-in skill(s) to ${USER_SKILLS_DIR}`);
  }
}

installSkills().catch(() => {
  // Silently fail — skills are non-critical
});
