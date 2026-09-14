---
name: git-commit
version: 1.0.0
description: Stages modified files and authors conventional, descriptive Git commits.
category: git
risk: low
requires_permission: true
required_tools:
  - git_commit
optional_tools:
  - git_status
  - git_diff
---

# Conventional Git Commit Authoring

## Purpose
Stage verified modifications and create atomic, conventional commit messages.

## When to Activate
Activate after verified code modifications, bugfixes, or feature completions.

## Required Tools
- `git_commit`

## Optional Tools
- `git_status`
- `git_diff`

## Inputs
Commit message string, file paths to stage (optional, defaults to all modified).

## Preconditions
Changes must pass verification tests and linter before committing.

## Procedure
1. Check git_status to review modified files.
2. Verify that no tracked secret files or temporary artifacts are being staged.
3. Formulate conventional commit message (type(scope): description e.g. feat(cli): ...).
4. Call git_commit with message and target files.
5. Verify new commit hash was created.

## Tool Usage
Call git_commit with message and optional files array.

## Safety
Never commit secrets, API keys, credentials, or build output.

## Permissions
Requires git write permission.

## Verification
Confirm git_log shows the new commit at HEAD.

## Failure Handling
If commit fails due to pre-commit hook, inspect hook output, remediate, and retry.

## Output Contract
CommitResult with commitHash, branch, filesCommitted count.

## Examples
Committing fix for state machine transition validation.

## Related Skills
- `git-status`
- `git-diff`
- `core-verification`
