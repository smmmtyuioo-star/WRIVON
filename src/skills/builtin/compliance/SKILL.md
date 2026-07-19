---
name: "compliance"
description: "Compliance domain skill pack covering Regulatory Affairs, Quality Management, and Compliance OS skills. Use for ISO 13485, MDR, FDA, GDPR, ISO 27001, ISO 42001, EU AI Act, SOC 2, and other regulatory compliance tasks."
license: MIT
metadata:
  version: 1.0.0
  author: Wrivon
  category: compliance
  updated: 2026-07-19
  source: "claude-code-skills v2.11.2 (extracted)"
---

# Compliance Domain Skills

## Overview

22 skills across two compliance sub-domains:

- **RA/QM Compliance (13 skills)** — HealthTech/MedTech regulatory affairs and quality management covering ISO 13485, EU MDR 2017/745, FDA QMSR, ISO 14971, ISO 27001, GDPR/DSGVO, SOC 2, EU AI Act, and ISO 42001.
- **Compliance OS (9 skills)** — Multi-framework compliance orchestration, program readiness interrogation, and per-framework audit-prep forcing questions for ISO 27001, ISO 13485, GDPR, FDA QSR, SOC 2, ISO 42001 AIMS, and EU AI Act.

## RA/QM Compliance

13 production-ready regulatory affairs and quality management skills for HealthTech/MedTech organizations. All outputs are decision support: final compliance determinations route to the named human owner (QMR, DPO, regulatory counsel) — never auto-decide.

### Strategic Leadership

| Skill | Description |
|---|---|
| **regulatory-affairs-head** | Regulatory strategy development, FDA 510(k)/PMA/De Novo submission packages, CE marking technical documentation under EU MDR 2017/745, multi-market approval strategies across FDA, EU, Health Canada, PMDA, and NMPA, and regulatory intelligence on evolving standards. Covers deficiency letter responses, pre-submission meetings, and coordinated global market access. |
| **quality-manager-qmr** | Senior Quality Manager Responsible Person (QMR) governance per ISO 13485 Clause 5.5.2. Management review leadership, quality policy and objectives, quality KPIs and cost of quality monitoring, quality system effectiveness, and regulatory compliance oversight. |

### Quality Systems

| Skill | Description |
|---|---|
| **quality-manager-qms-iso13485** | ISO 13485:2016 QMS implementation, maintenance, and certification support. Covers QMS design, documentation control, process validation, internal auditing, CAPA management, design control, supplier qualification, and management review. |
| **capa-officer** | Corrective and Preventive Action (CAPA) system management within medical device QMS. Root cause analysis methods (5-Why, fishbone, fault tree), corrective/preventive action planning, effectiveness verification, CAPA metrics tracking, and audit finding CAPA closure. |
| **quality-documentation-manager** | Document control system design and management for ISO 13485 QMS. Document numbering conventions, version control, approval workflows, change control, electronic record compliance (21 CFR Part 11), audit trail, document master list, and record retention. |

### Risk & Security

| Skill | Description |
|---|---|
| **risk-management-specialist** | ISO 14971:2019 risk management implementation throughout the medical device lifecycle. Risk analysis, risk evaluation, risk control, FMEA/FMECA, fault tree analysis, hazard identification, benefit-risk analysis, residual risk evaluation, and post-production information analysis. |
| **information-security-manager-iso27001** | ISO 27001:2022 ISMS implementation and cybersecurity governance for HealthTech/MedTech companies. Security risk assessment, Annex A controls, Statement of Applicability (SOA), information security policy, incident response, and medical device cybersecurity. |

### Regulatory Specialists

| Skill | Description |
|---|---|
| **mdr-745-specialist** | EU MDR 2017/745 compliance for medical device classification (Annex VIII), technical documentation (Annex II/III), clinical evaluation (Annex XIV), post-market surveillance, Art. 86 PSUR schedules, EUDAMED integration, UDI assignment, and notified body review preparation. |
| **fda-consultant-specialist** | FDA regulatory consultant for medical device companies. 510(k)/PMA/De Novo pathway guidance, QMSR (21 CFR 820 incorporating ISO 13485:2016 as of 2026-02-02), HIPAA assessments, and device cybersecurity per FDA pre- and post-market guidance. |

### Audit & Compliance

| Skill | Description |
|---|---|
| **qms-audit-expert** | ISO 13485 internal audit methodology for medical device QMS. Audit planning and execution, nonconformity classification, CAPA verification, audit checklist generation, external audit preparation, and audit program management. |
| **isms-audit-expert** | ISO 27001 ISMS audit management for compliance verification and certification support. Security control assessment, Annex A control review, risk-based audit plans, nonconformity management, Stage 1/Stage 2 audit documentation, and surveillance audit support. |
| **gdpr-dsgvo-expert** | EU GDPR and German DSGVO compliance automation for HealthTech/MedTech. Codebase privacy risk scanning, DPIA generation, data subject rights request tracking (Art. 12(3) one-month deadlines), Records of Processing Activities (Art. 30), breach notification (Art. 33-34), and privacy-by-design workflows. Final compliance determinations route to DPO or legal counsel. |
| **soc2-compliance** | SOC 2 Type I and Type II compliance preparation for SaaS and technology companies. Trust Service Criteria mapping (Security, Availability, Processing Integrity, Confidentiality, Privacy), control matrix generation, evidence collection, gap analysis, audit readiness assessment, and vendor management. |

### Additional RA/QM Skills

| Skill | Description |
|---|---|
| **eu-ai-act-specialist** | EU AI Act (Regulation 2024/1689) operational compliance. Three Article-level decisions: risk tier classification (prohibited Art. 5, high-risk Art. 6 + Annex III, limited-risk Art. 50, minimal-risk), conformity assessment route (Art. 43 Module A vs Module H + Annex IV technical documentation), and per-role obligations (provider/deployer/importer/distributor/authorized representative). |
| **iso42001-specialist** | ISO/IEC 42001:2023 AI Management System (AIMS) specialist for internal audits. Three decisions: AIMS gap analysis against Clauses 4-10, AI risk register building with Annex A control mapping per ISO 23894, and Clause 9.2 12-month internal audit plan. |
| **agent-decision-receipts** | Mint tamper-evident, post-quantum-signed receipts for consequential agent actions (deploy, delete, pay, grant-access, model decision). Three decisions: whether an action needs a receipt, minting it, and verifying it from the certificate alone. Supports EU AI Act Article 12 record-keeping, Ed25519 + ML-DSA-65 + SLH-DSA signatures via OpenAgentOntology. |

## Compliance OS

9 multi-framework orchestration and audit-readiness skills. The Compliance OS meta-orchestrator lets compliance teams configure which frameworks apply, compute cross-framework control overlap, simulate internal audits, and consolidate evidence across multiple frameworks.

### Orchestration

| Skill | Description |
|---|---|
| **compliance-os** | Meta-orchestrator for multi-framework compliance program orchestration. Four decisions: (1) framework selection — ranks 12 supported frameworks (ISO 27001, ISO 13485, ISO 42001, ISO 14971, EU AI Act, MDR 745, GDPR, SOC 2, FDA QSR, NIST CSF 2.0, NIS2, HIPAA) against a company profile; (2) cross-framework control overlap with evidence-reuse opportunities; (3) audit simulation — generates 8-15 finding scenarios per IIA expectations; (4) unified evidence checklist with reuse map. 4 stdlib Python tools: `framework_selector.py`, `cross_framework_mapper.py`, `audit_simulator.py`, `evidence_pool_generator.py`. |

### Per-Framework Audit Preparation

Each is a `/cs:*` 6-question forcing interrogation command with sample-driven discipline, recommended answers, and canon citations. Run before annual internal audits, certification stage 1, or surveillance audit cycles.

| Skill | Command | Focus |
|---|---|---|
| **compliance-readiness** | `/cs:compliance-readiness <program>` | Multi-framework compliance officer pressure test. Six questions before any new-framework commitment, audit cycle planning, or certification readiness sign-off. Covers framework selection, overlap reuse, evidence consolidation, management review cadence, and meta-program ownership. |
| **iso27001-audit-prep** | `/cs:iso27001-audit-prep <scope>` | ISO 27001 ISMS audit readiness. Six questions on 3-year coverage discipline, risk register freshness with Annex A control linkage, SOA currency, evidence sample integrity, corrective action closure, and management review cadence. |
| **iso13485-audit-prep** | `/cs:iso13485-audit-prep <scope>` | ISO 13485 QMS audit readiness. Six traceability-obsessed questions on DHF completeness (design verification + validation), CAPA effectiveness verification evidence, complaint handling + MDR reporting, supplier audit cycle currency, risk management file currency, and post-market surveillance output integration into management review. |
| **gdpr-audit-prep** | `/cs:gdpr-audit-prep <scope>` | GDPR DPO audit readiness. Six Article-cited questions on RoPA currency (Art. 30), DPIA completion (Art. 35), breach response capability (Art. 33-34), data subject request handling (Art. 12-23), data processor agreements (Art. 28), and DPO designation (Art. 37). |
| **fda-qsr-audit-prep** | `/cs:fda-qsr-audit-prep <scope>` | FDA QSR (21 CFR 820 / QMSR) audit readiness. Six questions on complaint files + MDR reports, CAPA system effectiveness, design controls, purchasing controls + supplier qualification, production/process controls, and records/document controls — the most-cited FDA inspection areas. |
| **soc2-audit-prep** | `/cs:soc2-audit-prep <scope>` | SOC 2 Type II readiness. Six observation-period-disciplined questions on TSC scope, control evidence across the full observation window, deviation handling, subservice organization monitoring, incident response evidence, and system description completeness. |
| **aims-audit** | `/cs:aims-audit <scope>` | ISO 42001 AIMS internal audit readiness. Six questions on AIMS scope completeness (all AI systems named), AI policy coverage (lawful use + beneficial purpose + human oversight + continual improvement), AI risk register refresh, competence evidence, documented information per Clause 7.5, and internal audit program coverage. |
| **ai-act-readiness** | `/cs:ai-act-readiness <system>` | EU AI Act compliance readiness. Six Article-cited questions on prohibited practices (Art. 5), high-risk classification (Art. 6 + Annex III), provider obligations (Art. 16/17 QMS/technical documentation), deployer obligations (Art. 26/29), conformity assessment route (Art. 43 Module A vs H), and Article 113 phased deadline compliance. |

## How to Use

1. **Identify the regulation or standard** you need to comply with (ISO 13485, MDR, FDA, GDPR, ISO 27001, SOC 2, EU AI Act, ISO 42001).
2. **For single-framework work**, load the corresponding RA/QM skill's SKILL.md and follow its workflow:
   - `ra-qm-team/skills/<skill>/SKILL.md`
   - Each skill ships 3+ stdlib Python tools, 3+ reference guides, and workflow templates.
3. **For multi-framework orchestration**, start with the Compliance OS:
   - Run `framework_selector.py` with your company profile to identify applicable frameworks.
   - Run `cross_framework_mapper.py` to compute control overlap and evidence-reuse opportunities.
   - Run `audit_simulator.py` to generate realistic mock-audit findings.
   - Run `evidence_pool_generator.py` to consolidate evidence across frameworks.
4. **For audit readiness pressure-testing**, use the appropriate `/cs:*` command:
   - `/cs:compliance-readiness` — multi-framework program interrogation
   - `/cs:iso27001-audit-prep` — ISO 27001 ISMS audit readiness
   - `/cs:iso13485-audit-prep` — ISO 13485 QMS audit readiness
   - `/cs:gdpr-audit-prep` — GDPR DPO audit readiness
   - `/cs:fda-qsr-audit-prep` — FDA QSR audit readiness
   - `/cs:soc2-audit-prep` — SOC 2 Type II readiness
   - `/cs:aims-audit` — ISO 42001 AIMS audit readiness
   - `/cs:ai-act-readiness` — EU AI Act compliance readiness

## Forcing Questions

Ask yourself these questions before committing to a compliance program:

1. **Have you named every applicable regulatory framework?** Forgetting one means rebuilding the audit program later. Run `framework_selector.py` with your company profile.
2. **What's the most mature certificate or regulation you already operate?** That's your reuse anchor. Map every new framework against it.
3. **What's the audit calendar across all frameworks?** Multi-framework programs require surveillance audits stacked through the year — plan auditor independence and capacity.
4. **Where is evidence stored, and who owns it?** Multi-framework programs collapse when evidence lives in one team's drive without an index. Run `evidence_pool_generator.py` to surface reuse opportunities.
5. **What's the management review cadence across frameworks?** Each framework wants its own management review, but a single integrated review per ISO Annex SL typically satisfies all with one calendar slot.
6. **Who owns the meta-program?** If no single accountable role, the program fragments.
7. **Are your regulatory citations current?** Verify citations against current text (e.g., FDA QMSR effective 2026-02-02 replaced legacy QSR; EU AI Act phased deadlines through 2027).
