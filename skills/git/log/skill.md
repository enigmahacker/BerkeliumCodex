---
name: git-log
version: 1.0.0
description: Inspects commit history, author attribution, commit messages, and hash references.
category: git
risk: safe
requires_permission: false
required_tools:
  - git_log
optional_tools:
  - shell_execute
---

# Git Commit History Inspection

## Purpose
Trace commit lineage, recent changes, commit messages, and author attributions.

## When to Activate
Activate when understanding recent codebase changes, tracking regressions, or writing changelogs.

## Required Tools
- `git_log`

## Optional Tools
- `shell_execute`

## Inputs
Commit limit (default 10), file path filter, oneline flag.

## Preconditions
Repository must contain at least one commit.

## Procedure
1. Call git_log with limit and optional file path filter.
2. Extract commit hash, author, timestamp, and message for each entry.
3. Trace commit progression to identify when regressions or features were introduced.
4. Return structured commit history array.

## Tool Usage
Call git_log with limit parameter.

## Safety
Read-only inspection.

## Permissions
Safe operation.

## Verification
Confirm commits are returned in chronological order.

## Failure Handling
If repository has zero commits, report initial commit pending.

## Output Contract
Array of GitCommit objects with hash, author, date, message.

## Examples
Inspecting the last 5 commits on branch main.

## Related Skills
- `git-status`
- `git-diff`
