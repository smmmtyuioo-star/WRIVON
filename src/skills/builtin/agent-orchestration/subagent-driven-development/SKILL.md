---
name: subagent-driven-development
description: Execute plans by dispatching subagents per task with 2-stage review.
---

# Subagent-Driven Development

Execute implementation plans by dispatching fresh `task` subagents per task with systematic two-stage review.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration.

## When to Use

- You have an implementation plan (from the `plan` skill or user requirements)
- Tasks are mostly independent
- Quality and spec compliance matter

## The Process

### 1. Read and Parse Plan

Read the plan file. Extract ALL tasks with their full text and context upfront.

### 2. Per-Task Workflow

For EACH task in the plan:

#### Step 1: Dispatch Implementer Subagent

```
task(goal="Implement Task 1: Create User model",
  prompt="TASK: Create src/models/user.py with User class...
   CONTEXT: Python 3.11, Flask app...
   FOLLOW TDD:
   1. Write failing test in tests/models/test_user.py
   2. Run: pytest tests/models/test_user.py -v
   3. Write implementation
   4. Run tests again
   5. Check no regressions: pytest tests/ -q
   6. Commit")
```

#### Step 2: Spec Compliance Review

```
task(goal="Verify spec compliance for Task 1",
  prompt="ORIGINAL SPEC: [full task text]
   CHECK:
   - All requirements implemented?
   - File paths match spec?
   - No scope creep?
   OUTPUT: PASS or list of specific gaps.")
```

**If spec issues found:** Fix gaps, re-review. Continue only when compliant.

#### Step 3: Code Quality Review

```
task(goal="Review code quality for Task 1",
  prompt="FILES: src/models/user.py, tests/models/test_user.py
   CHECK:
   - Follows project conventions?
   - Proper error handling?
   - Clear names?
   - Adequate test coverage?
   - Security issues?
   OUTPUT: Critical/Important/Minor issues + APPROVED or REQUEST_CHANGES")
```

**If quality issues found:** Fix, re-review. Continue only when approved.

#### Step 4: Mark Complete
Update the task tracking and proceed to next task.

### 3. Final Integration Review

After ALL tasks complete, dispatch a final reviewer:
```
task(goal="Integration review for entire implementation",
  prompt="All tasks complete. Review:
  - Do components work together?
  - Inconsistencies between tasks?
  - All tests passing?
  - Ready for merge?")
```

### 4. Verify

```
bash(command="pytest tests/ -q")
bash(command="git diff --stat")
```

## Task Granularity

**Each task = 2-5 minutes of focused work.**

| Too big | Right size |
|---------|-----------|
| "Implement user auth" | "Create User model", "Add password hashing", "Create login endpoint" |

## Red Flags

- Start without a plan
- Skip reviews
- Proceed with unfixed critical issues
- Dispatch implementers for tasks that touch the same files
- Skip context (subagent needs to understand where the task fits)
- Accept "close enough" on spec compliance
- Skip review loops (findings → fix → re-review)

## Efficiency Notes

**Why fresh subagent per task:**
- Prevents context pollution from accumulated state
- Each subagent gets clean, focused context

**Why two-stage review:**
- Spec review catches under/over-building early
- Quality review ensures solid implementation
- Catches issues before they compound across tasks

## Integration with Other Skills

- **plan** — This skill EXECUTES plans from the `plan` skill
- **test-driven-dev** — Implementers should follow TDD
- **code-review** — The two-stage review process IS the code review
