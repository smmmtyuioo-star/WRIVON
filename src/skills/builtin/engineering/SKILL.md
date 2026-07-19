---
name: "engineering"
description: "Engineering domain skill pack covering 79 advanced engineering skills: full-stack, backend, frontend, DevOps, security, AI/ML, databases, observability, SRE, architecture, and team roles. Use for any engineering task."
license: MIT
metadata:
  version: 1.0.0
  author: Wrivon
  category: engineering
  updated: 2026-07-19
  source: "claude-code-skills v2.11.2 (extracted)"
---

# Engineering Domain Skills

## Overview

Comprehensive engineering skill pack combining 79 production-ready skills from both the Core Engineering (engineering-team/) and POWERFUL-tier Advanced Engineering (engineering/) domains. Covers full-stack development, system architecture, DevOps, security, AI/ML, databases, observability, SRE, and team-centric engineering roles. Each skill is a self-contained package with stdlib-only Python tools, reference docs, and templates.

All skills follow the skill package pattern: `SKILL.md` (master documentation with YAML frontmatter) + `scripts/` (Python CLI tools, stdlib-only, no ML/LLM calls) + `references/` (expert knowledge bases citing 5-7+ authoritative sources each) + `assets/` (user-facing templates). Knowledge flows from `references/` into `SKILL.md` workflows, executed via `scripts/` tools, applied using `assets/` templates. Orchestrator skills use `context: fork` for multi-skill chaining. All Python tools support `--help` and `--sample` for deterministic verification.

The repository these were extracted from (claude-code-skills v2.11.2) spans 18 domains with 362 production-ready skills, 644 Python automation tools, 741 reference guides, 102 agents, and 116 slash commands distributed as 88 marketplace plugins. Engineering is the largest domain. Skills are designed to save users 40%+ time while improving consistency/quality by 30%+.

**Design philosophy:** Skills are products — self-contained, deployable standalone. Documentation-driven — success depends on clear, actionable docs. Algorithm over AI — deterministic analysis (stdlib code) vs LLM calls. Template-heavy — ready-to-use templates users customize. Platform-specific — specific best practices over generic advice.

## Skills by Category

### Architecture & Design
- **senior-architect**: System design, architecture diagrams, ADRs, tech stack evaluation, monolith vs microservices, dependency analysis
- **senior-fullstack**: Fullstack architecture with forcing questions, 4 profiles (startup/SaaS/enterprise/internal-tool), Next.js/FastAPI/MERN/Django scaffolding
- **senior-backend**: API design, database optimization, backend security, 4 stacked profiles (CRUD/event-driven/graphql/streaming)
- **senior-frontend**: React patterns, Next.js optimization, frontend best practices, 4 profiles
- **senior-data-engineer**: Pipeline orchestration, Airflow DAGs, Spark jobs, data quality validation, ETL/CDC patterns
- **senior-data-scientist**: A/B test design, statistical power analysis, feature engineering, hypothesis testing, causal inference
- **senior-ml-engineer**: Model deployment pipelines, MLOps setup, drift monitoring, LLM integration
- **senior-prompt-engineer**: Prompt optimization, RAG system building, agent orchestration, retrieval strategies
- **senior-computer-vision**: Object detection (YOLO/Faster R-CNN), model quantization, video processing, TensorRT optimization
- **senior-devops**: CI/CD design, containerization, infrastructure as code, deployment strategies
- **senior-qa**: Test automation, test strategy, quality metrics, test framework selection
- **senior-secops**: Security operations, vulnerability management, compliance automation
- **senior-security**: Security architecture review, threat modeling, security code review
- **code-reviewer**: Automated code review with best practices enforcement, style consistency
- **tech-stack-evaluator**: Evidence-based stack comparison, build-vs-buy analysis, migration risk assessment
- **aws-solution-architect**: AWS architecture design, Well-Architected reviews, cost optimization, serverless patterns
- **azure-cloud-architect**: Azure infrastructure design, ARM/Bicep templates, landing zones, cloud-native patterns
- **gcp-cloud-architect**: GCP infrastructure design, Terraform modules, cloud-native patterns
- **ms365-tenant-manager**: Microsoft 365 tenant configuration, governance, security baselines
- **tdd-guide**: Test-driven development workflow, unit testing patterns, mocking strategies
- **epic-design**: 2.5D interactive websites with scroll storytelling, parallax depth, 6-layer system, 45+ animation techniques
- **a11y-audit**: WCAG 2.2 accessibility audit and fix, contrast checking, automated scanner
- **snowflake-development**: Snowflake data warehouse, SQL optimization, data pipeline patterns
- **security-pen-testing**: Penetration testing methodology, vulnerability assessment, exploit analysis
- **incident-commander**: Incident command system, severity triage, communication templates
- **email-template-builder**: HTML email template generation, responsive design, client compatibility
- **stripe-integration-expert**: Stripe API integration, payment flow design, webhook handling
- **named-persona-adversarial-review**: Named persona-based adversarial code review

### Security
- **adversarial-reviewer**: Adversarial code review with 3 hostile personas (Saboteur, New Hire, Security Auditor)
- **threat-detection**: Hypothesis-driven threat hunting, IOC sweep generation, z-score anomaly detection
- **incident-response**: SEV1-SEV4 triage, 14-type incident taxonomy, NIST SP 800-61 forensics
- **cloud-security**: IAM privilege escalation paths, S3 public access checks, security group detection
- **red-team**: MITRE ATT&CK kill-chain planning, effort scoring, choke point identification
- **ai-security**: ATLAS-mapped prompt injection detection, model inversion & data poisoning risk scoring
- **security-guidance**: PreToolUse security reminder hook (12 patterns: eval, pickle, shell=True, SQL injection, yaml.unsafe_load)

### AI/ML & Agents
- **agent-designer**: Agent architecture design, tool calling patterns, state management
- **agent-workflow-designer**: Multi-agent workflow design, orchestration patterns, handoff protocols
- **autoresearch-agent**: Karpathy's file-optimization loop — locked evaluator, iterative improvement, ground-truth gating
- **agenthub**: Multi-agent spawn/run/merge/eval lifecycle with status tracking and board orchestration
- **agent-harness**: Unified agent loop — goal intake, decomposition, verified execution, retry caps, human escalation
- **karpathy-coder**: 100/100 complexity discipline, assumptions-upfront, verifiable success criteria, deterministic tool logic
- **zero-hallucination-coder**: Grounded code generation with strict fact-checking, references-only output
- **caveman**: Token compression mode (20-50% typical, 75% upper bound), deterministic compressor, cost estimator
- **claude-coach**: Engineering coaching with structured mentorship, code quality improvement
- **behuman**: Human-centered design patterns, empathetic code review, collaboration over ceremony
- **collab-proof**: Collaboration patterns, async communication, decision-logging, team workflow design
- **strict-api**: Contract-first API design, schema validation, type enforcement, breaking change detection
- **prompt-governance**: Prompt versioning, audit trail, prompt testing, approval workflows
- **llm-cost-optimizer**: Token cost analysis, prompt caching strategies, model selection, budget tracking
- **llm-wiki**: Karpathy's LLM Wiki pattern — persistent interlinked markdown vault with incremental ingestion
- **statistical-analyst**: Statistical analysis, hypothesis testing, confidence intervals, sample size calculation

### DevOps & Infrastructure
- **ci-cd-pipeline-builder**: CI/CD pipeline generation (GitHub Actions, GitLab CI), deployment strategies
- **docker-development**: Docker Compose configurations, multi-stage builds, development containers
- **terraform-patterns**: Terraform module design, state management, infrastructure composition
- **helm-chart-builder**: Kubernetes Helm chart creation, values management, chart testing
- **kubernetes-operator**: CRD validator, reconcile linter, capability auditor, operator best practices
- **secrets-vault-manager**: Secrets management, rotation policies, access control, vault migration
- **env-secrets-manager**: Environment-based secrets management, .env file audit, secret scanning
- **chaos-engineering**: Experiment designer, blast-radius calculator, postmortem generator, resilience testing
- **slo-architect**: SLO/SLI/error-budget design per Google SRE Workbook, multi-window burn-rate alerts
- **feature-flags-architect**: Flag debt scanner, rollout planner, kill-switch audit, flag lifecycle management
- **observability-designer**: Observability stack design, metrics/logs/traces, dashboard patterns, alerting
- **performance-profiler**: Performance analysis, bottleneck detection, optimization recommendations
- **runbook-generator**: Incident runbook generation, playbook templates, escalation procedures
- **migration-architect**: System migration planning, legacy-to-modern patterns, data migration strategies
- **monorepo-navigator**: Monorepo structure analysis, dependency graph, build optimization
- **spec-driven-workflow**: Specification-driven development, OpenAPI/Swagger workflows, contract testing
- **codebase-onboarding**: Codebase comprehension, documentation generation, onboarding guides
- **focused-fix**: Surgical bug fixing with minimal diff, regression prevention, test supplementation
- **browser-automation**: Playwright/Selenium automation, end-to-end test generation, visual regression
- **api-test-suite-builder**: API test generation, contract testing, performance test design
- **full-page-screenshot**: Automated page capture, visual diff, responsive breakpoints
- **changelog-generator**: Conventional commit parsing, changelog generation, release notes
- **dependency-auditor**: Dependency analysis, vulnerability scanning, license compliance, upgrade planning
- **database-designer**: Database schema design, normalization, indexing strategy, migration planning
- **database-schema-designer**: Schema design patterns, migration scripts, foreign key analysis, index optimization
- **sql-database-assistant**: SQL query optimization, query plan analysis, schema refactoring
- **data-quality-auditor**: Data quality assessment, profiling, anomaly detection, cleansing patterns
- **tc-tracker**: Task context tracker with lifecycle, handoff format, JSON schema, 5 Python tools
- **tech-debt-tracker**: Technical debt quantification, prioritization, remediation planning
- **git-worktree-manager**: Parallel workspace management, worktree lifecycle, branch synchronization
- **self-eval**: Honest AI work quality evaluation, two-axis scoring, score inflation detection
- **skill-tester**: Skill functionality testing, validation workflows, smoke test automation
- **skill-security-auditor**: Security audit of skill packages, permission analysis, supply chain checks
- **ship-gate**: Pre-production audit (89 checks across 8 categories), release readiness verification
- **mcp-server-builder**: MCP server construction, tool definition, capability negotiation
- **rag-architect**: RAG pipeline design, embedding strategy, chunking optimization, retrieval evaluation
- **pr-review-expert**: PR review automation, change impact analysis, review checklist generation
- **interview-system-designer**: System design interview preparation, whiteboard patterns, evaluation criteria
- **universal-scraping-architect**: Web scraping architecture, anti-bot evasion, extraction pipeline design
- **workflow-builder**: Workflow engine design, state machine patterns, saga orchestration, retry policies
- **handoff**: Conversation-continuity generator (Matt Pocock 5-emphasis template, artifact deduplication)
- **grill-me**: Relentless plan interrogator — decision-tree extraction, forcing-question generation, session tracking
- **grill-with-docs**: Docs-anchored grilling — one question per turn, recommended answer, canon citation
- **write-a-skill**: Skill-author meta-skill — Matt's 3-phase workflow, 6-item review checklist validators
- **skillopt-sleep**: Nightly self-improvement cycle: harvest transcripts → mine tasks → replay → gate → adopt
- **code-tour**: Code walkthrough generation, tutorial creation, guided codebase exploration
- **demo-video**: Demo video script and storyboard generation, screen recording guide
- **minimalist**: Minimal viable code patterns, YAGNI enforcement, complexity reduction

## Key Patterns

### Matt Pocock Discipline
Every engineering skill ships a forcing-question library: 5-7 questions walked one at a time, each with a recommended answer and canon citation. The 6-item write-a-skill review checklist (description trigger pattern, structure completeness, tools presence, workflows documented, references citing 5+ sources, assets available) is BLOCKING for post-v2.6.0 skills and ADVISORY for legacy. The 7-sentence handoff format (Goal, State, Decisions, Skills — with `— why`, Artifacts — paths only and deduplicated, Redaction — 17 regex patterns for secrets, Next) is preserved verbatim from upstream and enforced by a self-check script (exit 1 on high-severity findings). SessionStart auto-loads the latest handoff; SessionEnd reminds if no handoff in 30 minutes. Token-compression (caveman) targets 20-50% reduction typical, 75% upper bound, with auto-clarity exception for code blocks and configurable exception zones. Grill-me extracts decision trees (6 branch kinds) and generates forcing questions with dependency-aware ordering via JSON-backed multi-day session tracking. Grill-with-docs walks one question per turn with a recommended answer and a canon citation — never fuzzy validation.

### Karpathy-Coder Validation
100/100 complexity score enforced across all Python tools (0 findings policy from complexity_checker + diff_surgeon). Assumptions surfaced upfront before code is written. Verifiable success criteria locked before implementation begins. Surgical scope — never edit unrelated files; no scope creep. Deterministic tool logic over pattern-match prose. Kill criteria documented in every recommendation. The autoresearch-agent extends this to a file-optimization loop: locked evaluator measures improvement against ground-truth data, loop edits the same input file repeatedly until the evaluator passes, ground-truth data prevents regressions. Used across c-level-advisor skills (VPE, CCO, CAIO, CDO) as the quality gate before merge.

### context: fork Orchestration
Orchestrator skills use `context: fork` to chain sub-skills deterministically. A classifier scores input signals across lanes using weighted heuristics (e.g., filename hints 2pts each, content signals 1pt each). Silent-routes when winner confidence >= 3 AND (runner-up = 0 OR winner >= 2x runner-up). Below threshold: asks one forcing question with a recommended answer, never guesses. Pre-flight refusals gate on input validity (e.g., < 100 lines refuses per Shihipar's threshold), configuration state (design-system not onboarded), and writable output. Never silently chain converters — a route explainer enforces transparency by documenting every routing decision. Used by business-operations/, commercial/, research-ops/, markdown-html/, and product-team/ orchestrators.

### agent-harness
Unified agent loop introduced in v2.11.0: goal intake → decomposition into verifiable tasks → execution with domain's own stdlib tools → verification via subprocess (prevents verification theater — the controller runs checks itself, never trusting the tool) → retry within capped attempts → human escalation on exhausted budgets → refuse close while any task remains unverified. 3 stdlib tools: harness_manifest_builder.py (scans domain folder → manifest.v1 JSON with skill/tool metadata and agentic signals), goal_compiler.py (goal + manifest → plan.v1 via deterministic keyword scoring; refuses vague goals exit 3 with forcing questions, no-match exit 4 with nearest candidates), loop_controller.py (JSON-backed init/next/record/verify/close/status state machine with atomic state writes via os.replace). 6-dimension AR rubric: goal intake, decomposition, deterministic execution, verification, loop discipline, close-out. 18 committed per-domain manifests under assets/harnesses/. Audit of both engineering folders scored 26 HARNESS-READY, 39 LOOP-CAPABLE, 43 TOOL-ONLY, 7 PROSE-ONLY. Headline gap: AR5 (loop discipline) — a one-sentence iteration-cap sweep across ~15 skills would roughly double HARNESS-READY skills.

## How to Use

Load this skill when starting any engineering task — it activates all 79 sub-skills as available context for the agent. Choose the specialist skill(s) matching the task at hand, then read its individual SKILL.md for detailed tool usage, workflows, reference guides, and forcing questions.

**Routing:** Use `/cs:*` slash commands when available (e.g., `/cs:harness <domain> <goal>`, `/cs:architect`, `/cs:fullstack`). Orchestrator agents (cs-pm-orchestrator, cs-product-orchestrator, cs-markdown-html-orchestrator, etc.) automatically route goals to the right sub-skill.

**Complex goals:** Apply the agent-harness pattern: decompose into verifiable tasks → execute with the appropriate specialist skill → verify each task with machine-run checks → retry within iteration caps → escalate to human on exhausted budgets → close only when verified or explicitly waived.

**Tool conventions:** All Python scripts use stdlib only — no dependencies beyond Python 3.8+. Every tool supports `--help` and `--sample` for deterministic smoke testing. Tools output both human-readable and JSON formats. No ML/LLM calls in scripts (one documented exception: skillopt-sleep's backend.py shells out to claude/codex CLIs when a non-mock backend is selected).

**Quality gates:** Each skill must pass the 6-item write-a-skill checklist. Forcing questions must be answered one at a time. Assumptions must be surfaced before code. Every recommendation must have named human owners and explicit confidence levels.

## Forcing Questions

When the goal is ambiguous, work through these questions one at a time — do not present them as a list. Each has a recommended answer direction and a canon anchor. Wait for the user's answer before proceeding to the next.

1. **What specific problem are you solving, and how do you measure success?** — Define the observable outcome and the metric that confirms it. Without a success metric, the task scope is unbounded. *Canon: Matt Pocock's "What are we actually trying to achieve?" forcing discipline.*

2. **What's the simplest architecture that solves this?** — Default to minimal. Every layer, service, dependency, and abstraction must justify its existence against the current problem (not future hypotheticals). YAGNI over "we might need it later." *Canon: Karpathy's "100 lines of code is better than 200 lines of code" simplicity principle.*

3. **What assumptions are you making that could be wrong?** — Surface every hidden assumption explicitly: traffic volume, data velocity, user behavior, team composition, timeline. Label each as VALIDATED / UNTESTED / SPECULATIVE. Untested assumptions are risks, not facts. *Canon: Charlie Munger's inversion principle — solve the problem backwards by identifying what would make it fail.*

4. **What does 'done' look like — what's the delivery artifact?** — Name the exact deliverable: a PR, a diagram, a runbook, a deployed service, a decision record. Ambiguous "done" is the root cause of most scope creep and the #1 failure mode of agentic loops. *Canon: agent-harness G5 close-refusal gate — unverified tasks block completion.*

5. **Who's the human responsible for this decision, and what information do they need to make it?** — Every engineering decision has a named owner. Surface the tradeoffs, options with costs, and recommendation with confidence level — never present a single option as fact. *Canon: research-ops named-owner discipline — every verdict names the human who owns it.*

6. **What's the bottleneck in your current approach?** — Identify the constraint (people, tooling, data, process, knowledge). Decide whether to elevate it (add capacity) or design around it (change the approach). Ignoring the bottleneck guarantees the new design optimizes the wrong thing. *Canon: Goldratt's Theory of Constraints — the bottleneck governs system throughput.*

7. **Are you solving the right problem?** — Before committing to a solution, verify the problem statement against the user's actual need. The most expensive bug is building the right answer to the wrong question. *Canon: "The Five Whys" root-cause analysis — the stated problem is rarely the real problem.*

## Source & Attribution

This skill pack is derived from the **claude-code-skills v2.11.2** repository (formerly claude-code-skills), authored by Alireza Rezvani and contributors, distributed under MIT license. The source repository contains 362 production-ready skills across 18 domains with 644 Python automation tools, 741 reference guides, 102 agents, and 116 slash commands as 88 marketplace plugins.

**Engineering domain breakdown in source:** engineering/ (81 POWERFUL-tier advanced skills including AgentHub, autoresearch-agent, self-eval, llm-wiki, tc-tracker, ship-gate, slo-architect, write-a-skill, caveman, grill-me, handoff, agent-harness) and engineering-team/ (51 core engineering skills including the senior-* role series, security suite, Playwright Pro, Self-Improving Agent, a11y-audit, Snowflake development, cloud architects, epic-design).

**Vendored components:** engineering/skillopt-sleep/ is vendored from microsoft/SkillOpt (MIT, © Microsoft Corporation / Yifan Yang) with 23 deviations after 10 rounds of adversarial review. engineering/caveman/, engineering/grill-me/, engineering/grill-with-docs/, engineering/handoff/ are derived from Matt Pocock's open-source work (MIT). engineering/karpathy-coder/ is derived from Andrej Karpathy's coder discipline.

**Key versions:** v2.11.2 (skillopt-sleep), v2.11.1 (PM/product agent-harness), v2.11.0 (agent-harness + AR audit), v2.10.x (markdown-html domain), v2.9.0 (research-ops), v2.8.x (business-operations, commercial, handoff, andreessen), v2.7.3 (AEO + security-guidance), v2.7.0 (13 megaprompt-to-skill conversions), v2.6.0 (4 Matt Pocock productivity skills).

## Development Conventions

**Python scripts:** stdlib-only, CLI-first with argparse, support both `--help` and `--sample` flags, output both human-readable and JSON formats, no ML/LLM calls (single documented exception: skillopt-sleep backend.py). No build system or test frameworks — intentional for portability.

**SKILL.md conventions:** YAML frontmatter with `name`, `description`, `license`, `metadata`, and optional `version`/`author`/`tags`/`agents`. Description uses trigger patterns ("Use when...", "Use before/during/after..."). Trigger phrases section lists invocation patterns. Tools section documents each script with purpose, usage, and sample output.

**Plugin structure (for ClawHub publishing):** `plugin.json` requires `skills` array with `./`-prefixed paths relative to plugin root. Two approved extension fields: `source` (Path-B megaprompt provenance) and `attribution` (MIT-licensed derivative credit). Rate limit: 5 new skills per hour. Never rename repo folders to match registry slugs.
