---
name: git-branch
version: 1.0.0
description: Lists, creates, switches, and manages local and tracking Git branches.
category: git
risk: low
requires_permission: true
required_tools:
  - git_branch
optional_tools:
  - shell_execute
---

# Git Branch Creation & Navigation

## Purpose
Isolate feature work on dedicated branches without mutating trunk/main branch directly.

## When to Activate
Activate when starting a new feature, bug fix, or creating an experimental spike.

## Required Tools
- `git_branch`

## Optional Tools
- `shell_execute`

## Inputs
Branch action (list, create, switch, delete), branch name.

## Preconditions
Working tree should be clean before switching branches.

## Procedure
1. Call git_status to ensure working directory is clean or changes are stashed.
2. If listing, call git_branch to list local and remote branches.
3. If creating, validate branch name adheres to conventions (e.g. feat/name, fix/name).
4. Create and switch to new branch using git_branch.
5. Verify current active branch matches target.

## Tool Usage
Call git_branch with action and branchName.

## Safety
Do not delete branches with unmerged work without explicit user confirmation.

## Permissions
Requires git write capability for create/delete/switch.

## Verification
Confirm git_status shows active branch as the requested branch.

## Failure Handling
If branch already exists, switch to it or prompt for a different name.

## Output Contract
BranchOperationResult with activeBranch, branches: string[].

## Examples
Creating and switching to feat/chat-protocol.

## Related Skills
- `git-status`
- `git-commit`
