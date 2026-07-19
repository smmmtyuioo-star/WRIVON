---
name: github-workflow
description: GitHub workflow management — issues, PRs, code review, CI, releases. Use when working with GitHub features from the terminal.
---

# GitHub Workflow

Work effectively with GitHub from the terminal using `gh` CLI.

## Authentication

```bash
gh auth login
gh auth status
```

## Issues

```bash
# List issues
gh issue list --assignee "@me"
gh issue list --label bug

# View issue
gh issue view 123

# Create issue
gh issue create --title "Bug: ..." --body "Steps to reproduce: ..." --label bug

# Close issue
gh issue close 123 --comment "Fixed in #456"
```

## Pull Requests

```bash
# Create PR
gh pr create --title "Feature: ..." --body "Closes #123" --fill

# List PRs
gh pr list --state open --review-requested "@me"

# Review PR
gh pr review 456 --approve --body "LGTM"
gh pr review 456 --request-changes --body "Please fix..."

# Check PR status
gh pr checks 456

# Merge PR
gh pr merge 456 --squash --delete-branch
```

## CI / Actions

```bash
# List workflows
gh workflow list

# Run workflow
gh workflow run test.yml --ref main

# Check run status
gh run watch
```

## Repo management

```bash
# View repo
gh repo view

# Clone repo
gh repo clone owner/repo

# Fork and clone
gh repo fork owner/repo --clone

# Create repo
gh repo create my-new-repo --public --source=. --push
```

## Best practices

- Create feature branches: `git checkout -b feat/description`
- Keep PRs small and focused (one logical change)
- Write descriptive PR titles and bodies
- Request reviews from the right people
- Respond to review feedback with new commits (don't force-push)
- Squash merge for feature branches
- Delete branches after merge
