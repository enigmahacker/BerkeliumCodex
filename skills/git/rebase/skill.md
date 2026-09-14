---
name: git-rebase
version: 1.0.0
description: Rebases active branch onto upstream tracking branch for clean linear commit history.
category: git
risk: high
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - git_status
---

# Git Linear History Rebase

## Purpose
Replay local commits on top of upstream branch to maintain linear history.

## When to Activate
Activate when updating a branch against origin/main before PR submission.

## Required Tools
- `shell_execute`

## Optional Tools
- `git_status`

## Inputs
Upstream branch name (e.g. origin/main).

## Preconditions
Working tree must be clean; all local changes committed.

## Procedure
1. Confirm clean working tree with git_status.
2. Execute git rebase <upstream> via shell_execute.
3. If clean: report success with rebased commit count.
4. If conflict occurs: pause and trigger git-conflict-resolution or abort if requested.

## Tool Usage
Execute git rebase via shell_execute.

## Safety
NEVER rebase public shared branches that others are actively building on.

## Permissions
High risk operation; requires explicit user permission.

## Verification
Verify git log shows commits replayed linearly atop upstream.

## Failure Handling
If rebase conflicts are too complex, execute git rebase --abort safely.

## Output Contract
RebaseResult with status (success/aborted/conflicted).

## Examples
Rebasing local main onto origin/main.

## Related Skills
- `git-merge`
- `git-conflict-resolution`
