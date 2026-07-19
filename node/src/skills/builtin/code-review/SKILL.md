---
name: code-review
description: Review code changes for bugs, security issues, performance problems, and style violations. Use when the user asks for a code review, /review, or wants changes checked before committing.
---

# Code Review

Review the given code changes thoroughly. Work through each phase in order and output findings sorted by severity.

## Phase 1: Understand the change

- Read the diff or the files changed
- Identify what the change is trying to accomplish
- Note any files touched and their roles in the project

## Phase 2: Check for correctness

- Logic errors: off-by-one, wrong operators, inverted conditions
- Race conditions in async code (missing awaits, unhandled promises)
- Edge cases: empty inputs, null/undefined, boundary values
- Type errors: mismatched types, missing generics, any-casting
- API misuse: wrong method signatures, missing required params

## Phase 3: Check for security

- Command injection: string building for shell exec
- Path traversal: unsanitized user input in file ops
- Secrets: hardcoded keys, tokens, passwords
- XSS: unescaped user input in HTML/template output
- SQL injection: string concatenation in queries
- Insecure crypto: homemade encryption, weak algorithms

## Phase 4: Check for performance

- Unnecessary allocations in hot paths
- N+1 queries in loops
- Missing caching for expensive operations
- Large payloads sent unnecessarily
- Blocking the event loop (sync I/O, heavy computation)

## Phase 5: Check for maintainability

- Dead code, commented-out code
- Duplicated logic that should be extracted
- Magic numbers/strings without named constants
- Overly complex functions (break them down)
- Missing error handling
- Inconsistent naming or style

## Phase 6: Check for test coverage

- Are there tests for the new/ changed code?
- Do tests cover edge cases and error paths?
- Are existing tests still passing?

## Output format

```
## Findings

### Critical
- `file.ts:42` — Description of the issue

### High
- ...

### Medium
- ...

### Low / Style
- ...
```
