---
name: filesystem-write-file
version: 1.0.0
description: Creates new files or writes complete content with parent directory provisioning.
category: filesystem
risk: medium
requires_permission: true
required_tools:
  - write_file
optional_tools:
  - read_file
---

# Atomic File Creation & Writing

## Purpose
Create new files or overwrite existing files cleanly with atomic directory creation.

## When to Activate
Activate when scaffolding new source files, writing new tests, or generating schemas.

## Required Tools
- `write_file`

## Optional Tools
- `read_file`

## Inputs
Target file path, content string, overwrite boolean flag.

## Preconditions
Target path must reside inside the workspace root.

## Procedure
1. Resolve target path and verify workspace boundaries.
2. If file already exists and overwrite is false, abort or prompt for confirmation.
3. Provision parent directories recursively if missing.
4. Write content atomically to disk.
5. Verify file was written and matches expected size.

## Tool Usage
Invoke write_file with target path and content string.

## Safety
Never overwrite critical existing files without explicit user intent or prior backup.

## Permissions
Requires filesystem write permission.

## Verification
Perform read_file or check file stats to confirm content integrity.

## Failure Handling
If disk is write-protected or EACCES occurs, request elevated capability.

## Output Contract
Success confirmation with written byte count and target file path.

## Examples
Creating a new test file tests/unit/chat-schema.test.ts.

## Related Skills
- `filesystem-edit-file`
- `filesystem-delete-file`
