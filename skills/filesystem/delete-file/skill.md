---
name: filesystem-delete-file
version: 1.0.0
description: Safely removes files with confirmation gates and dependency warnings.
category: filesystem
risk: destructive
requires_permission: true
required_tools:
  - delete_file
optional_tools:
  - git_status
---

# Safe File Deletion & Cleanup

## Purpose
Delete obsolete or temporary files safely with explicit impact confirmation.

## When to Activate
Activate when cleaning up generated scratch files, obsolete tests, or dead code.

## Required Tools
- `delete_file`

## Optional Tools
- `git_status`

## Inputs
Target file path.

## Preconditions
Target must not be a critical root file (.git, package.json, AGENTS.md).

## Procedure
1. Resolve file path and verify target is not a protected repository file.
2. Check if file is tracked in git and whether there are uncommitted changes.
3. Request explicit permission if file is significant.
4. Invoke delete_file.
5. Verify file no longer exists.

## Tool Usage
Call delete_file with path.

## Safety
NEVER delete files recursively without individual confirmation.

## Permissions
Strict DESTRUCTIVE permission tier; requires user authorization.

## Verification
Confirm target file no longer exists on filesystem.

## Failure Handling
If file is locked or permission denied, abort and explain lock reason.

## Output Contract
Deletion confirmation object with path and status.

## Examples
Deleting a temporary scratch script scratch/debug.js.

## Related Skills
- `filesystem-write-file`
- `git-status`
