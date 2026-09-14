---
name: git-rollback
version: 1.0.0
description: Safely undos accidental changes, reverts commits, and restores files without data loss.
category: git
risk: destructive
requires_permission: true
required_tools:
  - git_restore
optional_tools:
  - shell_execute
  - git_diff
---

# Safe Git Rollback & Reversion

## Purpose
Revert uncommitted changes or create revert commits while protecting user work.

## When to Activate
Activate when a refactoring attempt fails irrecoverably or uncommitted edits are discarded.

## Required Tools
- `git_restore`

## Optional Tools
- `shell_execute`
- `git_diff`

## Inputs
Target file path or commit hash, rollback scope (file, working tree, commit).

## Preconditions
Target modifications must be inspected with git_diff before discarding.

## Procedure
1. CRITICAL: Review git_diff of target changes before discarding anything.
2. If reverting a single file: call git_restore with target file path.
3. If reverting a committed change: execute git revert <hash> --no-edit to preserve history.
4. PROHIBITED: Never execute git reset --hard or git clean -fd without explicit user authorization.
5. Verify working tree status after rollback.

## Tool Usage
Call git_restore or git revert via shell_execute.

## Safety
Require explicit user confirmation for any operation that permanently deletes uncommitted code.

## Permissions
Destructive tier; requires explicit confirmation.

## Verification
Confirm target files are restored to clean state.

## Failure Handling
If rollback fails, abort and report error.

## Output Contract
RollbackResult with restoredFiles: string[], status.

## Examples
Discarding failed experimental edits in scratch/test.js.

## Related Skills
- `git-status`
- `git-diff`
- `filesystem-delete-file`
