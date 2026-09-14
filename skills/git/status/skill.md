---
name: git-status
version: 1.0.0
description: Inspects Git working tree status, staged files, unstaged modifications, and untracked artifacts.
category: git
risk: safe
requires_permission: false
required_tools:
  - git_status
optional_tools:
  - shell_execute
---

# Git Working Tree Status Inspection

## Purpose
Examine current branch, staged files, modified files, and untracked entries.

## When to Activate
Activate before making commits, before running tests, and after editing files.

## Required Tools
- `git_status`

## Optional Tools
- `shell_execute`

## Inputs
Working directory.

## Preconditions
Target directory must be inside an initialized Git repository.

## Procedure
1. Call git_status on the workspace root.
2. Parse current branch name and upstream divergence (ahead/behind).
3. Identify staged, unstaged, and untracked changes.
4. Flag any unexpected tracked files (e.g. node_modules, secrets, .DS_Store).
5. Return structured status record.

## Tool Usage
Invoke git_status.

## Safety
Safe read-only operation.

## Permissions
Safe read-only operation.

## Verification
Confirm Git status cleanly categorizes modified files.

## Failure Handling
If not a git repo, suggest running git init or bk init.

## Output Contract
GitStatusResult with branch, staged: string[], unstaged: string[], untracked: string[].

## Examples
Checking working tree status before staging commit.

## Related Skills
- `git-diff`
- `git-commit`
