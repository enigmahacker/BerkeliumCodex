---
name: filesystem-file-metadata
version: 1.0.0
description: Inspects file stats, permissions, timestamps, MIME types, and line counts.
category: filesystem
risk: safe
requires_permission: false
required_tools:
  - file_metadata
optional_tools:
  - read_file
---

# File Metadata & Stat Inspection

## Purpose
Retrieve detailed file system attributes including size, mode, timestamps, and line counts.

## When to Activate
Activate before reading large files or when validating executable bits on binaries.

## Required Tools
- `file_metadata`

## Optional Tools
- `read_file`

## Inputs
File path.

## Preconditions
Target file path must exist.

## Procedure
1. Resolve target path within workspace.
2. Retrieve file stat properties (size, mode, mtime, isFile, isDirectory).
3. Detect MIME type and line count for text files.
4. Check if executable bit (+x) is set.
5. Return structured metadata object.

## Tool Usage
Invoke file_metadata with target path.

## Safety
Do not follow broken or dangling symlinks without reporting them.

## Permissions
Safe read-only operation.

## Verification
Verify that metadata attributes are non-null.

## Failure Handling
If file is missing, return ENOENT status.

## Output Contract
FileMetadata object with sizeBytes, lineCount, isExecutable, mtime.

## Examples
Checking if apps/cli/dist/bin/berkelium.js has executable permissions.

## Related Skills
- `filesystem-read-file`
- `terminal-diagnostics`
