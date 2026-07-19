---
name: "marketing"
description: "Marketing domain skill pack covering 48 marketing skills across 8 specialist pods: Content, SEO/AEO, CRO, Channels, Growth, Intelligence, Sales Enablement, Marketing Ops. Use for any marketing, growth, or content task."
license: MIT
metadata:
  version: 1.0.0
  author: Wrivon
  category: marketing
  updated: 2026-07-19
  source: "claude-code-skills v2.11.2 (extracted)"
---

# Marketing Domain Skills

## Overview

Comprehensive marketing skill pack derived from the claude-code-skills marketing-skill plugin (v2.11.2). Covers the full marketing lifecycle — content creation and strategy, SEO and AEO (Answer Engine Optimization), conversion rate optimization, channel execution, growth programs, marketing intelligence, sales enablement, and marketing operations. Each pod contains specialist skills with deterministic Python tools, reference docs, and brand voice integration.

The ecosystem includes 48 specialist skills organized into 8 pods, 59+ stdlib-only Python automation tools, and a shared marketing context system (`.claude/product-marketing-context.md`) consumed by every skill for brand voice, personas, and competitive landscape. Use `marketing-context` first to establish context, then route to specific pods via `marketing-ops` or load individual skill SKILL.md files directly.

Pod design follows a strict separation of concerns: Content handles what you say and how you say it; SEO/AEO ensures you get found; CRO maximizes conversion from traffic; Channels executes across distribution mediums; Growth drives scalable programs; Intelligence measures and analyzes; Sales Enablement bridges marketing to revenue; Marketing Ops provides the orchestration layer. Cross-pod campaigns (e.g., product launch, content SEO campaign, CRO sprint) are orchestrated through `marketing-ops` with documented skill sequences and campaign tracker tooling.

All Python scripts are stdlib-only (no pip install needed), CLI-first with `--help` and `--sample` modes, and produce both human-readable and JSON output. Skills follow the write-a-skill 6-item checklist with quality gates, forcing questions, and Matt Pocock grill discipline. Each script is deterministic — no ML/LLM calls, no external API dependencies, portable across Claude Code, Codex CLI, OpenCode, Gemini CLI, and Cursor.

## Pod Architecture

The 8 pods form a complete marketing system with clear boundaries and well-defined interaction patterns:

| Layer | Pods | Role |
|-------|------|------|
| Foundation | Marketing Ops | Context, routing, orchestration, quality gates |
| Create | Content | Messaging, copy, ideas, psychology |
| Discover | SEO & AEO | Organic visibility across search engines and AI |
| Convert | CRO | Conversion optimization across the entire funnel |
| Distribute | Channels | Multi-channel execution and amplification |
| Scale | Growth | Programs that compound over time |
| Analyze | Intelligence | Measurement, attribution, competitive analysis |
| Enable | Sales Enablement | Bridge marketing output to revenue results |

Pods are designed to be used independently or chained sequentially via `marketing-ops` campaign orchestration. The typical flow: Content creates → SEO ensures discoverability → CRO optimizes conversion → Channels distributes → Growth scales → Intelligence measures → Sales Enablement activates. Marketing Ops supports every layer with routing, context, and campaign coordination.

## Skills by Pod

### Content Pod
Content creation, strategy, copywriting, and editing — from blank page to published-ready.

- **content-production**: Full content production pipeline — write blog posts, articles, guides end-to-end with quality gates, brand voice analysis, SEO optimization modes, and callout generation scripts (`quality_gate.py`, `brand_voice_analyzer.py`)
- **content-strategy**: Plan content strategy with topic cluster mapping, content calendar generation, gap analysis, and pillar/cluster architecture using Python topic analysis tools
- **content-humanizer**: Fix AI-sounding content with humanizer scoring, AI cliché detection, brand voice injection, and personality scoring scripts (`ai_content_scorer.py`, `humanizer.py`)
- **copywriting**: Write marketing copy using proven frameworks (PAS, AIDA, FAB, 4Ps, 4Cs, Before-After-Bridge) with headline scoring and structure analysis
- **copy-editing**: Edit copy through systematic passes including AI detection, readability scoring (Flesch-Kincaid, SMOG, Coleman-Liau), brand voice alignment, and the Seven Sweeps method
- **marketing-ideas**: 139 proven marketing approaches organized by 16 categories (Content & SEO, Competitor, Free Tools, Paid Ads, Social & Community, Email, Partnerships, Events, PR & Media, Launches, Product-Led, Content Formats, Unconventional, Platforms, International, Developer, Audience-Specific)
- **marketing-psychology**: Apply 70+ psychological principles and mental models organized for marketing — cognitive biases, persuasion techniques, decision-making heuristics, and behavioral science frameworks
- **landing**: Generate premium single-file HTML landing pages with 3D CSS animations, GSAP scroll effects, mouse-parallax depth, and 4 design styles (from the marketing/ top-level domain)

### SEO & AEO Pod
Search engine optimization and answer engine optimization — get found by both search engines and AI models.

- **seo-audit**: Technical SEO audit with on-page optimization, keyword analysis, meta tag review, SEO health check scoring, and actionable recommendations
- **aeo**: Answer Engine Optimization — optimize content to be cited by AI language models (ChatGPT, Perplexity, Claude, Gemini, Mistral) with E-E-A-T scoring (0-100 composite), 8 industry-calibrated thresholds, schema.org JSON-LD injection, and citation tracking across LLMs with 73% cross-LLM correlation analysis
- **programmatic-seo**: Build SEO-driven pages at scale using templates and data feeds — directory pages, location pages, comparison pages, integration pages with template design and canonical strategy
- **schema-markup**: Implement, audit, and validate structured data (schema.org JSON-LD) for rich results — FAQ, Product, HowTo, Review, Article, LocalBusiness, Organization, BreadcrumbList, VideoObject, and more
- **site-architecture**: Audit and design site structure, URL hierarchy, navigation, breadcrumbs, internal linking strategy, topic clusters, silo structures, and orphan page detection
- **local-seo-manager**: Local SEO for service-area businesses — Google Business Profile audit, neighborhood service area pages, NAP consistency checking across directories, LocalBusiness schema, review response generation
- **app-store-optimization**: ASO toolkit for Apple App Store and Google Play Store — keyword research and scoring, competitor keyword analysis, metadata optimization, A/B test planning, launch checklists, ranking change tracking

### CRO Pod
Conversion rate optimization — turn visitors into customers across every touchpoint.

- **page-cro**: Optimize landing and marketing page conversion with heatmap hypothesis generation, copy scoring, layout frameworks, trust signal placement, and CTA optimization
- **form-cro**: Optimize lead capture, contact, demo request, application, survey, and checkout forms — field reduction strategies, progressive profiling, error prevention, and completion rate analysis
- **signup-flow-cro**: Optimize signup/registration/account creation/trial activation flows — friction reduction, social login placement, multi-step vs single-step, progress indicators, and drop-off analysis
- **onboarding-cro**: Optimize post-signup onboarding, user activation, first-run experience, time-to-value — empty states, onboarding checklists, aha moment identification, and activation metric design
- **popup-cro**: Create and optimize popups, modals, overlays, slide-ins, and banners — exit-intent triggers, timing rules, offer selection, form integration, and conversion measurement
- **paywall-upgrade-cro**: Optimize in-app paywalls, upgrade screens, upsell modals, and feature gates for freemium-to-paid conversion, trial expiration, and plan upgrade moments
- **ab-test-setup**: Plan, design, and implement A/B tests — hypothesis generation, sample size calculation, statistical significance planning, variant design, and experiment documentation

### Channels Pod
Multi-channel marketing execution — email, paid, social, video, and events.

- **email-sequence**: Create and optimize email sequences, drip campaigns, automated nurture flows, and lifecycle programs — welcome, onboarding, re-engagement, win-back, and post-purchase sequences
- **cold-email**: Write and optimize B2B cold outreach emails to prospects — subject line strategy, personalization frameworks, follow-up sequences, reply rate optimization, and compliance (CAN-SPAM, GDPR)
- **paid-ads**: Manage paid advertising across Google Ads, Meta (Facebook/Instagram), LinkedIn, and Twitter/X — campaign strategy, audience targeting, budget allocation, bid strategy, ROAS/CPA optimization
- **ad-creative**: Generate, iterate, and scale ad creative copy — headlines, descriptions, RSA assets, ad variations, creative testing frameworks, and bulk creative production
- **social-media-manager**: Develop social media strategy, content calendars, community management, platform selection, posting cadence, engagement tactics, and social media audits
- **social-content**: Create and optimize platform-native social content for LinkedIn, Twitter/X, Instagram, TikTok, Facebook — post formats, thread structures, hook writing, and repurposing workflows
- **x-twitter-growth**: Build X/Twitter audience with algorithm mechanics, thread engineering, reply strategy, profile optimization, viral content frameworks, and competitive intelligence via web search
- **youtube-full**: YouTube data operations — transcript extraction, video search, channel browsing, in-channel search, playlist extraction, and new-upload monitoring via TranscriptAPI
- **video-content-strategist**: Plan video content strategy, write video scripts, optimize YouTube channels, build short-form video pipelines (Reels, TikTok, Shorts), and repurpose long-form content into video
- **webinar-marketing**: Full webinar funnel — registration optimization, promotion strategy, show-up rate improvement, live engagement tactics, live-to-close conversion, post-event nurture, and on-demand strategy

### Growth Pod
Growth programs — launches, pricing, referrals, tools, and retention.

- **launch-strategy**: Plan product launches, feature announcements, and release strategies — phased launches, channel strategy, Product Hunt playbooks, GTM plans, launch checklists, and momentum tracking
- **pricing-strategy**: Design, optimize, and communicate SaaS pricing — tier structure design, value metric selection, pricing page optimization, price increase strategy, Van Westendorp PSM, good-better-best packaging
- **referral-program**: Design, launch, and optimize referral and affiliate programs — incentive design, program mechanics, referral link infrastructure, two-sided rewards, partner tiers, and viral coefficient analysis
- **free-tool-strategy**: Build free tools for marketing — idea evaluation (SEO value, lead gen potential, differentiation), tool design, interactive calculators, generators, checkers, graders, and launch promotion
- **churn-prevention**: Reduce voluntary and involuntary churn — cancel flow design, save offers, exit surveys, dunning sequences, failed payment recovery, win-back campaigns, and churn root cause analysis

### Intelligence Pod
Marketing analytics, tracking, competitive intelligence, and measurement.

- **campaign-analytics**: Analyze campaign performance with multi-touch attribution (first-touch, last-touch, linear, time-decay, U-shaped), funnel conversion analysis, ROI calculation, ROAS/CPA metrics, and cross-channel performance comparison
- **analytics-tracking**: Set up, audit, and debug analytics tracking — GA4 configuration, Google Tag Manager, event taxonomy design, conversion tracking, custom dimensions, UTM strategy, tracking plan creation, and data quality audits
- **competitor-alternatives**: Create competitor comparison and alternative pages — singular alternative, plural alternatives, you-vs-competitor, competitor-vs-competitor formats with deep research, modular content architecture, and varied section types
- **social-media-analyzer**: Social media campaign analysis and performance tracking — engagement rate calculation, ROI measurement, cross-platform benchmark comparison, content performance scoring, and audience growth analytics
- **prompt-engineer-toolkit**: Turn marketing prompts into tested, versioned production assets — A/B prompt evaluation with structured test cases, immutable prompt version history with diffs, marketing prompt templates (ad copy, email, social, landing pages, SEO meta), and LLM governance playbook (claim discipline, disclosure rules, human-review gates)

### Sales Enablement Pod
Product marketing, demand generation, brand, and positioning.

- **marketing-strategy-pmm**: Product marketing for positioning, GTM strategy, competitive intelligence, and product launches — April Dunford positioning, ICP definition, competitive battlecards, launch playbooks, messaging frameworks, and international market entry
- **marketing-demand-acquisition**: Multi-channel demand generation — campaign planning across Google Ads/LinkedIn Ads/Meta Ads, CAC analysis, MQL/SQL workflows, attribution modeling, technical SEO for acquisition, co-marketing partnerships, funnel and CRM operations
- **brand-guidelines**: Apply, document, and enforce brand guidelines — color systems (primary/secondary/accent), typography (heading/body/monospace), logo usage rules, imagery guidelines, tone matrix, and brand consistency audits for any identity including Anthropic's

### Marketing Ops Pod
Marketing operations, context, and routing.

- **marketing-ops**: Central router for the marketing skill ecosystem — routing matrix mapping user requests to the right skill, multi-skill campaign orchestration sequences (product launch, content campaign, conversion optimization sprint), cross-functional marketing audit, and quality gates
- **marketing-context**: Create and maintain `.claude/product-marketing-context.md` — brand voice definition, target audience/ICP documentation, competitive landscape, positioning, style guide, and foundational context consumed by all other marketing skills
- **marketing-skills**: Plugin-level index and route table — see what marketing capabilities exist, navigate the 8-pod ecosystem, locate the right specialist skill for each task. Routes to one skill without executing marketing work itself

## How to Use

1. **First run always**: Load `marketing-context` to create `.claude/product-marketing-context.md` with brand voice, personas, ICP, and competitive landscape. Every other marketing skill reads this file before starting — without it, output is generic. If the file already exists, read it for context before any marketing task.

2. **Route to the right pod**: If unsure which skill covers your request, read `marketing-ops`. Its routing matrix maps user phrasings (e.g., "write a blog post", "SEO audit", "optimize my landing page") to the correct specialist skill with NOT-this disambiguation. Route table is organized by pod for quick scanning.

3. **Load ONE specialist skill**: Read only the SKILL.md for the skill you need. Never bulk-load multiple skills — each specialist SKILL.md is self-contained with its own workflow, tooling, and quality gates.

4. **Python tools**: Each skill ships 2-3 stdlib-only Python scripts under `scripts/`. Run `python3 <skill>/scripts/<tool>.py --help` for CLI usage. Most tools include embedded sample data — run with no arguments for demo mode. Common output flags: `--output json` for pipeline integration, `--sample` for demo output with realistic data. All tools are deterministic with zero external dependencies — no pip install, no API keys, no ML models.

5. **Campaign orchestration**: For multi-skill campaigns, use `marketing-ops` with the campaign sequence templates:
   - **Product Launch**: marketing-context → launch-strategy → content-strategy → copywriting → email-sequence → social-content → paid-ads + ad-creative → analytics-tracking → campaign-analytics
   - **Content Campaign**: content-strategy → seo-audit → content-production → content-humanizer → schema-markup → social-content → email-sequence
   - **CRO Sprint**: page-cro → copywriting → form-cro/signup-flow-cro → ab-test-setup → analytics-tracking → campaign-analytics
   Use the campaign tracker tool (`python3 skills/marketing-ops/scripts/campaign_tracker.py`) to assign owners, deadlines, and track overdue items.

6. **Cross-domain routing**: Some requests route outside marketing:
   - Revenue operations, sales engineering, customer success → `business-growth/`
   - Landing page code components → `product-team/`
   - CMO-level strategic decisions → `c-level-advisor/`
   - Email template code → `engineering-team/`

7. **Quality gates**: Before output reaches the user, verify: marketing context was checked, bottom-line-first communication, actions have owners and deadlines, related skills referenced for next steps, cross-domain skills flagged when relevant.

## Tools & Integration

Each skill ships deterministic Python tools in its `scripts/` directory. All are stdlib-only, no `pip install` required. Standard patterns:

- **`--help`** — full CLI documentation with argument descriptions, default values, and examples
- **`--sample`** or **no args** — run with embedded demo data showing realistic output
- **`--output json`** — machine-readable JSON for pipeline integration (default is human-readable markdown)
- **Exit codes**: 0 = success, 1 = validation error, 2 = input error, 3 = configuration error, 4+ = domain-specific codes

Key tools by pod:
- **Content**: `quality_gate.py`, `brand_voice_analyzer.py`, `ai_content_scorer.py`, `humanizer.py`, `headline_scorer.py`, `readability_scorer.py`
- **SEO/AEO**: `aeo_audit.py` (E-E-A-T scoring 0-100, 8 industry thresholds), `aeo_optimizer.py` (3 rewrite modes + schema injection), `citation_tracker.py` (local-first citation ledger, verdicts EARLY/EMERGING/STRONG)
- **CRO**: `cro_audit.py`, `form_analyzer.py`, `funnel_optimizer.py`, `test_designer.py`, `sample_size_calculator.py`
- **Channels**: `email_scorer.py`, `ad_creative_generator.py`, `engagement_analyzer.py`, `hashtag_researcher.py`
- **Growth**: `pricing_designer.py`, `launch_checklist.py`, `churn_diagnostic.py`, `referral_calculator.py`
- **Intelligence**: `attribution_modeler.py`, `tracking_audit.py`, `competitor_analyzer.py`, `engagement_calculator.py`, `prompt_tester.py`
- **Sales Enablement**: `positioning_scorer.py`, `battlecard_generator.py`, `brand_audit.py`
- **Marketing Ops**: `campaign_tracker.py` (per-task status, owners, deadlines, overdue flags), `routing_matrix.py`

## Forcing Questions

When a request is ambiguous, ask these questions one at a time with a recommended answer. Follow Matt Pocock grill discipline: one question per turn, provide a recommended answer and a citation for why the answer is correct.

1. **Do you have marketing context set up?** If `.claude/product-marketing-context.md` doesn't exist, run `marketing-context` first — every skill works 3x better with brand voice, ICP, and competitive landscape defined. Without context, output is generic advice rather than brand-specific guidance.

2. **Is this a single task or a multi-step campaign?** If the request spans multiple steps (plan → create → promote → measure), use `marketing-ops` for campaign orchestration with the appropriate sequence template. Single tasks route to individual specialist skills. Mixing them wastes context window and produces disjointed output.

3. **What's your primary conversion goal?** Content and SEO build awareness at the top of funnel; CRO and landing pages convert existing traffic; email and ads drive re-engagement and retargeting. The primary goal determines which pod to route to — trying to optimize for everything at once means nothing gets optimized.

4. **Do you need search engine visibility or AI answer engine citation?** SEO optimizes for Google/Bing rankings using technical factors, backlinks, and keyword targeting. AEO optimizes for citation in LLM responses (ChatGPT, Perplexity, Claude, Gemini, Mistral) using E-E-A-T signals, structured data, and citation-worthy formatting. These are distinct disciplines — choosing the wrong one means optimizing for the wrong discovery channel.

5. **Is analytics tracking already set up?** Before running experiments, launching campaigns, or optimizing conversion, ensure `analytics-tracking` has been configured. Without proper GA4 event taxonomy, UTM strategy, and conversion tracking, none of your results can be measured. The answer to "did it work?" must be data, not opinion.

6. **Is this B2B or B2C?** Channel selection, copy voice, funnel depth, conversion tactics, and measurement frameworks differ significantly. B2B routes toward cold-email, LinkedIn ads, webinar-marketing, and demand-gen with longer sales cycles. B2C routes toward paid-ads, social-content, popup-cro, and shorter conversion loops with higher volume. Most B2B SaaS also has a PLG motion — split the strategy accordingly.

## Anti-Patterns

- **Do not read all 48 SKILL.md files** — load only the specialist skill you need. Bulk-loading wastes context window and produces disjointed output.
- **Do not skip marketing context** — without `.claude/product-marketing-context.md`, output is generic advice rather than brand-specific guidance. Every skill reads this file.
- **Do not use content-creator** — it is deprecated. Use `content-production` for writing tasks or `content-strategy` for planning.
- **Do not install pip packages** for Python tools — all 59+ scripts are stdlib-only. If a script prompts for a pip install, something is wrong.
- **Do not mix SEO and AEO** — they optimize for different discovery channels (search engines vs AI answer engines). Choose the right one based on where your audience finds information.
- **Do not run experiments without tracking** — `analytics-tracking` must be configured before any A/B test, campaign launch, or conversion optimization sprint.

## Pod Interaction Map

Understanding how pods feed into each other enables efficient campaign design:

- **Content → SEO/AEO**: Written content must be optimized for both search engines and AI answer engines simultaneously. Run `content-production` then route to `seo-audit` or `aeo` for optimization.
- **CRO ← Intelligence**: Conversion optimization without measurement is guessing. Always ensure `analytics-tracking` is configured and `campaign-analytics` can measure before running CRO experiments.
- **Channels → Growth**: Channel execution feeds growth programs. `email-sequence` nurtures referrals; `paid-ads` amplifies launch campaigns; `social-content` drives free tool distribution.
- **Sales Enablement ← Content**: `marketing-strategy-pmm` positioning feeds `copywriting` messaging, which feeds `content-production` and `email-sequence` execution.
- **Marketing Ops → All**: `marketing-context` provides brand voice consumed by every content/channel skill. `marketing-ops` routing ensures the right specialist is engaged for each task.

## Source & Attribution

This skill pack is derived from `claude-code-skills` marketing-skill plugin (v2.11.2) by Alireza Rezvani and the claude-skills team. The original repository provides 362 production-ready skills across 18 domains with 644 Python automation tools, 741 reference guides, 102 agents, and 116 slash commands distributed as 88 marketplace plugins. Licensed under MIT.
