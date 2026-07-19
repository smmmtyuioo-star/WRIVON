---
name: plan
description: Structured project planning — explore the codebase, break down tasks, estimate effort, produce a numbered implementation plan. Use before starting complex multi-file changes.
---

# Plan

Before writing code, produce a structured plan. This reduces wasted work and catches design problems early.

## Process

1. **Explore** — Read package.json, config files, entry points. Use glob/grep to understand the codebase structure. Identify relevant files and their roles.
2. **Define** — What exactly needs to change? List each file and what changes it needs.
3. **Order** — What order should changes happen in? Dependencies first (types, utilities), then core logic, then UI, then tests.
4. **Risks** — What could go wrong? Breaking changes, API incompatibilities, performance regressions.
5. **Verify** — How will you confirm it works? Tests, manual checks, build output.

## Output format

```
## Plan: [Description]

### Files to modify
1. `src/file1.ts` — What changes (reason)
2. `src/file2.ts` — What changes (reason)

### Implementation order
1. [Step 1] — What and why
2. [Step 2] — What and why

### Risks
- [Risk] — Mitigation

### Verification
- How to confirm the change works

### Effort estimate
- [Small/Medium/Large] — Expected turns or time
```
