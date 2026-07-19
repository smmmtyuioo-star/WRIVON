import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXTRACTED_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "_extracted");

const DOMAIN_INDEX = {
  engineering: {
    dir: "engineering",
    label: "Engineering — 79 skills (full-stack, DevOps, security, AI/ML, databases, SRE, architecture, testing)",
    primaryFile: path.join("..", "CLAUDE.md"),
  },
  marketing: {
    dir: "marketing-skill",
    label: "Marketing — 48 skills (Content, SEO/AEO, CRO, Channels, Growth, Intelligence, Sales Enablement, Ops)",
    primaryFile: "CLAUDE.md",
  },
  "c-level-advisor": {
    dir: "c-level-advisor",
    label: "C-Level Advisory — 68 skills (CEO, CFO, CTO, CMO, CPO, CRO, COO, CHRO, CISO, GC, CDO, CAIO, CCO, VPE)",
    primaryFile: "CLAUDE.md",
  },
  "system-prompts": {
    dir: "system_prompts_leaks-main",
    label: "System Prompt Leaks — 337 prompts from 19 AI vendors (Anthropic, OpenAI, Google, xAI, etc.)",
    primaryFile: path.join("system_prompts_leaks-main", "README.md"),
  },
  research: {
    dir: "research",
    label: "Research — R&D Operations (clinical, finance, market, product) + Academic Research (litreview, grants, patents)",
    primaryFile: null,
  },
  business: {
    dir: "business-growth",
    label: "Business — Growth, Operations, Commercial, Finance, Product, Project Management",
    primaryFile: null,
  },
  compliance: {
    dir: "ra-qm-team",
    label: "Compliance — RA/QM (ISO 13485, MDR, FDA, GDPR, ISO 27001) + Compliance OS",
    primaryFile: null,
  },
};

const _cache = {};

export async function indexKnowledge() {
  const catalog = {};
  for (const [domain, info] of Object.entries(DOMAIN_INDEX)) {
    const domainDir = path.join(EXTRACTED_DIR, info.dir);
    try {
      await fs.access(domainDir);
      catalog[domain] = {
        exists: true,
        label: info.label,
        dir: domainDir,
        primaryFile: info.primaryFile ? path.resolve(domainDir, info.primaryFile) : null,
      };
    } catch {
      catalog[domain] = { exists: false, label: info.label, dir: domainDir };
    }
  }
  return catalog;
}

export async function loadDomainKnowledge(domain) {
  const info = DOMAIN_INDEX[domain];
  if (!info) return null;
  const domainDir = path.join(EXTRACTED_DIR, info.dir);
  try {
    await fs.access(domainDir);
  } catch {
    return null;
  }
  // Try primary file first
  if (info.primaryFile) {
    const primaryPath = path.resolve(domainDir, info.primaryFile);
    try {
      const content = await fs.readFile(primaryPath, "utf8");
      return {
        domain,
        label: info.label,
        content: content.slice(0, 30000),
        path: primaryPath,
        size: content.length,
      };
    } catch { /* fall through */ }
  }
  // Fallback: list skill subdirectories
  try {
    const entries = await fs.readdir(domainDir, { withFileTypes: true });
    const skills = [];
    for (const e of entries) {
      if (e.isDirectory()) skills.push(e.name);
    }
    // Also try skills/ subdirectory
    let skillNames = skills.join(", ");
    try {
      const subSkillsDir = path.join(domainDir, "skills");
      const subEntries = await fs.readdir(subSkillsDir, { withFileTypes: true });
      const subSkills = subEntries.filter(e => e.isDirectory()).map(e => e.name);
      if (subSkills.length) skillNames += " | skills/: " + subSkills.join(", ");
    } catch { /* no skills subdir */ }
    return {
      domain,
      label: info.label,
      content: `Domain: ${domain}\nSub-directories: ${skillNames}`,
      path: domainDir,
      size: 0,
    };
  } catch {
    return null;
  }
}

export async function findDomainForQuery(query) {
  const q = query.toLowerCase();
  const results = [];
  for (const [domain, info] of Object.entries(DOMAIN_INDEX)) {
    if (domain.includes(q) || info.label.toLowerCase().includes(q)) {
      results.push({ domain, label: info.label });
    }
  }
  return results;
}

export function listDomains() {
  return Object.entries(DOMAIN_INDEX).map(([key, val]) => ({
    key,
    label: val.label,
  }));
}
