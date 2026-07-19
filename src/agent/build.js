import fs from "node:fs/promises";
import path from "node:path";
import { runTurn, compactMessages, loadSystemPrompt } from "./loop.js";
import { runTool } from "./tools.js";
import { renderStream } from "../tui/render.js";

const BUILD_MODES = {
  build: {
    name: "build",
    label: "Build",
    description: "Full-stack builder — create entire apps from a single prompt",
    instruction: `You are in BUILD mode — a full-stack one-shot builder.

Your goal is to build the complete application the user described. Follow this process:

## Phase 1: Plan
First, output a structured plan as JSON inside a code block:
\`\`\`json
{
  "app_name": "my-app",
  "tech_stack": ["react", "express", "sqlite"],
  "root_dir": "my-app",
  "install_command": "npm install",
  "run_command": "npm run dev",
  "files": [
    {"path": "package.json", "purpose": "Project manifest with dependencies"},
    {"path": "src/index.js", "purpose": "Entry point"},
    ...
  ]
}
\`\`\`

After outputting the plan, tell the user "Plan ready — proceeding to build." Then proceed to Phase 2.

## Phase 2: Generate Files
For each file in the plan, call the write tool to create it. Generate COMPLETE, production-quality content for every file. Do not skip content generation — every file must be fully implemented.

After each write, briefly confirm it was written. Then immediately proceed to the next file without waiting for user input.

## Phase 3: Install & Run
After ALL files are written, the system will automatically run the install command and report results.

## Rules
- Generate FULL implementations, not stubs or placeholders
- One file per write call
- Confirm each file briefly, then move to next
- Do NOT ask the user for approval between files
- If a write fails, retry once, then report the error and continue with the next file
- Keep responses concise — file creation is the deliverable`,
  },
};

export async function runBuild({
  userText,
  messages,
  provider,
  cfg,
  session,
  onEvent,
  signal,
}) {
  const systemPrompt = await loadSystemPrompt();
  const buildMessages = [{ role: "system", content: systemPrompt + "\n\n" + BUILD_MODES.build.instruction }];
  const baseDir = process.cwd();

  // ── Phase 1: Planning ──
  onEvent?.({ kind: "stream_start" });
  const planPrompt = `Plan this application and output a JSON plan:\n\n${userText}\n\nOutput ONLY a valid JSON plan inside a json code block.`;
  let planResult = "";
  await runTurn({
    userText: planPrompt,
    messages: buildMessages,
    provider,
    cfg,
    session,
    onEvent: (evt) => {
      if (evt.kind === "token") planResult += evt.content;
      onEvent?.(evt);
    },
    signal,
    mode: "code",
  });

  // Extract JSON plan from the response
  const plan = extractPlan(planResult);
  if (!plan) {
    onEvent?.({ kind: "error", content: "Failed to generate a valid plan. Please try again with a more specific description." });
    return;
  }

  const rootDir = plan.root_dir ? path.resolve(baseDir, plan.root_dir) : baseDir;
  const files = plan.files || [];
  const installCmd = plan.install_command || "npm install";
  const runCmd = plan.run_command || "npm start";
  const techStack = Array.isArray(plan.tech_stack) ? plan.tech_stack.join(", ") : "detected";

  onEvent?.({ kind: "plan_ready", plan });

  // ── Phase 2: File Generation ──
  let created = 0;
  let failed = 0;
  const failedFiles = [];
  const createdFiles = [];

  for (const file of files) {
    const filePath = path.resolve(rootDir, file.path);
    const fileDir = path.dirname(filePath);

    // Create directory if needed
    try {
      await fs.mkdir(fileDir, { recursive: true });
    } catch (e) {
      onEvent?.({ kind: "error", content: `Failed to create directory ${fileDir}: ${e.message}` });
      failed++;
      failedFiles.push(file.path);
      continue;
    }

    // Generate content for this file by asking the model
    const content = await generateFileContent({
      fileInfo: file,
      plan,
      provider,
      cfg,
      signal,
      techStack,
    });

    if (content === null) {
      // Retry once
      const retryContent = await generateFileContent({
        fileInfo: file,
        plan,
        provider,
        cfg,
        signal,
        techStack,
        isRetry: true,
      });
      if (retryContent === null) {
        onEvent?.({ kind: "file_failed", path: file.path, error: "Content generation failed after retry" });
        failed++;
        failedFiles.push(file.path);
        continue;
      }
      try {
        await fs.writeFile(filePath, retryContent, "utf8");
        created++;
        createdFiles.push(file.path);
        onEvent?.({ kind: "file_created", path: file.path });
      } catch (e) {
        onEvent?.({ kind: "file_failed", path: file.path, error: e.message });
        failed++;
        failedFiles.push(file.path);
      }
    } else {
      try {
        await fs.writeFile(filePath, content, "utf8");
        created++;
        createdFiles.push(file.path);
        onEvent?.({ kind: "file_created", path: file.path });
      } catch (e) {
        onEvent?.({ kind: "file_failed", path: file.path, error: e.message });
        failed++;
        failedFiles.push(file.path);
      }
    }
  }

  // ── Phase 3: Install Dependencies ──
  let installOk = false;
  let installOutput = "";
  if (created > 0 && (installCmd === "npm install" || installCmd.includes("install"))) {
    onEvent?.({ kind: "install_start", command: installCmd });
    const installResult = await runTool("bash", {
      command: installCmd,
      cwd: rootDir,
      timeout_ms: 120000,
    }, { sandbox: cfg.sandbox?.filesystem || "workspace-write", tools: cfg.tools });
    installOk = installResult.ok;
    installOutput = installResult.ok ? installResult.output : installResult.error;
    if (installResult.ok) {
      onEvent?.({ kind: "install_done", ok: true, output: installOutput });
    } else {
      onEvent?.({ kind: "install_done", ok: false, output: installOutput });
    }
  } else if (created > 0) {
    // Non-npm command
    onEvent?.({ kind: "install_start", command: installCmd });
    const installResult = await runTool("bash", {
      command: installCmd,
      cwd: rootDir,
      timeout_ms: 120000,
    }, { sandbox: cfg.sandbox?.filesystem || "workspace-write", tools: cfg.tools });
    installOk = installResult.ok;
    installOutput = installResult.ok ? installResult.output : installResult.error;
    onEvent?.({ kind: "install_done", ok: installOk, output: installOutput });
  }

  // ── Phase 4: Summary ──
  const relativeDir = path.relative(baseDir, rootDir) || ".";
  const summary = {
    appName: plan.app_name || "app",
    rootDir: relativeDir,
    techStack,
    filesCreated: created,
    filesFailed: failed,
    createdFiles,
    failedFiles,
    installOk,
    installOutput: installOutput ? installOutput.slice(0, 500) : "",
    runCommand: runCmd,
  };

  onEvent?.({ kind: "build_summary", summary });
  return summary;
}

async function generateFileContent({ fileInfo, plan, provider, cfg, signal, isRetry = false }) {
  const fileGenMessages = [
    { role: "system", content: `You are a full-stack engineer generating a single file for a project.

Project: ${plan.app_name || "app"}
Tech stack: ${(plan.tech_stack || []).join(", ")}
File to generate: ${fileInfo.path}
Purpose: ${fileInfo.purpose || "Implementation"}

Generate COMPLETE, production-quality content for this file. Output ONLY the file content inside a code block with the appropriate language tag.

Rules:
- No placeholders or TODOs
- No explanations outside the code block
- The content must be fully functional
${isRetry ? "- Previous attempt failed. Make sure the output is complete and valid." : ""}` },
  ];

  let content = "";
  let hasError = false;

  try {
    const result = await provider.chat({
      messages: [...fileGenMessages, { role: "user", content: `Generate the complete content for ${fileInfo.path}` }],
      tools: [],
      stream: false,
      signal,
    });
    content = result.content || "";
  } catch {
    hasError = true;
  }

  if (hasError || !content.trim()) return null;

  // Extract content from code block if present
  const codeBlockMatch = content.match(/```(?:\w+)?\n?([\s\S]*?)```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : content.trim();
}

function extractPlan(text) {
  // Try to find a JSON code block
  const jsonBlock = text.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  if (jsonBlock) {
    try {
      const parsed = JSON.parse(jsonBlock[1]);
      if (parsed.files && Array.isArray(parsed.files)) return parsed;
    } catch { /* fall through */ }
  }

  // Try to find any JSON object in the text
  const jsonMatch = text.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.files && Array.isArray(parsed.files)) return parsed;
    } catch { /* fall through */ }
  }

  return null;
}

export function getBuildLabel() {
  return BUILD_MODES.build;
}
