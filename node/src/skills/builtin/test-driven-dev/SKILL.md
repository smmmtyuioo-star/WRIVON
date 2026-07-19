---
name: test-driven-development
description: Test-driven development workflow — write failing test first, implement minimal code, verify pass, then refactor. Use when building new features or fixing bugs.
---

# Test-Driven Development

Follow the Red-Green-Refactor cycle.

## Cycle

1. **Red** — Write a failing test that describes the desired behavior
   - Test the public API, not internals
   - Cover: happy path, edge cases, error conditions
   - Run it — confirm it fails with the expected message

2. **Green** — Write the minimal code to make the test pass
   - Don't over-engineer — just enough to pass
   - Hardcode if that's the simplest thing that works
   - Run the test — confirm it passes

3. **Refactor** — Improve the code while keeping tests green
   - Extract duplication, rename things, simplify
   - Add missing edge case handling
   - Run tests after each change

## Principles

- Test behaviors, not implementations
- One assertion per test (or one logical concept)
- Tests should be fast and deterministic
- Tests are documentation — name them clearly
- Don't test framework internals or third-party code

## What to test

| Layer | What to test | Example |
|-------|-------------|---------|
| Pure functions | Return values for given inputs | `add(2, 3) === 5` |
| Stateful logic | State transitions, side effects | `store.dispatch(action)` updates state |
| API endpoints | Status codes, response bodies, errors | `GET /users` returns 200 + array |
| UI components | Render output, user interactions | Click button calls handler |
| Integration | Multi-component behavior | Form submit → API call → redirect |

## Testing patterns

- **Mock** external dependencies (network, filesystem, time)
- **Stub** expensive or unreliable operations
- **Fixture** shared test data in factories or builders
- **Parametrize** one test with multiple inputs/outputs
