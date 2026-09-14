---
name: git-merge
version: 1.0.0
description: Merges branches with fast-forward evaluation and conflict detection.
category: git
risk: medium
requires_permission: true
required_tools:
  - git_merge
optional_tools:
  - shell_execute
  - git_status
---

# Git Branch Merging

## Purpose
Integrate feature branch changes into target branch cleanly.

## When to Activate
Activate when incorporating approved feature work into main or developing release branches.

## Required Tools
- `git_merge`

## Optional Tools
- `shell_execute`
- `git_status`

## Inputs
Source branch name, merge strategy.

## Preconditions
Working tree must be clean before initiating merge.

## Procedure
1. Verify working tree is clean via git_status.
2. Ensure current branch is the intended target branch.
3. Call git_merge with source branch name.
4. Check if merge completed cleanly (Fast-Forward or Merge commit).
5. If merge conflicts arise, trigger git-conflict-resolution.

## Tool Usage
Call git_merge with source branch.

## Safety
Never force merge without understanding divergence.

## Permissions
Requires git write permission.

## Verification
Verify that HEAD points to merged tree and git status is clean.

## Failure Handling
If conflicts occur, do not abort blindly; inspect conflicted files.

## Output Contract
MergeResult with status (clean/conflicted), mergedFiles: string[].

## Examples
Merging feat/chat-protocol into main.

## Related Skills
- `git-conflict-resolution`
- `git-status`
