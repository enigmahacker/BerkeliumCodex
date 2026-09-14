---
name: git-stash
version: 1.0.0
description: Temporarily stashes uncommitted changes to allow branch switching or clean testing.
category: git
risk: low
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - git_status
---

# Git Working Tree Stashing

## Purpose
Shelve uncommitted modifications safely and restore them later.

## When to Activate
Activate when needing a clean tree to test upstream or switch branches temporarily.

## Required Tools
- `shell_execute`

## Optional Tools
- `git_status`

## Inputs
Stash action (push, pop, list, drop), message description.

## Preconditions
Uncommitted changes must exist in working tree.

## Procedure
1. Check git_status to identify changes to stash.
2. Execute git stash push -m "description" via shell_execute.
3. Confirm working tree is now clean.
4. Perform required task (e.g. pull, switch branch).
5. When ready, execute git stash pop to restore shelved work.

## Tool Usage
Execute git stash commands via shell_execute.

## Safety
Do not drop stashes without verifying their contents.

## Permissions
Requires git write permission.

## Verification
Confirm stash list contains the saved entry.

## Failure Handling
If stash pop causes conflicts, keep stash entry and enter conflict resolution.

## Output Contract
StashResult with stashId, action, status.

## Examples
Stashing WIP code to run clean benchmark comparisons.

## Related Skills
- `git-status`
- `git-rollback`
