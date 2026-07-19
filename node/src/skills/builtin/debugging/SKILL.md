---
name: debugging
description: Systematic debugging methodology for diagnosing and fixing software bugs. Use when the user reports a bug, error, or unexpected behavior.
---

# Systematic Debugging

Follow this process to diagnose and fix bugs efficiently.

## Phase 1: Reproduce

- Get the exact steps, input, and environment that triggers the bug
- Confirm you can reproduce it consistently
- Note: does it happen every time or intermittently?

## Phase 2: Isolate

- Find the minimal reproduction case
- Binary search: comment out half the code, see if bug persists
- Check: is it in our code or a dependency?
- Check: was it introduced by a specific change? (git bisect)

## Phase 3: Diagnose

- Read the error message carefully — line numbers, stack trace
- Check input values at the failure point
- Check assumptions: is the data what you expect?
- Common causes:
  - Null/undefined when expecting an object
  - Wrong type (string vs number, sync vs async)
  - Race condition (missing await, shared mutable state)
  - Off-by-one in loops or array indices
  - Environment difference (dev vs prod, OS, Node version)

## Phase 4: Fix

- Write a test that reproduces the bug first
- Apply the minimal fix
- Verify: test passes, bug is gone in the real environment
- Check for similar patterns elsewhere in the codebase

## Phase 5: Prevent

- Could a type system change prevent this?
- Could a lint rule catch it?
- Should there be input validation?
- Document the root cause and fix in the commit message

## Output format

```
## Bug: [Description]

Root cause: [One sentence]
Fix: [What changed and why]
Verification: [How confirmed]
Prevention: [Any systemic fix applied]
```
