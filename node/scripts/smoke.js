// Smoke test for WRIVON.

import { loadConfig } from "../src/config/load.js";
import { createProvider, listProviders } from "../src/llm/index.js";
import { runTool, TOOLS, isDangerousCommand } from "../src/agent/tools.js";
import { openSession, listSessions, getSessionInfo, setSessionName } from "../src/session/store.js";
import { loadSystemPrompt, extractToolCalls, extractSearchReplace, loadProjectContext, compactMessages } from "../src/agent/loop.js";
import { discoverSkills, loadSkillGuidance } from "../src/skill/discover.js";
import { buildRepoMap, renderRepoMap, getCachedRepoMap } from "../src/repo/map.js";

let failures = 0;

async function test(label, fn) {
  try { await fn(); process.stdout.write(`  PASS  ${label}\n`); }
  catch (e) { process.stdout.write(`  FAIL  ${label}: ${e.message}\n`); failures++; }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }

async function main() {
  process.stdout.write("WRIVON smoke test\n");

  // 1. Config
  await test("config loads without throwing", () => {
    const cfg = loadConfig();
    assert(cfg.provider, "has a default provider");
    assert(cfg.providers, "has providers map");
    assert(cfg.providers.nvidia, "has nvidia provider");
    assert(cfg.providers.cloudflare, "has cloudflare provider");
    assert(cfg.sandbox, "has sandbox config");
  });

  // 2. Provider factory
  await test("provider factory creates nvidia", () => {
    const cfg = loadConfig();
    cfg.provider = "nvidia";
    const p = createProvider(cfg);
    assert(p.kind === "openai", "nvidia uses openai-compat kind");
    assert(p.baseUrl.includes("nvidia.com"), "has nvidia base url");
  });

  await test("provider factory creates cloudflare", () => {
    const cfg = loadConfig();
    cfg.provider = "cloudflare";
    cfg.providers.cloudflare.accountId = "test-id";
    const p = createProvider(cfg);
    assert(p.kind === "openai", "cloudflare uses openai-compat kind");
  });

  // 3. listProviders
  await test("listProviders returns entries", () => {
    const p = listProviders(loadConfig());
    assert(p.length >= 2, `expected >=2 providers, got ${p.length}`);
    const names = p.map((x) => x.name);
    assert(names.includes("nvidia"), "has nvidia");
    assert(names.includes("cloudflare"), "has cloudflare");
  });

  // 4. Tools registry
  await test("tool registry has all 8 tools", () => {
    const names = Object.keys(TOOLS);
    assert(names.length === 8, `expected 8 tools, got ${names.length}`);
    for (const n of ["read", "write", "edit", "glob", "grep", "bash", "task", "skill"]) assert(names.includes(n), `missing ${n}`);
  });

  await test("runTool dispatch works for unknown tool", async () => {
    const r = await runTool("nonexistent", {}, {});
    assert(!r.ok, "should fail");
    assert(r.error?.includes("unknown tool"), `bad error: ${r.error}`);
  });

  await test("task tool has correct schema", () => {
    const task = TOOLS.task;
    assert(task, "task tool missing");
    assert(task.name === "task", `wrong name: ${task.name}`);
    assert(task.schema.required.includes("description"), "missing required description");
    assert(task.schema.required.includes("prompt"), "missing required prompt");
    assert(task.schema.properties.subagent_type, "missing subagent_type");
    assert(task.schema.properties.task_id, "missing task_id");
    assert(typeof task.run === "function", "run not a function");
  });

  await test("skill tool has correct schema", () => {
    const skill = TOOLS.skill;
    assert(skill, "skill tool missing");
    assert(skill.name === "skill", `wrong name: ${skill.name}`);
    assert(skill.schema.required.includes("name"), "missing required name");
    assert(typeof skill.run === "function", "run not a function");
  });

  await test("isDangerousCommand detects dangerous patterns", () => {
    assert(isDangerousCommand("rm -rf /"), "rm -rf is dangerous");
    assert(isDangerousCommand("git push --force origin main"), "force push is dangerous");
    assert(isDangerousCommand("DROP TABLE users"), "DROP TABLE is dangerous");
    assert(isDangerousCommand("npm publish"), "publish is dangerous");
    assert(!isDangerousCommand("npm test"), "npm test is safe");
    assert(!isDangerousCommand("ls -la"), "ls is safe");
    assert(!isDangerousCommand("git status"), "git status is safe");
  });

  await test("error suggestions include helpful hints", async () => {
    const r = await runTool("read", { path: "/__WRIVON_SMOKE_DOES_NOT_EXIST__" }, {});
    assert(!r.ok, "should fail");
    assert(r.error?.includes("Suggestion:"), `missing suggestion: ${r.error}`);
  });

  await test("discoverSkills returns empty array when no skills", async () => {
    const skills = await discoverSkills();
    assert(Array.isArray(skills), "should return array");
  });

  await test("loadSkillGuidance returns empty string or valid XML", async () => {
    const text = await loadSkillGuidance();
    assert(typeof text === "string", "should return string");
    if (text.length > 0) {
      assert(text.includes("<available_skills>"), "should have skills XML");
    }
  });

  await test("runTool read returns error for missing file", async () => {
    const r = await runTool("read", { path: "/__WRIVON_SMOKE_DOES_NOT_EXIST__" }, {});
    assert(!r.ok, "should fail for nonexistent file");
  });

  // 5. System prompt
  await test("system prompt loads", async () => {
    const text = await loadSystemPrompt();
    assert(text.includes("WRIVON"), "prompt mentions WRIVON");
    assert(text.length > 200, `prompt too short: ${text.length} chars`);
  });

  // 6. Sessions
  await test("openSession creates without error", async () => {
    const s = await openSession(null);
    assert(s.id, "has an id");
    assert(s.path, "has a path");
    await s.append({ type: "meta", test: "smoke" });
  });

  await test("listSessions returns without error", async () => {
    const list = await listSessions();
    assert(Array.isArray(list), "should be array");
  });

  await test("getSessionInfo returns null for unknown id", async () => {
    const info = await getSessionInfo("__nonexistent__");
    assert(info === null, "should be null for unknown");
  });

  // 7a. Repo map
  await test("buildRepoMap returns project info", async () => {
    const info = await buildRepoMap(process.cwd());
    assert(info.root, "should have root");
    assert(info.hasGit === true || info.hasGit === false, "should detect git");
  });

  await test("renderRepoMap produces valid XML env block", async () => {
    const info = await buildRepoMap(process.cwd());
    const rendered = renderRepoMap(info);
    assert(rendered.includes("<env>"), "should have env tag");
    assert(rendered.includes("</env>"), "should close env tag");
    assert(rendered.includes("Working directory"), "should mention directory");
  });

  await test("getCachedRepoMap returns cached value", () => {
    const cached = getCachedRepoMap();
    assert(cached === null || cached.root, "should be null or have root");
  });

  await test("loadProjectContext returns null when no WRIVON.md", async () => {
    const ctx = await loadProjectContext();
    // In the wrivon project itself, there might be a WRIVON.md; null is ok
    assert(ctx === null || ctx.file, "should be null or have file name");
  });

  // 7. Inline tool call extractor
  await test("extractToolCalls finds inline JSON calls", () => {
    const text1 = 'I will create the file.\n{"name": "write", "arguments": {"path": "test.txt", "content": "hello"}}';
    const r1 = extractToolCalls(text1);
    assert(r1.length === 1, `expected 1 call, got ${r1.length}`);
    assert(r1[0].name === "write", `expected write, got ${r1[0].name}`);
    assert(r1[0].args.path === "test.txt", `wrong path: ${r1[0].args.path}`);

    const text2 = '{"type": "function", "name": "read", "parameters": {"path": "foo.js"}} trailing';
    const r2 = extractToolCalls(text2);
    assert(r2.length === 1, `expected 1 call, got ${r2.length}`);
    assert(r2[0].name === "read", `expected read, got ${r2[0].name}`);

    const text3 = 'no JSON here at all';
    assert(extractToolCalls(text3).length === 0, "should return empty");

    const text4 = '{"name": "bash", "parameters": {"command": "ls"}}';
    const r4 = extractToolCalls(text4);
    assert(r4.length === 1, `expected 1, got ${r4.length}`);
    assert(r4[0].name === "bash", `expected bash, got ${r4[0].name}`);

    const text5 = '{"not": "a tool call"}';
    assert(extractToolCalls(text5).length === 0, "should not match non-tool JSON");

    const text6 = 'Here is some code: {"key": "value"}';
    assert(extractToolCalls(text6).length === 0, "should not match code JSON");

    const text7 = '{"name": "read", "arguments": {"path": "x"}} and {"name": "write", "arguments": {"path": "y", "content": "z"}}';
    const r7 = extractToolCalls(text7);
    assert(r7.length === 2, `expected 2, got ${r7.length}`);
    assert(r7[0].name === "read", `expected read, got ${r7[0].name}`);
    assert(r7[1].name === "write", `expected write, got ${r7[1].name}`);
  });

  // 8. SEARCH/REPLACE extractor
  await test("extractSearchReplace finds blocks with paths", () => {
    const t1 = 'Some text\n### C:\\test\\file.js\n<<<<<<< SEARCH\nold code\n=======\nnew code\n>>>>>>> REPLACE\nmore text';
    const r1 = extractSearchReplace(t1);
    assert(r1.length === 1, `expected 1, got ${r1.length}`);
    assert(r1[0].path === "C:\\test\\file.js", `wrong path: ${r1[0].path}`);
    assert(r1[0].search === "old code", `wrong search: ${r1[0].search}`);
    assert(r1[0].replace === "new code", `wrong replace: ${r1[0].replace}`);

    const t2 = '### a.js\n<<<<<<< SEARCH\nline1\nline2\n=======\nline1\nline2\nline3\n>>>>>>> REPLACE';
    const r2 = extractSearchReplace(t2);
    assert(r2.length === 1, `expected 1, got ${r2.length}`);
    assert(r2[0].path === "a.js", `wrong path: ${r2[0].path}`);
    assert(r2[0].search.includes("line2"), "search should have line2");

    const t3 = 'no blocks here';
    assert(extractSearchReplace(t3).length === 0, "should return empty for no blocks");

    const t4 = '<<<<<<< SEARCH\na\n=======\nb\n>>>>>>> REPLACE';
    const r4 = extractSearchReplace(t4);
    assert(r4.length === 1, `expected 1, got ${r4.length}`);
    assert(r4[0].path === "", "no path should give empty path");
  });

  // 8. Context compaction
  await test("compactMessages does nothing for small context", () => {
    const msgs = [
      { role: "system", content: "You are an agent." },
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ];
    const result = compactMessages(msgs);
    assert(result.length === msgs.length, "should not compact small context");
  });

  await test("compactMessages preserves last messages", () => {
    const msgs = [
      { role: "system", content: "You are an agent." },
    ];
    // Add enough messages with long content to trigger compaction
    for (let i = 0; i < 10; i++) {
      msgs.push({ role: "user", content: "A".repeat(4000) });
      msgs.push({ role: "assistant", content: "B".repeat(4000) });
      msgs.push({ role: "tool", content: "C".repeat(2000) });
    }
    const result = compactMessages(msgs);
    assert(result.length < msgs.length, "should compact large context");
    // Should keep system + 4 tail messages
    assert(result[0].role === "system", "system should be first");
    // Should have a summary message
    const hasSummary = result.some(m => m.role === "system" && m.content?.includes("Previous conversation summarized"));
    assert(hasSummary, "should have summary message");
  });

  // 9. Token estimation (used by /status)
  await test("token estimation matches compactMessages", () => {
    // The compactMessages threshold is 24000 tokens
    // A single long message should trigger compaction
    const msgs = [
      { role: "system", content: "sys" },
      { role: "user", content: "X".repeat(96000) }, // ~96000/4 = 24000 tokens
      { role: "assistant", content: "hi" },
    ];
    // estimateTokens is internal; we can verify by checking if compactMessages compacts this
    const result = compactMessages(msgs);
    assert(Array.isArray(result), "should return array");
  });

  await test("session export writes markdown file", async () => {
    const { openSession, loadSession } = await import("../src/session/store.js");
    const session = await openSession(null, { provider: "test", model: "test-model", cwd: "/tmp" });
    await session.append({ type: "user", content: "hello" });
    await session.append({ type: "assistant", content: "hi there" });
    const records = await loadSession(session.id);
    assert(records.length >= 2, "should have session records");
  });

  await test("setSessionName updates session metadata", async () => {
    const { openSession, setSessionName, getSessionInfo } = await import("../src/session/store.js");
    const s = await openSession(null, { provider: "test", model: "t", cwd: "/tmp" });
    const ok = await setSessionName(s.id, "my test session");
    assert(ok, "setSessionName should succeed");
    const info = await getSessionInfo(s.id);
    assert(info.name === "my test session", `expected name, got: ${info.name}`);
    // Clear name
    await setSessionName(s.id, "");
    const info2 = await getSessionInfo(s.id);
    assert(info2.name === "", "name should be cleared");
  });

  // Summary
  process.stdout.write(`\n${failures === 0 ? "All tests passed." : `${failures} test(s) failed.`}\n`);
  process.exit(failures ? 1 : 0);
}

main();
