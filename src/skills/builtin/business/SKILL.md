---
name: "business"
description: "Business domain skill pack covering Business Growth, Business Operations, Commercial, Finance, Product, and Project Management skills. Use for business strategy, operations, finance, product management, and project delivery tasks."
license: MIT
metadata:
  version: 1.0.0
  author: Wrivon
  category: business
  updated: 2026-07-19
  source: "claude-code-skills v2.11.2 (extracted)"
---

# Business Domain Skills

## Overview

This skill pack provides a full-spectrum business domain capability covering six verticals — Business Growth, Business Operations, Commercial, Finance, Product Team, and Project Management. Each skill is designed as a contextual agent that can be forked, composed, or chained inside a delivery loop. The pack enforces governance via forced question libraries, orchestrator-to-worker fork patterns, and stage-gated delivery loops.

---

## Business Growth

Skills focused on acquiring, retaining, and growing revenue from customers through systematic motions.

| # | Skill | Description |
|---|-------|-------------|
| 1 | customer-success | Drive adoption, retention, and expansion by mapping customer health scores, QBRs, and escalation paths. Uses forced-library questions for churn risk assessment. |
| 2 | sales-engineering | Technical discovery, demo scripting, PoC design, and competitive win/loss analysis. Forked from orchestrator to produce solution artifacts. |
| 3 | revenue-operations | RevOps process orchestration across CRM (SFDC/HubSpot), quote-to-cash, territory planning, and commission modelling. Enforces data hygiene gates. |
| 4 | growth-strategy | TAM/SAM/SOM sizing, growth-channel modelling, viral-coefficient analysis, and unit-economics-led expansion playbooks. |
| 5 | partner-ecosystem | Co-sell motions, alliance GTM planning, marketplace listing optimisation, and partner tiering with MDF co-op管理. |

---

## Business Operations

Skills for designing, running, and optimising the internal machinery of the business.

| # | Skill | Description |
|---|-------|-------------|
| 1 | orchestrator | Master fork-point agent. Receives a business prompt, decomposes into sub-tasks, forks worker skills, and reconciles outputs. Enforces the delivery-loop gate checklist before handoff. |
| 2 | process-mapper | Maps as-is/to-be process flows using BPMN or SIPOC. Generates RACI charts, control-gap registers, and handoff heatmaps. |
| 3 | vendor-management | Vendor selection (RFx scoring), SLA negotiation, performance scorecarding, and offboarding runbooks. |
| 4 | capacity-planner | Headcount modelling, shift/utilization forecasting, skills-gap analysis, and org-scaling scenario planning. |
| 5 | internal-comms | Drafts all-hands decks, change-management bulletins, executive memos, and team pulse-survey instruments. |
| 6 | knowledge-ops | Designs knowledge-base taxonomies, creates standard operating procedures (SOPs), manages content lifecycle, and audits knowledge gaps. |
| 7 | procurement-optimizer | Strategic sourcing, total-cost-of-ownership (TCO) modelling, supplier consolidation analysis, and automated PO reconciliation. |

---

## Commercial

Skills for pricing, deal execution, partnership strategy, and commercial policy.

| # | Skill | Description |
|---|-------|-------------|
| 1 | orchestrator | Shared orchestrator for the Commercial vertical. Forks pricing, deal, partnership, policy, and forecasting workers. Holds the commercial forced-question library. |
| 2 | pricing-strategist | Value-based pricing, packaging / tiering design, price-sensitivity testing (Van Westendorp / Conjoint), discount-banding policy. |
| 3 | deal-desk | Deal-structuring approval workflows, discount-authority matrix enforcement, margin-safeguard checks, and quote generation. |
| 4 | partnerships-architect | Partnership vehicle design (resell, referral, embed, OEM), go-to-market joint business plans, and co-innovation roadmap alignment. |
| 5 | channel-economics | Channel margin waterfall, deal-registration compliance, partner incentives / rebates, and indirect revenue forecasting. |
| 6 | commercial-policy | Terms-of-sale library, return/refund policy, price-change governance, and jurisdiction-specific commercial clauses. |
| 7 | rfp-responder | RFP/RFI content library management, compliance matrix generation, win-theme mapping, and response-quality scoring. |
| 8 | commercial-forecaster | Pipeline coverage analysis, weighted / commit / upside forecasting, scenario modelling, and board-report narrative generation. |

---

## Finance

Skills for financial analysis, valuation, planning, and SaaS-specific metric rigour.

| # | Skill | Description |
|---|-------|-------------|
| 1 | financial-analysis | Financial statement analysis, ratio calculation, trend & variance analysis, and management-report automation. |
| 2 | dcf-valuation | Discounted cash flow modelling, WACC derivation, terminal-value calculation, and sensitivity / scenario tables. |
| 3 | budgeting | Annual budgeting, rolling forecast integration, zero-based budgeting, and variance vs. actual tracking with driver-based inputs. |
| 4 | forecasting | Revenue waterfall, expense-driver modelling, cash-flow forecasting, and scenario / what-if analysis. Integrates with commercial-forecaster. |
| 5 | saas-metrics | ARR/NRR/GRR, LTV:CAC, payback period, magic number, burn multiple, rule-of-40, cohort retention, and dashboard construction. |

---

## Product Team

Comprehensive product-management and product-design skills covering the full product development lifecycle.

| # | Skill | Description |
|---|-------|-------------|
| 1 | product-strategy | Product vision / mission framing, strategic-context docs, competitive positioning (Porter's Five Forces, Value Stick), and roadmap narrative. |
| 2 | product-roadmapping | Now-Next-Later roadmaps, theme-based GTM timelines, dependency mapping, and stakeholder-alignment cadences. |
| 3 | user-story-crafting | Story-splitting patterns (SPIDR, INVEST), acceptance-criteria writing (Gherkin), story-mapping, and backlog-refinement facilitation. |
| 4 | ux-research | User interview protocols, contextual inquiry, usability-testing scripts, survey design (Sus/SEQ/NPS), and research-repo synthesis. |
| 5 | saas-scaffolding | SaaS best-practices scaffolding: sign-up flows, onboarding sequences, billing integration (Stripe/Chargebee), multi-tenant architecture decisions, and self-serve vs. sales-led considerations. |
| 6 | apple-hig-expert | Deep expertise in Apple Human Interface Guidelines. Audits designs against HIG patterns (navigation bars, sheets, menus, gestures, SF Symbols, materials, typography). Generates platform-conformant UI specs. |
| 7 | a11y-accessibility | WCAG 2.2 AA/AAA audit, ARIA labelling, keyboard-navigation flows, colour-contrast testing, and assistive-technology compatibility reviews. |
| 8 | rice-prioritization | RICE scoring (Reach, Impact, Confidence, Effort) with recalibration heuristics, score-normalisation, and prioritisation-grid visualisation. |
| 9 | okr-definition | OKR writing workshops, key-result type-balance (input/output/outcome), stretch-goal calibration, and quarterly scrub facilitation. |
| 10 | hypothesis-driven-development | Hypotheses formulation (We believe [X] will achieve [Y] because [Z]), experiment-design briefs, and learning-velocity tracking. |
| 11 | analytics-and-metrics | Product-analytics taxonomy (amplitude/mixure/pendo), event schema design, funnel & retention analysis, and KPI-tree construction. |
| 12 | a-b-testing | Test-design power analysis, randomisation-unit selection, minimum-detectable-effect sizing, and statistical-significance interpretation. |
| 13 | competitive-analysis | Competitive feature matrices, positioning maps, battle cards, war-gaming exercises, and ongoing-market-monitoring cadences. |
| 14 | product-discovery | Discovery-framework selection (Jobs-to-be-Done, Design Thinking, Dual-Track Agile), opportunity-solution trees, and assumption-mapping. |
| 15 | stakeholder-management | Stakeholder mapping (Power/Interest grid), communication plans, escalation paths, and alignment-artefact generation. |
| 16 | api-product-design | REST / GraphQL API product design, developer-experience (DX) principles, API versioning strategy, and public-doc specification. |
| 17 | product-launch | Launch-readiness checklists, phased-rollout plans, internal-enablement sequencing, go-to-market asset briefs, and post-launch retrospective templates. |

---

## Project Management

Skills for project delivery, tooling, governance, and cross-functional coordination.

| # | Skill | Description |
|---|-------|-------------|
| 1 | pm-foundations | PM methodology selection (Waterfall / Agile / Hybrid), project charter creation, work-breakdown-structure (WBS) decomposition, critical-path analysis, and RAID log management. |
| 2 | jira-mcp | Jira MCP integration for issue CRUD, sprint-management automation, advanced JQL querying, custom-field manipulation, and dashboard-as-code generation. |
| 3 | confluence | Confluence page-tree management, template creation, space-permission modelling, and automated documentation publishing via MCP. |
| 4 | delivery-loop-governance | Stage-gate review protocol: gate-entry criteria checklists, exit-signoff artefacts, phase-transition notifications, and governance-forum preparation. Core to the delivery-loop pattern. |
| 5 | agile-scrum | Scrum-ceremony facilitation (sprint planning, daily stand-up, review, retro), story-point estimation (planning poker), velocity tracking, and team-agreement drafting. |
| 6 | risk-management | Risk-identification workshops, probability/impact matrix construction, mitigation-plan tracking, and risk-burndown monitoring. |
| 7 | stakeholder-communication | Status-report automation, RAG-report generation, executive-summary drafting, and communication-plan adherence tracking. |
| 8 | milestone-tracking | Milestone-dependency mapping, slippage-detection heuristics, critical-chain buffer management, and milestone-completion dashboards. |
| 9 | resource-allocation | Resource-loading plans, overallocation detection, capacity-levelling suggestions, and role-based demand-vs-capacity heatmaps. |

---

## Key Patterns

### Fork Orchestrators

Each vertical (Business Growth, Business Operations, Commercial, Finance, Product Team, Project Management) exposes an `orchestrator` skill that acts as the entry point. The orchestrator:

1. Receives a natural-language business prompt.
2. Decomposes it into sub-tasks using a forced question library.
3. Forks specialised worker skills (e.g., `pricing-strategist`, `customer-success`) in parallel.
4. Reconciles outputs into a unified deliverable.
5. Passes through a delivery-loop gate before returning.

Orchestrators can be nested — a Commercial orchestrator may fork a Pricing worker, which itself forks a `saas-metrics` finance worker for unit-economics inputs.

### Forced Question Libraries

Each orchestrator skill carries a YAML or JSON library of forcing questions that must be answered before decomposition proceeds. Examples:

- **Commercial orchestrator:** "What is the deal size range? Is discount authority matrix defined? What jurisdiction governs terms?"
- **Product orchestrator:** "What is the confidence level in the problem statement? Has customer discovery been conducted? Are OKRs defined for this initiative?"
- **Finance orchestrator:** "Is this a recurring or one-time model? What discount rate assumption is being used? Is ARR recognised upfront or over term?"

These questions prevent premature solutioning and ensure every fork produces context-rich worker prompts.

### Delivery Loop Gates

Every skill output passes through a delivery loop — a structured review protocol with three gates:

1. **Gate 1 — Completeness:** All required sections exist; forced questions are addressed.
2. **Gate 2 — Consistency:** Artefacts are internally coherent and cross-references resolve.
3. **Gate 3 — Approval:** Sign-off from relevant stakeholder (simulated or real) is captured.

Gate failures loop back to the orchestrator with an amendment prompt. Gate passes return the artefact to the caller.

---

## Forcing Questions

These questions are asked at the start of any business-domain engagement to frame scope, constraints, and success criteria:

1. **What is the primary domain and sub-domain?** (e.g., Commercial / Pricing, Finance / SaaS-Metrics, Product / Roadmapping) — This determines which orchestrator and which workers are forked.

2. **Who is the audience and what is the deliverable format?** (e.g., Board presentation, internal SOP, client-facing RFP response, executive memo) — This controls tone, level of detail, and gate criteria.

3. **What are the hard constraints?** (Deadline, budget, headcount, regulatory jurisdiction, data availability) — Constraints are passed into every worker prompt and used by the orchestrator to prune infeasible branches.

4. **What decision or action should the deliverable unlock?** (e.g., approve budget, select vendor, set price, prioritise feature, commence build) — Every deliverable is judged against whether it enables this decision.

5. **What existing artefacts can be referenced?** (Existing decks, financial models, CRM exports, research reports, policy documents) — Avoids rework and anchors the output in the organisation's current state.

6. **What is the confidence threshold for recommendations?** (Low / Medium / High) — Controls how conservatively scenarios are presented and whether sensitivity analysis is required before a recommendation is made.
