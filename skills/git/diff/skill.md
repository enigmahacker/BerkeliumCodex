---
name: git-diff
version: 1.0.0
description: Generates and analyzes unified diffs between working tree, index, or historical commits.
category: git
risk: safe
requires_permission: false
required_tools:
  - git_diff
optional_tools:
  - shell_execute
---

# Git Diff Inspection & Verification

## Purpose
Review precise lines added, deleted, or modified to ensure minimal patch footprint.

## When to Activate
Activate after code editing, before committing, and during verification loops.

## Required Tools
- `git_diff`

## Optional Tools
- `shell_execute`

## Inputs
Target file path (optional), staged flag, commit comparison range.

## Preconditions
Repository must be in a Git workspace with modifications.

## Procedure
1. Call git_diff with optional target path and staged flag.
2. Parse diff chunks (+ additions, - deletions).
3. Check that no accidental debug logs, comments, or secrets were introduced.
4. Verify diff matches the user intent without unintended side effects.
5. Return formatted unified diff.

## Tool Usage
Call git_diff.

## Safety
Read-only inspection.

## Permissions
Safe operation.

## Verification
Ensure diff corresponds accurately to modified files.

## Failure Handling
If diff is empty, verify whether changes were staged or if files were saved.

## Output Contract
String containing standard unified diff output.

## Examples
Inspecting diff on packages/agent/src/runtime.ts.

## Related Skills
- `git-status`
- `code-code-review`
- `core-verification`
