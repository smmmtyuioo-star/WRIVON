---
name: deep-research
description: Multi-source research with web searches, fact-checking, and cited report generation. Use when the user asks for research, investigation, or deep analysis of any topic.
---

# Deep Research

Conduct thorough multi-source research on the given topic. Follow this process:

## Phase 1: Scope

- Clarify the question if it's too broad
- Identify key subtopics to investigate
- Determine what evidence would constitute an answer

## Phase 2: Gather sources

- Use websearch to find relevant sources (docs, articles, papers, discussions)
- Use webfetch to read the most promising sources in full
- Prioritize: official docs > academic papers > reputable articles > forums
- Look for multiple independent sources on key claims

## Phase 3: Analyze

- Extract key facts, data points, and claims
- Note disagreements between sources
- Identify consensus vs. controversial positions
- Check publication dates — prefer current information

## Phase 4: Synthesize

- Organize findings by subtopic
- Weigh evidence for each claim
- Identify gaps in available information
- Note confidence level for each conclusion

## Phase 5: Report

Output a structured report:

```
# Research: [Topic]

## Summary
One-paragraph overview of findings.

## Key Findings
1. **[Claim]** — Evidence, sources, confidence
2. ...

## Open Questions
- What remains unclear or unresolved

## Sources
- [Title](URL) — brief note on relevance
```
