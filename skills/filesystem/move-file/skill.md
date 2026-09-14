---
name: filesystem-move-file
version: 1.0.0
description: Renames or relocates files across directory hierarchies while preserving Git history.
category: filesystem
risk: medium
requires_permission: true
required_tools:
  - move_file
optional_tools:
  - git_status
---

# File Relocation & Rename

## Purpose
Move files cleanly across directories, updating imports if code files are moved.

## When to Activate
Activate when reorganizing package structure or renaming files.

## Required Tools
- `move_file`

## Optional Tools
- `git_status`

## Inputs
Source file path, destination file path.

## Preconditions
Source must exist; destination parent directory must exist or be created.

## Procedure
1. Validate source and destination paths inside workspace.
2. Verify destination does not accidentally overwrite an unrelated file.
3. Execute move_file.
4. If in a Git repository, use git mv when appropriate.
5. Verify file presence at destination.

## Tool Usage
Call move_file with source and destination paths.

## Safety
Ensure destination does not conflict with existing files.

## Permissions
Requires filesystem write permission.

## Verification
Verify destination exists and source is gone.

## Failure Handling
If move fails, roll back any created intermediate files.

## Output Contract
Move confirmation object with oldPath and newPath.

## Examples
Moving legacy config from config.json to .berkelium/config.json.

## Related Skills
- `filesystem-copy-file`
- `code-refactoring`
