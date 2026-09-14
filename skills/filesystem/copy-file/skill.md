---
name: filesystem-copy-file
version: 1.0.0
description: Duplicates files or templates across workspace locations.
category: filesystem
risk: low
requires_permission: true
required_tools:
  - copy_file
optional_tools:
  - file_metadata
---

# File Duplication & Template Cloning

## Purpose
Duplicate existing files, config templates, or fixtures without modifying source.

## When to Activate
Activate when bootstrapping new test suites from existing examples or cloning configs.

## Required Tools
- `copy_file`

## Optional Tools
- `file_metadata`

## Inputs
Source file path, destination file path, overwrite boolean.

## Preconditions
Source path must exist and be readable.

## Procedure
1. Verify source file existence.
2. Check if destination exists; if so, verify overwrite flag.
3. Ensure parent directory of destination is created.
4. Execute copy_file.
5. Verify identical byte sizes between source and destination.

## Tool Usage
Call copy_file with source and destination.

## Safety
Prevent circular copy loops when copying directories.

## Permissions
Requires filesystem write permission.

## Verification
Confirm destination file size matches source.

## Failure Handling
If copy fails due to disk space or permissions, report specific OS error.

## Output Contract
Copy confirmation object with byte count.

## Examples
Copying template.env to .env.local.

## Related Skills
- `filesystem-write-file`
- `filesystem-move-file`
