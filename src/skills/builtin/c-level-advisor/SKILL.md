---
name: "c-level-advisor"
description: "C-Level advisory skill pack covering 68 executive advisory skills across the full C-suite: CEO, CFO, CTO, CMO, CPO, CRO, COO, CHRO, CISO, GC, CDO, CAIO, CCO, VPE, plus founder-mode and executive-mentor skills. Use for any strategic business decision."
license: MIT
metadata:
  version: 1.0.0
  author: Wrivon
  category: c-level-advisor
  updated: 2026-07-19
  source: "claude-code-skills v2.11.2 (extracted)"
---

# C-Level Advisor Domain Skills

## Overview

A complete virtual board of directors: 68 skills covering 14 executive roles, orchestration, cross-cutting capabilities, culture & collaboration frameworks, executive mentor adversarial thinking, founder-mode agent routing, and a strategic sprint pipeline. Every skill is opinionated, framework-backed, and designed to produce actionable output — not generic advice.

The architecture routes founder questions through a Chief of Staff dispatcher, convenes multi-role board meetings for complex decisions, logs decisions in two-layer memory, and closes the loop with honest post-mortems scored against pre-committed criteria. Each C-role skill ships Python analysis tools (stdlib-only), reference docs citing 5+ authoritative sources, and forcing-question libraries that prevent fuzzy inputs from producing confident-sounding wrong answers.

## Executive Role Skills

### CEO Advisor
Strategic leadership frameworks for vision, fundraising, board management, culture, and stakeholder alignment. Covers capital allocation, crisis management, succession planning, and executive decision-making using Tree of Thought reasoning. Python tools: `strategy_analyzer.py`, `financial_scenario_analyzer.py`.

### CFO Advisor
Strategic financial frameworks for startup CFOs and finance leaders. Numbers-driven, decisions-focused. Covers burn rate and runway modeling (base/bull/bear), unit economics (LTV, CAC, payback), fundraising strategy, dilution modeling, cap table management, and board financial packages. Chain of Thought reasoning. Python tools: `burn_rate_calculator.py`, `unit_economics_analyzer.py`, `fundraising_model.py`.

### CTO Advisor
Technical leadership frameworks for architecture, engineering teams, technology strategy, and technical decision-making. Covers technical debt assessment and prioritization, team scaling optimization, ADR framework, technology vendor evaluation, DORA metrics, build-vs-buy analysis, cloud migration, platform engineering, and AI/ML strategy. ReAct reasoning. Python tools: `tech_debt_analyzer.py`, `team_scaling_calculator.py`.

### CMO Advisor
Strategic marketing leadership — brand positioning, growth model design (PLG vs sales-led vs community-led), marketing budget allocation, channel mix, and marketing org design. Not campaign execution or content creation. Recursion of Thought reasoning. Python tools: `marketing_budget_modeler.py`, `growth_model_simulator.py`.

### CPO Advisor
Strategic product leadership — product vision, portfolio strategy, product-market fit measurement, product org design, and roadmap prioritization. Covers PMF scoring, portfolio analysis (invest/maintain/kill), BCG matrix, Jobs to Be Done, category design, and product trio organization. First Principles reasoning. Python tools: `pmf_scorer.py`, `portfolio_analyzer.py`.

### CRO Advisor
Revenue frameworks for building predictable, scalable revenue engines from $1M ARR to $100M+. Covers revenue forecasting, sales model design (PLG, sales-led, enterprise), pricing strategy, NRR/GRR analysis, pipeline coverage, quota design, ramp time, territory planning, and MEDDPICC. Chain of Thought reasoning. Python tools: `revenue_forecast_model.py`, `churn_analyzer.py`.

### COO Advisor
Operational frameworks and tools for turning strategy into execution, scaling processes, and building the organizational engine. Covers process design, OKR execution, operational cadence, bottleneck analysis, meeting rhythm, and lean operations. Step by Step reasoning. Python tools: `ops_efficiency_analyzer.py`, `okr_tracker.py`.

### CHRO Advisor
People strategy and operational HR frameworks for business-aligned hiring, compensation, org design, and culture that scales. Covers hiring plan modeling, compensation benchmarking, salary bands, equity design, career ladders, org structure, spans of control, retention, performance management, and succession planning. Empathy + Data reasoning. Python tools: `hiring_plan_modeler.py`, `comp_benchmarker.py`.

### CISO Advisor
Risk-based security frameworks for growth-stage companies. Quantify risk in dollars (ALE, SLE, ARO), sequence compliance for business value (SOC 2, ISO 27001, HIPAA, GDPR), zero trust architecture, incident response leadership, vendor risk assessment, and board-level security reporting. Risk-Based reasoning. Python tools: `risk_quantifier.py`, `compliance_tracker.py`.

### General Counsel (GC) Advisor
Strategic legal frameworks for startup General Counsels and founders without one. Covers contract risk scanning (MSA, SaaS, NDA, DPA, employment), term sheet analysis (12-dimension scoring, founder-friendly defaults), IP strategy, regulatory landscape mapping (HIPAA, GDPR, FDA, fintech), and outside counsel engagement. Not a substitute for licensed counsel — surfaces the right questions. Risk-Based reasoning. Python tools: `contract_risk_scanner.py`, `term_sheet_analyzer.py`.

### Chief Data Officer (CDO) Advisor
Strategic data leadership for startup CDOs. Covers AI training data rights and consent provenance (origin × class × use-case matrix with GDPR/EU AI Act citations), data product strategy (warehouse vs lakehouse vs mesh, 6-layer build-vs-buy), B2B customer-data-as-asset valuation and M&A readiness, and data team org evolution. Decision-Driven reasoning. Python tools: `ai_training_data_audit.py`, `data_product_strategy_picker.py`, `data_asset_valuator.py`.

### Chief AI Officer (CAIO) Advisor
Strategic AI leadership for startup CAIOs. Covers model build-vs-buy decisions (API vs fine-tune vs in-house with 3-year TCO), AI risk classification under EU AI Act (Article-level citations) + US state patchwork (NYC Law 144, CO AI Act, IL HB 53, CA SB 1001), AI cost economics (API vs self-hosted breakeven with 2026 pricing, GPU utilization reality), and AI team org evolution (5-stage role map, 7 anti-patterns). Eval-Demanding reasoning. Python tools: `model_buildvsbuy_calculator.py`, `ai_risk_classifier.py`, `ai_cost_economics.py`.

### Chief Customer Officer (CCO) Advisor
Strategic customer leadership for startup CCOs. Covers retention decomposition (GRR vs NRR honesty, 7-category churn root-cause taxonomy), customer segmentation strategy (4-tier design, ICP fit scoring 0-10 across 7 weighted signals), CS team coverage model (pooled vs named CSM thresholds, ratio math, 12-month hiring plan), and CS team org evolution (CS vs Support vs AM distinctions). Retention-Obsessed reasoning. Python tools: `retention_decomposition_analyzer.py`, `customer_segmentation_designer.py`, `cs_coverage_calculator.py`.

### VPE Advisor
Strategic engineering operations leadership for startup VPEs. Covers delivery throughput (DORA 4 metrics with Elite/High/Medium/Low per metric, bottleneck identification), engineering hiring funnel (7-stage math, healthy/leaky per stage, pipeline gap), engineering team structure (squad/tribe/chapter design, tech-lead manager-trigger thresholds, director-trigger at 50+), and production discipline (on-call, deployment cadence, postmortem culture). Throughput-First reasoning. Python tools: `delivery_throughput_analyzer.py`, `eng_hiring_funnel_calculator.py`, `eng_team_structure_designer.py`.

### Company Architect
Senior chief of staff who combines business strategist, CFO, CMO, COO, and systems architect into a single agent. Guides founders through a 12-phase interview (foundation, strategy, market, financial, sales, marketing, product, operations, tech, people, legal, governance) and generates the company as an OKF bundle — a tree of version-controllable .md files with frontmatter types, cross-linked into a graph readable by humans and AI agents alike. Python tools: `scaffold_bundle.py`, `okf_linter.py`, `index_generator.py`.

## Orchestration Skills

### C-Suite Onboard (cs-onboard)
Structured founder interview that captures company context across 7 dimensions and builds `~/.claude/company-context.md` — the persistent context file powering every C-suite advisor. Invoked via `/cs:setup` for initial interview (~45 min) or `/cs:update` for quarterly refresh. One conversation, persistent context across all roles.

### Chief of Staff
The orchestration layer between founder and C-suite. Routes founder questions to the right advisor role(s), triggers multi-role board meetings for complex decisions, synthesizes outputs, and tracks decisions in the decision log. Every C-suite interaction starts here. Loads company context automatically.

### Board Meeting
Multi-agent board meeting protocol for strategic decisions. Runs a structured 6-phase deliberation: (1) context loading, (2) independent C-suite contributions with Phase 2 isolation (no cross-pollination), (3) devil's-advocate critic analysis, (4) synthesis, (5) founder review and approval, (6) decision extraction to two-layer memory. Prevents groupthink and captures minority views.

### Decision Logger
Two-layer memory architecture for board meeting decisions. Layer 1 stores raw transcripts (everything). Layer 2 stores only what the founder approved. Future meetings read Layer 2 only — prevents hallucinated consensus from past debates bleeding into new deliberations. Python tool: `decision_tracker.py`.

### Agent Protocol
Inter-agent communication protocol for C-suite agent teams. Defines invocation syntax, loop prevention rules, agent isolation rules, response formats, and the internal quality loop (self-verify → peer-verify → critic pre-screen → present). No unverified output reaches the founder.

### Context Engine
Loads and manages company context for all C-suite advisor skills. Reads `~/.claude/company-context.md`, detects stale context (>90 days), enriches context during conversations, enforces privacy/anonymization rules before external API calls, and provides context refresh triggers.

## Cross-Cutting Capabilities

### Board Deck Builder
Assembles comprehensive board and investor update decks by pulling perspectives from all C-suite roles. Covers structure, narrative framework, bad news delivery, common mistakes, and per-section owners. Every section has a narrative and a "so what."

### Scenario War Room
Cross-functional what-if modeling for cascading multi-variable scenarios. Unlike single-assumption stress testing, models compound adversity across all business functions simultaneously. Covers scenario identification, cross-impact mapping, pre-mortem analysis, and contingency plan generation. Python tool: `scenario_modeler.py`.

### Competitive Intel
Systematic competitor tracking that feeds CMO positioning, CRO battlecards, and CPO roadmap decisions. Covers competitor identification, signal monitoring framework, battlecard template, win/loss analysis, positioning against alternatives, and CI-driven decision framework.

### Org Health Diagnostic
Cross-functional organizational health check combining signals from all C-suite roles. Scores 8 dimensions on a traffic-light scale (green/yellow/red) with drill-down recommendations and industry benchmarks. Surfaces problems you don't know you have. Python tool: `health_scorer.py`.

### M&A Playbook
Frameworks for both sides of M&A: acquiring companies and being acquired. Covers acquisition strategy, due diligence checklist, valuation approaches, LOI and term sheet evaluation, earnout structures, integration planning, and acqui-hire playbook.

### International Expansion
International market expansion strategy. Covers market selection (scoring matrix), entry modes (direct, partner, JV, acquisition), localization framework, regulatory compliance by region, go-to-market design, and regional team building.

## Culture & Collaboration Skills

### Culture Architect
Build, measure, and evolve company culture as operational behavior — not wall posters. Covers mission/vision/values workshops, values-to-behaviors translation, culture code creation, culture health assessment, and cultural rituals by company stage. Culture is what you DO, not what you SAY.

### Company OS
The meta-framework for how a company runs — the connective tissue between all C-suite roles. Covers operating system selection (EOS, Scaling Up, OKR-native, hybrid), accountability charts, scorecards, meeting pulse (L10, weekly, quarterly), issue resolution (IDS), and 90-day rocks.

### Founder Coach
Personal leadership development for founders and first-time CEOs. Covers founder archetype identification, delegation frameworks, energy management, CEO calendar audits, blind spot identification, imposter syndrome, founder mental health, IC-to-executive transition, board management, and succession planning.

### Strategic Alignment
Cascades strategy from boardroom to individual contributor. Detects and fixes misalignment between company goals and team execution. Covers strategy articulation, cascade mapping, orphan goal detection, silo identification, communication gap analysis, and realignment protocols. Python tool: `alignment_checker.py`.

### Change Management
Framework for rolling out organizational changes without chaos. Covers the ADKAR model (Awareness, Desire, Knowledge, Ability, Reinforcement) adapted for startups, communication templates, resistance patterns, stakeholder mapping, change fatigue management, and adoption measurement.

### Internal Narrative
Build and maintain one coherent company story across all audiences — employees, investors, customers, candidates, and partners. Detects narrative contradictions and ensures the same truth is framed for each audience's needs.

## Strategic Sprint Pipeline

### /cs:brief — One-Page Strategy Brief
Turns a raw question or office-hours intake into a one-page strategy brief with locked options, assumptions, and success criteria. Step 1 of the strategic sprint pipeline.

### /cs:boardroom — Multi-Role Boardroom Deliberation
Runs the board-meeting skill protocol across the C-suite for a single strategy brief. 6-phase deliberation with Phase 2 isolation, critic pre-screen, synthesis, and board memo output. The heart of the multi-agent system.

### /cs:decide — Decision Logging
Logs the founder's approved decision to two-layer memory. The gate where in-session deliberation becomes durable company memory. Preserved dissent recorded alongside the decision.

### /cs:execute — 90-Day Execution Plan
Turns an approved decision into a 90-day plan with weekly milestones, named DRIs (Directly Responsible Individuals), and check-in cadence. Where most decisions die: between "we decided" and "what's next Monday?"

### /cs:post-mortem — Honest Retrospective
Closes the strategic sprint loop. Scores a decision against the success and kill criteria written *before* the decision (not retro-fitted) and revisits the preserved dissent. Rigor that compounds over time.

## Forcing-Question Office Hours

### /cs:office-hours — Six-Question Founder Interrogation
YC-style 6-question founder interrogation before any advice. Forces clarity on problem, customer, distribution, defensibility, capital, and founder fit. No analysis until the founder has done the thinking.

### /cs:cfo-review — CFO Forcing Questions
Numerate-skeptic interrogation of any plan that touches money. Six questions on unit economics, runway, dilution, capital allocation, and ROI before any spend or fundraise.

### /cs:cmo-review — CMO Forcing Questions
Narrative-first interrogation of positioning, ICP, message house, and channel mix. Six questions before launching any campaign or repositioning strategy.

### /cs:cpo-review — CPO Forcing Questions
JTBD-driven interrogation of product roadmap, PMF signal, and portfolio focus. Six questions to surface what to ship and what to kill before quarterly commitment.

### /cs:cro-review — CRO Forcing Questions
Pipeline-paranoid interrogation of revenue, win rate, NRR, and ramp time. Six questions that surface next-quarter pain this quarter before committing to revenue targets.

### /cs:cto-review — CTO Forcing Questions
Architecture-first interrogation of technical strategy, tech debt, team scaling, and engineering excellence. Six questions before any major technical commitment.

### /cs:ciso-review — CISO Forcing Questions
Risk-paranoid threat-modeler interrogation of any plan that touches data, compliance, or production access. Six questions before any change touching PII/PHI or compliance scope.

### /cs:gc-review — General Counsel Forcing Questions
Legal lens interrogation of contracts, IP, regulatory, term sheets, and employment-law surface. Six questions before any contract, term sheet, IP move, or regulatory commitment. ⚠️ Not legal advice — surfaces questions for outside counsel.

### /cs:cdo-review — CDO Forcing Questions
Decision-driven CDO pressure-test of any plan that touches training data, data architecture, data productization, or data team hiring. Six questions before any data-infrastructure commitment or ML training run.

### /cs:caio-review — CAIO Forcing Questions
Eval-demanding CAIO pressure-test of any plan involving AI: model selection, risk classification, cost economics, and AI hiring. Six questions before any AI feature ships or vendor contract is signed.

### /cs:cco-review — CCO Forcing Questions
Retention-obsessed CCO pressure-test of any plan touching customer retention, segmentation, CS team sizing, and CS hiring. Six questions before any retention claim, segmentation change, or CS expansion.

### /cs:vpe-review — VPE Forcing Questions
Throughput-first VPE pressure-test of any plan touching delivery, eng hiring, team structure, or production discipline. Six questions before any delivery commitment or hiring plan.

## Meta + Safety Skills

### /cs:founder-mode — The Auto-Router
Single command a founder needs to remember. Routes any question to the right C-role automatically, or triggers `/cs:boardroom` for multi-role topics. Keyword + intent matching dispatches to the correct advisor.

### /cs:onboard — Founder Interview
Structured 12-question founder interview that produces `~/.claude/company-context.md`. The first command to run when adopting c-level-agents. Without this, the advisors are guessing.

### /cs:cross-eval — Multi-Model Consensus
Runs the same board memo through multiple model providers (Claude + Codex + Gemini) and reconciles divergences. Use for high-stakes, irreversible decisions where single-model bias is too costly: M&A, major fundraises, layoffs, strategic pivots.

### /cs:freeze — Cooldown Lock
Locks a strategic decision for a defined cooldown period (in days). During the freeze, the chief-of-staff router refuses to re-litigate the decision unless a kill criterion explicitly triggers. Prevents impulse reversal after tough decisions.

## Executive Mentor Skills

### Executive Mentor (Base)
Not another advisor — an adversarial thinking partner. Finds the holes before your competitors, board, or customers do. C-suite skills give you frameworks; Executive Mentor gives you the questions you don't want to answer. Python tools: `decision_matrix_scorer.py`, `stakeholder_mapper.py`.

### /em:challenge — Pre-Mortem Plan Analysis
Systematically finds weaknesses in any plan before reality does. Not to kill the plan — to make it survive contact with reality. Imagine it's 12 months from now and this plan failed spectacularly; work backwards to find the failure modes.

### /em:board-prep — Board Meeting Preparation
Prepare for the adversarial version of your board, not the friendly one. Forces numbers-cold mastery, anticipates hard questions, builds a narrative that acknowledges weakness without losing the room. Every number must live in your head, not just on a slide.

### /em:hard-call — Framework for Hard Decisions
For decisions with no good options — firing a co-founder, laying off 20% of the team, killing a product customers love. Uses 10/10/10 analysis, regret minimization, and stakeholder mapping. Not to find the right answer, but the less wrong one.

### /em:stress-test — Business Assumption Stress Testing
Take any business assumption and break it before the market does. Revenue projections, market size, competitive moat, hiring velocity, customer retention. The most dangerous assumptions are the ones everyone agrees on.

### /em:postmortem — Honest Retrospective
Not blame — understanding. The failed deal, the missed quarter, the feature that flopped. Uses blameless 5-Whys analysis to find root causes, produces a change register with named owners and deadlines. Most post-mortems fail by becoming blame sessions or whitewashes; this prevents both.

## Key Patterns

### C-Level Forcing Questions
Every C-role advisor ships a forcing-question library: 5-7 questions walked one at a time, each with a recommended answer and a canon citation. Prevents skills from running on fuzzy inputs. The discipline: one question per turn, recommend an answer, cite the source.

### Matt Pocock Grill Discipline
Applied at the skill level: every strategic skill ships a "Forcing-question library" section. Questions are dependency-aware (ordered so earlier answers inform later ones). The discipline prevents confident-sounding wrong answers to poorly-framed questions.

### Decision Framework
All decisions follow: Context → Options → Analysis → Recommendation → Decision → Execution → Review. Two-layer memory preserves raw deliberation (Layer 1) separately from approved decisions (Layer 2). Dissent is preserved alongside the decision to prevent revisionist history.

### Internal Quality Loop
Self-verify → peer-verify → critic pre-screen → present. No unverified output reaches the founder. The agent protocol enforces this chain before any C-suite advisor output is delivered.

### User Communication Standard
Every output follows: Bottom Line → What → Why → How to Act → Your Decision. Results only, no process narration.

## How to Use

1. **First time**: Run `/cs:setup` (or `/cs:onboard` in c-level-agents) to complete the founder interview. This populates `~/.claude/company-context.md` with your company's facts — market, stage, metrics, team, funding.

2. **Simple questions**: Ask any strategic question. The Chief of Staff router automatically dispatches to the right C-role advisor. Each role has its own forcing-question library that sharpens fuzzy inputs.

3. **Complex decisions**: Use the strategic sprint pipeline: `/cs:brief` → `/cs:boardroom` → `/cs:decide` → `/cs:execute` → `/cs:post-mortem`. This moves from raw question → one-page brief → multi-role deliberation → logged decision → 90-day plan → honest retrospective.

4. **Pressure-testing**: Use `/cs:office-hours` for YC-style founder interrogation before major commitments. Use per-role reviews (`/cs:cfo-review`, `/cs:cro-review`, etc.) to pressure-test specific functional plans. Use `/em:challenge` for pre-mortem analysis and `/em:stress-test` for assumption breaking.

5. **High stakes**: For irreversible decisions, run `/cs:cross-eval` for multi-model consensus and `/cs:freeze` to impose a cooldown lock that prevents impulse reversal.

6. **Refresh**: Run `/cs:update` quarterly or after major events (fundraise, pivot, reorg) to keep company context current.

## Forcing Questions

1. **What decision are you making?** (If you can't state the decision in one sentence, you haven't clarified the question enough.)
2. **What information do you have, and what are you assuming?** (Label each assumption with confidence: high/moderate/low/unknown.)
3. **What would have to be true for this to be a bad decision?** (Identify kill criteria *before* committing, not after.)
4. **Who disagrees, and what's their strongest argument?** (If you can't articulate the counterargument, you don't understand your own position.)
5. **What's the cost of being wrong, and when will you know?** (Define the review checkpoint and the observable signal that triggers it.)
6. **What would you advise your strongest competitor to do in this situation?** (Removes emotional attachment and surfaces strategic truth.)
