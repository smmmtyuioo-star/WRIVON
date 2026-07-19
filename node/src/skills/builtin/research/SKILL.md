---
name: research
description: "Research domain skill pack covering enterprise Research Operations (res-ops) and Academic Research (research/) skills. Use for literature review, grant discovery, clinical study design, market sizing, user research, patent analysis, and deep research workflows."
license: MIT
metadata:
  version: 1.0.0
  author: Wrivon
  category: research
  updated: 2026-07-19
  source: "claude-code-skills v2.11.2 (extracted)"
---

# Research Domain Skills

## Overview

This pack provides a dual-track research architecture. **Research Operations (res-ops/)** serves enterprise R&D functions — clinical study design, market sizing, program finance, user research, and product discovery — treating research as a structured operational discipline. **Academic Research (research/)** serves scholarly workflows — literature reviews, grant discovery, patent landscaping, syllabus design, dossier compilation, and research pulse monitoring. Both tracks share a common orchestration layer that classifies inbound requests by signal type and routes to the appropriate sub-skill.

A third transversal layer, **deep research patterns**, spans both tracks with multi-source investigation, evidence triangulation, citation management, and structured reporting. These patterns activate automatically when the orchestrator detects requests requiring original synthesis across multiple sources rather than direct application of a single skill.

## Research Operations (Enterprise)

Five skills purpose-built for enterprise R&D teams managing clinical, commercial, and product research programs. Each encapsulates domain-specific heuristics, regulatory guardrails, and financial planning templates.

### orchestrator

The res-ops orchestrator is a fork of the shared agent-orchestration pattern, specialised for enterprise R&D routing. It inspects the inbound request against five signal classes and invokes the matching sub-skill:

- **CLINICAL** → `clinical-research`: Protocol design, endpoint selection, sample size estimation, phase-gate scoring, regulatory pathway mapping.
- **FINANCE** → `research-finance`: Program budget planning, burn-rate tracking, capex vs. opex classification, scenario modelling.
- **MARKET** → `market-research`: TAM/SAM/SOM estimation, survey sampling, segmentation analysis, competitive landscaping.
- **PRODUCT** → `product-research`: User study design, saturation planning, insight synthesis, usability test protocols.
- **DEEP** → Falls through to the deep-research skill for multi-source investigation when the request spans multiple domains or requires original evidence synthesis.

The orchestrator emits a classification record before routing: `{ signal, confidence, sub_skill, reasoning, cited_context[] }`. Confidence below 0.7 triggers a disambiguation prompt to the user.

### clinical-research

Clinical trial and study design for regulated environments. This skill provides:

**Study Design**
- Protocol structure: background, objectives, design, population, endpoints, statistical plan, data management, adverse event monitoring.
- Study type selection: RCT, crossover, adaptive, pragmatic, N-of-1, basket/umbrella/platform.
- Blinding guidance: open-label, single-blind, double-blind, triple-blind with unblinding procedures.
- Control arm selection: placebo, active comparator, historical control, dose-response, no-treatment.

**Endpoint Selection**
- Primary vs. secondary vs. exploratory endpoint hierarchy.
- Surrogate endpoint validation criteria (Prentice criteria, meta-analysis requirements).
- Composite endpoint design with component weighting and win ratio methodology.
- Patient-reported outcome (PRO) instrument selection — COSMIN checklist, FDA qualification.

**Sample Size Estimation**
- Input parameters: expected effect size, standard deviation, alpha (default 0.05 two-sided), power (0.80 minimum, 0.90 preferred for pivotal).
- Dropout adjustment: `n_adjusted = n / (1 - dropout_rate)` with tiered rates by phase and duration.
- Method selection: superiority, non-inferiority (margin justification required), equivalence.
- Software-ready output: parameter tables ready for nQuery, PASS, SAS PROC POWER, or R `pwr` / `gsDesign`.

**Phase-Gate Scoring**
Gate scoring matrix across five dimensions scored 1-5:

| Dimension | Weight | Criteria at each level |
|------------|--------|------------------------|
| Scientific merit | 25% | Hypothesis strength, mechanistic rationale, literature support |
| Feasibility | 20% | Recruitment timeline, site readiness, team expertise |
| Risk profile | 20% | Safety signals, stopping rules, DMC charter |
| Regulatory path | 20% | IND/IDE requirements, agency alignment probability |
| Commercial value | 15% | Market need, reimbursement path, competitive positioning |

Total score = `SUM(score * weight)`. Gate decisions: ≥4.0 Go, 3.0-3.9 Conditional (list conditions), <3.0 No-Go with remediation roadmap.

**Regulatory Deliverables**
- IB structure: TOC, safety reference, IMPD cross-reference.
- ICF requirements: 8 essential elements per ICH GCP E6(R2), informed consent checklist.
- DSMB/DMC charter outline: membership, stopping rules, unblinding procedures, meeting schedule.

### research-finance

Research program financial planning and oversight. This skill provides:

**Budget Structuring**
- Work breakdown structure (WBS) by phase: discovery, preclinical, Phase I/II/III, regulatory, post-market.
- Cost categories: personnel (burdened FTE), consumables, equipment (CAPEX threshold), CRO/vendor, site costs, patient stipends, regulatory filing fees, publication costs.
- Indirect cost rate application: institutional rate (federal negotiated vs. internal standard), fringe benefits, facilities & administration.

**Burn-Runway Tracking**
- Monthly actuals vs. planned burn with variance flagging (>10% = yellow, >20% = red).
- Runway calculation: `runway_months = cash_reserves / (monthly_burn + committed_obligations)`.
- Re-forecasting trigger: when runway drops below 6 months or variance triggers red, initiate re-forecast.
- Scenario modelling: base case, upside (accelerated enrollment + 25% monthly burn), downside (delayed start + 40% timeline extension).

**CAPEX vs. OPEX Classification**
Decision framework:

| Test | CAPEX if | OPEX if |
|------|----------|---------|
| Useful life | >12 months | <12 months |
| Unit cost threshold | ≥$5,000 | <$5,000 |
| Reusable | Yes | Single-use/consumable |
| Integral to asset | Necessary to put asset in service | Standalone expense |
| Maintenance | Ancillary to owned asset | Core deliverable |

Provide a completed classification table for each line item with audit trail.

**Financial Reporting Templates**
- Monthly program spend report: budget, actual, commitment, ETC, EAC, variance %.
- Capitalization schedule: asset list, in-service date, depreciation method (straight-line), useful life.
- Scenario comparison: base vs. upside vs. downside with cumulative spend curve.

### market-research

Market analysis for new product, indication, or geographic expansion decisions. This skill provides:

**Market Sizing — TAM / SAM / SOM**
- **TAM (Total Addressable Market)**: Top-down (revenue) and bottom-up (patient count × price/patient) approaches. Resolve discrepancies >20% by adjusting addressable population definition.
- **SAM (Serviceable Addressable Market)**: TAM filtered by product modality, indication subset, price band, distribution reach.
- **SOM (Serviceable Obtainable Market)**: SAM × adoption rate curve (year 1-5) based on physician adoption, formulary access, and competitive displacement.
- Output: revenue range (P10, P50, P90) by year with sensitivity tornado chart.

**Survey Sample Planning**
- Target margin of error: ±5% at 95% CI for primary endpoint, ±3% for pivotal market research.
- Sample size formula (simple random): `n = (Z² × p × (1-p)) / E²` with finite population correction: `n_adj = n / (1 + (n-1)/N)`.
- Segmentation quotas: minimum cell size = 30 responses for non-parametric, 100 for parametric analysis.
- Oversampling factor: `oversample = n_target / recruitable_ratio × expected_completion_rate`.

**Segmentation Scoring**
Score each segment across five dimensions:

| Dimension | Weight | Scoring approach |
|------------|--------|-----------------|
| Segment size | 20% | Revenue potential at maturity |
| Growth rate | 20% | 3-year CAGR |
| Accessibility | 20% | Channel reach, targeting ease |
| Need intensity | 20% | Problem severity, willingness-to-pay |
| Strategic fit | 20% | Pipeline alignment, brand equity |

Total segment attractiveness score. Recommend segments with score ≥4.0 as primary targets.

**Competitive Landscape Template**
- Competitor mapping: product, company, phase, MOA, key efficacy/safety data, pricing, market share.
- Positioning matrix: axes of differentiation (e.g., efficacy vs. convenience, cost vs. outcome).
- SWOT for lead asset in each segment.

### product-research

User research and design validation for digital and physical products. This skill provides:

**User Study Design**
- Research question formalisation: PICO framework (Population, Intervention, Comparison, Outcome) for comparative studies; Problem-Context-Use-Outcome for exploratory studies.
- Method selection guide:

| Question type | Recommended method | Sample size | When to use |
|---------------|-------------------|-------------|-------------|
| Usage patterns | Analytics, diary study | 30+ for quant | Existing product, behavioural |
| Goals/motivations | Contextual inquiry | 8-15 per persona | Generative, early discovery |
| Usability issues | Moderated testing | 5 per iteration | Formative, iterative |
| Preference | A/B test, maxdiff | 300+ per variant | Summative, comparative |
| Satisfaction | SUS, NPS, CSAT | 50+ per segment | Benchmarking |
| Mental model | Tree test, card sort | 20-30 per segment | Information architecture |

**Saturation Planning**
- Coverage threshold: 80% of total insights at 90% confidence.
- Cumulative insight curve: plot cumulative unique findings vs. participants, fit `y = a × (1 - e^(-b × x))`.
- Saturation point `x_sat`: where last 10% of participants yield ≤5% new insights.
- Multi-segment studies: calculate saturation per segment independently.

**Insight Synthesis**
- Affinity mapping workflow: individual notes → silent clustering → label generation → hierarchy formation.
- Theme saturation: count of participants expressing each theme, classify as core (≥70%), supporting (30-69%), fringe (<30%).
- Insight statement format: `[Finding]` because `[Evidence]` which means `[Implication]`.
- Output artefact: insight report with finding, evidence, implication, confidence, participant verbatim.

**Usability Test Protocol Outline**
- Script sections: welcome, context, tasks (6-8 core + 2-3 exploratory), debrief, SUS questionnaire.
- Task design: scenario-based (not click-by-click), success criteria defined per task, time-on-task threshold.
- Metrics: task completion rate (binary vs. partial credit), time on task, error count, SEQ after each task, SUS overall.
- Severity rating: 0 (no issue), 1 (cosmetic), 2 (minor), 3 (major), 4 (catastrophic) per NIST / Nielsen.

## Academic Research

Eight skills for the scholarly research lifecycle — from pulse monitoring and literature review through grant writing, patent landscaping, syllabus design, and interactive NotebookLM-style analysis.

### orchestrator / hybrid-router

The academic orchestrator uses a deterministic SIGNALS classification system rather than free-text intent parsing. Each inbound request is tested against eight signal patterns in order:

| Signal | Pattern trigger | Routes to |
|--------|----------------|-----------|
| **S** — Survey / Scan | "what's new", "recent advances", "survey", "state of the field" | `pulse` |
| **I** — Investigate / In-depth | "systematic review", "literature review", "meta-analysis", "gap analysis" | `litreview` |
| **G** — Grant / Funding | "grant", "funding opportunity", "RFP", "call for proposals" | `grants` |
| **N** — Narrative / Bio | "dossier", "profile", "biography", "research statement", "CV" | `dossier` |
| **A** — Asset / IP | "patent", "IP landscape", "freedom to operate", "prior art" | `patent` |
| **L** — Learn / Teach | "syllabus", "course outline", "curriculum", "lecture plan" | `syllabus` |
| **S** — Synthesise / Study | "explain", "interactive", "study guide", "podcast", "FAQ" | `notebooklm` |
| **D** — Deep / Multi-source | (no match above or explicit "deep research") | `deep-research` |

If no signal reaches confidence >0.7, the router emits a disambiguation prompt showing the top 3 candidates and asks the user to confirm. The router also records `{ signal, confidence, route, reasoning, context_length }` for downstream use.

### pulse

Rapid field surveillance keeping researchers current without full systematic reviews. This skill provides:

**Scan Scope**
- Time window: rolling 12-month default, adjustable to 3/6/24 months.
- Source tier hierarchy: peer-reviewed journals (Tier 1), preprint servers (Tier 2), conference proceedings (Tier 3), reputable blogs/newsletters (Tier 4).
- Journal list: defined by ISSN range, field-specific (e.g., Nature Biotechnology, Cell, NEJM, JAMA for biomedical; NeurIPS, ICML, ICLR for ML).

**Signal Extraction**
- Per paper: title, authors, journal, DOI, date, link, 2-sentence summary, signal type (methodological advance, negative result, replication, clinical update, policy change, tool/resource release).
- Significance scoring: 1 (incremental) to 5 (paradigm shifting) based on novelty, evidence quality, reproducibility, and potential impact.
- Controversy flag: when two or more papers on the same question reach conflicting conclusions in the scan window.

**Output Format**
```
## Pulse: [Field] — [Time Period]

### High Significance (score ≥4)
1. **[Title]** — Signal type | Score — 2-sentence summary

### Notable (score 3)
...

### Sorted by subtopic
- **[Subtopic]** — Paper 1, Paper 2, Paper 3 (brief annotation each)

### Controversy Watch
- **[Question]** — Paper A says X (source); Paper B says Y (source); Z is unresolved
```

**Automation Notes**
- Batch size: 20-30 papers per scan; flag for full review if >5 high-significance items.
- Dedup: same DOI at multiple tiers keeps highest tier entry.
- Follow-up prompt: "Which of these would you like me to investigate further with a full litreview?"

### litreview

Structured literature review for systematic and scoping reviews, meta-analyses, and narrative synthesis. This skill provides:

**Protocol Definition (PRISMA-aligned)**
- Research question in PICO(T)S format: Population, Intervention/Exposure, Comparison, Outcome, Timeframe, Study design.
- Inclusion/exclusion criteria table: criterion, rationale, operationalisation (e.g., "published in English 2015-2025").
- Database list: PubMed, Scopus, Web of Science, Embase, Cochrane CENTRAL, IEEE Xplore, ACM DL, arXiv, SSRN.
- Search string construction: Boolean operators, MeSH/Emtree terms, field tags, date limiter.
- Example biomedical string: `(("diabetes mellitus"[MeSH] OR "type 2 diabetes"[tiab]) AND ("GLP-1"[tiab] OR "semaglutide"[tiab])) AND ("cardiovascular"[tiab] OR "MACE"[tiab]) AND 2015:2025[dp]`

**Screening Pipeline**
- Deduplication: exact match > fuzzy DOI match > title+author+year match.
- Title/abstract screening: batch 50 at a time, classify as Include / Exclude / Maybe. Kappa ≥0.8 for dual screening.
- Full-text retrieval: attach PDF or URL link. Record reason for exclusion at this stage.
- PRISMA flow diagram text output:
  ```
  Records identified (n=X)
  Duplicates removed (n=X)
  Title/abstract screened (n=X)
    Excluded (n=X) — [top reasons]
  Full-text assessed (n=X)
    Excluded (n=X) — [reason 1 (n), reason 2 (n)]
  Studies included (n=X)
  ```

**Data Extraction & Quality Assessment**
- Extraction table columns: Study ID, Design, Population (N, age, sex), Intervention, Comparator, Outcome, Effect size (95% CI), Follow-up, Funding, Confounders addressed.
- Risk of bias tool selection: Cochrane RoB 2 (RCTs), ROBINS-I (non-randomised), QUADAS-2 (diagnostic), SYRCLE (animal), AMSTAR-2 (reviews).
- Evidence grading: GRADE — study design, risk of bias, inconsistency, indirectness, imprecision, publication bias → High / Moderate / Low / Very Low.

**Synthesis**
- Qualitative synthesis: thematic summary organised by outcome type, intervention class, or population subgroup. Tables with direction of effect: + (benefit), - (harm), 0 (no effect), ~ (mixed).
- Quantitative synthesis: meta-analysis when ≥3 studies with comparable design, population, outcome. Heterogeneity: I², τ², Q-test. Pre-specified subgroup and sensitivity analyses.
- Forest plot text representation: study row with N/N, effect (CI), weight %, and simple bar: `Study A (n=200) |——■————| 0.72 (0.55-0.94) 34%`.
- Funnel plot asymmetry assessment: Egger's test when ≥10 studies.

**Output Artefacts**
- Full narrative review (IMRaD structure)
- Evidence summary table
- PRISMA checklist
- Quality assessment tables (per study, per domain)
- Search strategy with full strings per database
- RIS/BibTeX export of included studies

### grants

Grant opportunity discovery, fit assessment, and proposal support. This skill provides:

**Opportunity Discovery**
- Source integration: NIH RePORTER, NSF Award Search, ERC, Wellcome, Gates Foundation, SBIR/STTR, DoD/CDMRP, Horizon Europe.
- Search filters: funding organisation, mechanism (R01, R21, R03, K99, F32, U01), activity code, study section, payline percentile, NICHD/NCI/NHLBI etc.
- Call calendar: rolling deadlines fixed vs. LOI required vs. full proposal with historical paylines.
- Output per opportunity: agency, program, mechanism, deadline, budget range (direct + indirect), award period, priority score range, payline, study section assignment likelihood.

**Fit Assessment**
Score alignment across five dimensions:

| Dimension | Weight | Questions |
|-----------|--------|-----------|
| Scientific fit | 30% | Does the proposal match study section scope? Is the hypothesis compelling? |
| Approach | 25% | Is the methodology rigorous? Are preliminary data persuasive? |
| Investigator | 20% | Does the team have publication/grant history in this area? |
| Environment | 15% | Does the institution provide necessary resources? Collaborations? |
| Budget | 10% | Is the budget justified and within agency caps? |

Total fit score: ≥4.0 Strong Apply, 3.0-3.9 Conditional (address gaps first), <3.0 Seek alternative opportunity.

**Proposal Section Guidance**
- **Specific Aims** (1 page): long-term goal → central hypothesis → 3 specific aims → expected outcomes → impact.
- **Research Strategy** (12 pages): Significance (1-2 pages) — Innovation (1 page) — Approach per aim (8-10 pages including preliminary data, experimental design, expected results, potential pitfalls + alternatives, timeline).
- **Budget Justification**: personnel (months effort x salary + fringe), equipment (>$5,000 itemise), supplies (catalogue or estimated), travel (meetings per year x cost), publication costs, consultant costs, consortium/subaward.
- **Biosketch**: NIH format, 5 pages, includes personal statement, positions, selected peer-reviewed publications (max 5 highlighted), research support (ongoing and completed).
- **Facilities & Resources**: describe lab space, core facilities, clinical resources, animal housing, computing resources.
- **Vertebrate Animals / Human Subjects / Biohazard**: IACUC approval date / IRB approval date / IBC registration.

**Resubmission Strategy**
- Analyse summary statement: score by criterion, reviewer comments, bullet response.
- A1 response format: `Reviewer comment → Our response → Page/line reference`. Address each concern as "added data (Figure X)", "clarified (page Y)", "new collaboration with Z".
- Track changes: resubmission cover letter referencing original line numbers. Change in significance/innovation/approach score target.

### dossier

Research dossier compilation — for individuals, labs, centres, or research programmes. This skill provides:

**Dossier Structure**
- **Executive profile**: name, title, affiliation, ORCID, h-index, total citations, active grants, leadership roles.
- **Research narrative**: unified research theme, 3-5 key contributions with one-paragraph impact statements, future directions.
- **Publication record**: formatted by category (peer-reviewed, preprints, proceedings, book chapters, patents). DOI, citation count (Scopus/Google Scholar), journal IF, altmetric score.
- **Grant portfolio**: active (agency, mechanism, role, amount, period, percent effort), completed (funded vs. pending), pending decisions.
- **Teaching & mentoring**: courses taught (level, enrollment, evaluation score vs. department mean), trainees supervised (graduate, postdoc, undergraduate) with placement.
- **Service**: editorial board appointments, study section / grant review panels, conference organisation, department committees.
- **Media & outreach**: press coverage, public lectures, policy briefs, patient advocacy engagement.

**Format Variants**
- NIH biosketch (5-page limit, 5 selected publications highlighted)
- NSF biographical sketch (2-page limit, 10 products listed)
- Academic CV (no page limit, reverse chronological, comprehensive)
- Industry executive summary (1-page narrative, 5 key achievements, metrics dashboard)
- Lab/centre profile (3-5 pages, mission, research areas, team, funding portfolio, technology platforms)

**Automation**
- ORCID auto-population: fetch works, funding, peer review.
- Metrics pull: h-index from Google Scholar, citations from Scopus/CrossREF, altmetric from Dimensions.
- Gap detection: flagged if >2 years since last publication, if active grants have no associated publications, if mentoring load exceeds 5 active PhD students per faculty.

**Output Artefacts**
- Completed dossier in target format (PDF, DOCX, or markdown)
- Citations file (BibTeX)
- Metrics dashboard: publication trajectory (per year), grant income by year, h-index trajectory, collaboration network summary
- Gap analysis: strengths, weaknesses, opportunities, threats for next career stage (promotion, tenure track, centre director)

### patent

Patent landscaping, freedom-to-operate analysis, and prior art searching. This skill provides:

**Patent Search Strategy**
- Database coverage: USPTO, EPO, WIPO/PCT, JPO, SIPO, Google Patents, Lens.org, PatSnap.
- Search fields: title, abstract, claims, description, IPC/CPC codes, assignee, inventor, filing date, priority date, legal status.
- Query construction: `ti,ab((biomarker AND "colorectal cancer" AND (ctDNA OR "circulating tumor DNA")) AND icc(A61K AND C12Q))`.
- Classification codes: CPC (cooperative), IPC (international), USPC (legacy for pre-2015 US). Map technology domain to relevant subclass.

**Landscaping Output**
- Yearly filing trend chart: total filings by year, segmented by assignee type (corporation, university, individual, government).
- Top assignees: bar chart of filing count, portfolio size, active vs. lapsed ratio.
- Technology cluster map: IPC/CPC co-occurrence network — identify dense clusters and orphan spaces.
- Citation network: highly cited patents, forward/backward citation clustering, blocking patent identification.
- Jurisdiction map: patent family coverage by country, identify gaps in territorial protection.

**Freedom-to-Operate (FTO) Analysis**
- Claim mapping: independent claim element-by-element comparison against proposed product/process.
- Claim element table:

| Claim element | Proposed product | Found in prior art? | Risk |
|---------------|-----------------|---------------------|------|
| Element 1 | Feature A | Yes — Patent US12345 | High |
| Element 2 | Feature B | No | Low |
| Combination | A + B | Yes — Patent US67890 (doctrine of equivalents claim) | Medium |

- Risk rating: High (literal infringement), Medium (doctrine of equivalents), Low (design-around available), None (expired, lapsed, or invalid).
- Invalidity arguments: prior art not considered by examiner, §101/§102/§103/§112 grounds.

**Patentability Assessment**
- Novelty search: pre-filing prior art search, one year grace period check, enablement review.
- Criteria: §101 (statutory subject matter), §102 (novelty / prior art), §103 (obviousness), §112 (written description, enablement, best mode).
- Claim drafting guidance: independent claim breadth, dependent claim fallback positions, means-plus-function considerations, Jepson vs. Markush vs. Swiss-type claim formats.

**Watch & Alerting**
- Monitoring parameters: assignee(s), CPC/IPC codes, key inventors, cited references.
- Alert triggers: new filing by competitor, published application enters examination, rejection mailed, grant/issue, litigation filing, PTAB inter partes review.
- Weekly digest format: 5-10 new items, each with title, assignee, filing date, 2-sentence annotation, relevance score (1-5).

### syllabus

Course and curriculum design for university-level instruction. This skill provides:

**Course Design Framework**
- Backward design (Wiggins & McTighe): identify desired results → determine acceptable evidence → plan learning experiences.
- Learning taxonomy: Bloom's — Remember, Understand, Apply, Analyze, Evaluate, Create. Map each learning objective to at least one level with measurable verb.
- Course level: 100-200 (introductory), 300-400 (advanced undergraduate), 500-600 (graduate), 700+ (professional doctoral).
- Credit hour policy: 1 credit = 1 hour lecture + 2 hours out-of-class work per week, per semester.

**Syllabus Structure**
- Course header: institution, department, course number, title, credits, semester, meeting time, room.
- Instructor information: name, office, email, office hours (minimum 2 hours/week), response time policy.
- Description: 2-3 paragraphs covering purpose, scope, prerequisites, relation to curriculum.
- Learning objectives: 5-8 measurable objectives with Bloom's level. e.g., "By semester's end, students will be able to **critique** (Evaluate) a published study's experimental design and propose alternative approaches."
- Materials: required textbook(s) with edition and ISBN, recommended readings, software, lab equipment.
- Assessment breakdown: assignments (weight %), midterm, final, participation, project. Grading scale clearly stated.

**Weekly Schedule Template**

| Week | Topic | Learning objectives | Readings | Deliverables |
|------|-------|-------------------|----------|-------------|
| 1 | Introduction | Define key terms, describe scope | Ch. 1 | — |
| 2-3 | Module A (Foundations) | Explain theory X, apply method Y | Ch. 2-3, Paper A, Paper B | Problem set 1 |
| 4-5 | Module B (Advanced) | Evaluate evidence for Z, design experiment | Ch. 4-5, Paper C | Midterm (Week 5) |
| 6-7 | Module C (Applications) | Synthesise concepts, propose solution | Ch. 6-7, Paper D | Final project proposal |
| 8 | Review & Final | Demonstrate mastery across modules | All | Final project + exam |

**Pedagogical Notes**
- Active learning strategies per session: think-pair-share, minute paper, case study, problem-based learning, jigsaw classroom.
- Assessment design: rubric for each major assignment (4 levels: exemplary, proficient, developing, unsatisfactory).
- Accessibility: statement, accommodation process, materials available 1 week in advance, captioned video, extended time on exams.
- Academic integrity policy: collaboration boundaries, citation requirements, AI use policy (permitted / conditional / prohibited with specific carve-outs).
- Sample syllabus policies: late work (10% per day, max 5 days), regrade request (1 week window, written justification), communication prefer email (48h response).

**Curriculum Mapping**
- Prerequisite chain: what courses must precede, what knowledge is assumed, diagnostic assessment at start.
- Programme-level alignment: which programme learning outcomes does this course address, at what level (Introduced, Reinforced, Emphasised, Assessed).
- Portfolio assessment: identify which assignments contribute to programme-level assessment.

### notebooklm

Interactive document analysis and synthesis — study guides, FAQs, podcasts, explainers, and Q&A. This skill provides:

**Source Ingestion**
- Supported formats: PDF, text, markdown, JSON, CSV, HTML, YouTube transcript, web article URL (via webfetch).
- Source characterisation: table per source — title, type, length (words), publication date, author(s), key topics, relevance to query.
- Content chunking: sliding window of 500-1000 tokens with 100-token overlap. Preserve section headers as chunk anchors.
- Source priority scoring: provenance (peer-reviewed > preprint > blog > forum), recency, authority (citation count, source reputation), direct relevance to query.

**Interactive Modes**

| Mode | Description | Trigger phrase | Output |
|------|-------------|---------------|--------|
| **Explain** | Simplify complex topics with intuitions, analogies, and examples | "explain X", "help me understand X" | Layered explanation: plain language → intermediate → technical depth. Analogies. Common misconceptions debunked. |
| **Study Guide** | Structured learning companion for a body of material | "study guide", "exam prep" | Key concepts (10-15), glossary, self-quiz (10 questions with answers), essay prompts, formula sheet if applicable. |
| **FAQ** | Question-answer pairs derived from source documents | "FAQ", "frequently asked questions" | 10-20 Q&A pairs. Question types: definition, comparison, mechanism, evidence, implication. Each answer cites source and page. |
| **Debate** | Pro/con analysis of a contested topic | "debate", "pros and cons", "both sides" | Positions mapped to sources. Strength of evidence per position. Unresolved questions. |
| **Timeline** | Chronological narrative of developments | "timeline", "history", "chronology" | Event list sorted by date. For each: date, event, key actors, source. Critical junctures highlighted. |
| **Briefing** | Executive summary of a document or topic | "brief", "briefing", "summary" | Situation, key findings (3-5), implications, recommended next actions. One page max. |
| **Cross-source synthesis** | Find links and contradictions across multiple documents | "compare", "synthesise", "across sources" | Agreement table (topic: sources in agreement), disagreement table (topic: source A says X, source B says Y), gaps. |

**Q&A Protocol**
1. Parse question for: entity, relation, scope constraint (time, geography, population), confidence expectation.
2. Retrieve: identify relevant source chunks via keyword + semantic matching. Return top K=5 chunks per question.
3. Answer: synthesise across chunks. If chunks conflict: flag disagreement and present both with sources. If evidence insufficient: state what is known, what is unknown.
4. Cite: every factual statement sourced to `[Source: Title, page/chunk, URL if applicable]`.
5. Follow-up: "Based on this answer, you might also want to know about X, Y, or Z. What would you like to explore?"

**Deep Dive Protocol**
When user requests "deep dive", "tell me everything about", or "full analysis":
- Expand each source to full content read.
- For each section of the source, generate: key claim, supporting evidence, confidence level, relationship to other sections, open questions.
- Cross-source comparison: per topic, list each source's position with evidence quality rating (high/medium/low).
- Synthesis diagram (text): topic map showing connections between concepts, evidence supporting each link, controversies highlighted.

**Output Artefacts**
- Standalone interactive notebook (markdown with internal anchors — `[jump to concept X](#concept-x)`)
- Source bibliography (formatted to APA/MLA/Chicago per user preference)
- Key quotations extract (source, page, quotation, significance)
- Confidence map: topics with high, medium, and low confidence based on evidence base
- Follow-up research questions (3-5) with suggested search strategies

## Transversal: Deep Research Patterns

Beyond the individual skill operations, three patterns activate across any research skill when the orchestrator detects multi-source, synthetic, or investigative requirements.

### Pattern 1: Multi-Source Evidence Triangulation

When a claim, estimate, or finding must be verified across independent sources:

1. **Source diversity check**: Confirm ≥3 independent sources covering the claim. Independence means no shared authors, funders, or data provenance.
2. **Agreement classification**:
   - **Convergent**: All sources agree → confidence = high. Report the consensus with representative citations.
   - **Bounded**: Sources agree on range but not point estimate → report the range with source-specific bounds. Confidence = medium.
   - **Conflicting**: Sources disagree → map each position to its evidence. Apply a hierarchy: meta-analysis > RCT > observational study > expert opinion. If top-tier evidence is absent, downgrade confidence and flag for primary research.
3. **Bias assessment per source**: Funding source disclosure, author conflicts, journal predatory status (Beall's list / Cabells), retraction watch.
4. **Temporal weighting**: More recent evidence weighted higher. For fast-moving fields (AI, oncology, virology), evidence >3 years old flagged as potentially stale. For stable fields (anatomy, taxonomy), 10-year horizon applies.

### Pattern 2: Evidence Quality Ladder

Standardised confidence assignment across all synthesis outputs:

| Level | Label | Requirements | Example output phrasing |
|-------|-------|-------------|------------------------|
| A | Established consensus | ≥2 independent systematic reviews or meta-analyses agree | "X is well established" |
| B | Strong evidence | ≥2 RCTs or ≥4 well-designed observational studies | "X is strongly supported" |
| C | Moderate evidence | 1 RCT or ≥2 observational studies | "X is supported by moderate evidence" |
| D | Limited evidence | Preclinical, case series, 1 observational study | "X is suggested by limited evidence" |
| E | Expert opinion / mechanism | No direct studies, extrapolation from related fields | "X is hypothetical / based on expert opinion" |
| F | Contradicted | Evidence consistently against | "X is not supported (contradicted by available evidence)" |

### Pattern 3: Citation Management

Every research output should include:

1. **Reference list**: formatted per chosen style (APA 7th, MLA 9th, Chicago 17th, Vancouver, Nature, IEEE). Include DOI wherever available.
2. **In-text citations**: `(Author, Year)` or `[n]`. Never make a factual claim without a citation.
3. **Citation quality tiers**:
   - Tier 1 (preferred): Peer-reviewed journal articles with DOI, books from academic presses, official standards/guidelines.
   - Tier 2 (acceptable): Preprints (arXiv, bioRxiv, medRxiv), government/agency reports, conference proceedings.
   - Tier 3 (use with caution): White papers, blog posts, news articles, Wikipedia (use as a starting point, cite original sources).
4. **BibTeX / RIS export**: Provide all citations in both formats at request.
5. **Citation verification**: When user provides a citation, verify it against DOI/PubMed/Google Scholar. Flag if: paper retracted, DOI not found, author name mismatch, journal name suspected predatory.

## How to Use

**Selecting a skill directly** — when the task clearly maps to one skill:

```
/load research > clinical-research
/load research > litreview
/load research > patent
```

**Using the orchestrator** — when uncertain or the request crosses skill boundaries:

```
/load research > orchestrator
```

Provide your research question in natural language. The orchestrator classifies and routes. If classification confidence is low, it will ask you to choose from the top 3.

**For deep research** — when you need multi-source investigation with evidence synthesis:

```
/load deep-research
```

This activates the deep-research skill which operates independently of the research pack orchestrator but complements all sub-skills.

**Chaining skills** — for multi-stage workflows:

1. Start with `orchestrator` for classification
2. Route to `pulse` for field scan
3. Route identified papers to `litreview` for systematic review
4. If commercial angle, chain to `patent` for landscaping
5. Synthesise into `dossier` for the researcher or `notebooklm` for an interactive report

## Forcing Questions

Use these questions to interrogate and stress-test any research output:

1. **What is the base rate?** Without knowing the base rate / unconditional probability, every claim about effect size or association is uninterpretable. Demand prevalence, incidence, or historical average.

2. **What would it take to falsify this claim?** If the claim is unfalsifiable within the available evidence, classify as exploratory/hypothesis-generating, not confirmatory. Ask what specific observation would constitute disproof.

3. **What is the mechanism?** Correlation does not imply causation, but absent a plausible mechanism even a strong association warrants scepticism. Demand a causal chain from intervention to outcome.

4. **Who is not in the room?** Every dataset has a silence — populations excluded, subgroups not analysed, outcomes not measured. Identify the excluded systematically (geography, demographics, disease severity, comorbidities, publication language).

5. **What is the publication equivalent of a cash register?** Follow the money. Who funded each source? What incentive structure shaped the research question, design, analysis, or interpretation? For negative results specially — disincentives to publish null findings create systematic publication bias.

6. **If this answer is correct, what else must be true?** Deduce logical corollaries and check whether they hold. If the corollaries are contradicted by available evidence, the original claim is suspect even if it appears supported in isolation.
