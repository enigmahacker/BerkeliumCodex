---
name: filesystem-read-file
version: 1.0.0
description: Reads text file content safely with line slice constraints and binary detection.
category: filesystem
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - file_metadata
---

# Safe File Content Inspection

## Purpose
Retrieve file contents with line range slicing, avoiding context window bloat.

## When to Activate
Activate before editing any file, analyzing source logic, or parsing configurations.

## Required Tools
- `read_file`

## Optional Tools
- `file_metadata`

## Inputs
File path, start line (optional), end line (optional).

## Preconditions
Target file must exist and not be a binary executable or archive.

## Procedure
1. Resolve file path against workspace root.
2. Verify target is within permitted workspace jail.
3. Check file metadata to ensure it is text, not binary.
4. Read specific slice or whole file (max 800 lines per call).
5. Return numbered lines or raw content.

## Tool Usage
Invoke read_file with path, startLine, and endLine parameters.

## Safety
Do not read files larger than 1MB into model context without range slicing.

## Permissions
Safe read-only operation.

## Verification
Check that output content matches the requested line range.

## Failure Handling
If file is missing, suggest closest file match using search-files.

## Output Contract
String containing the requested file contents.

## Examples
Reading lines 1 to 50 of apps/cli/src/entrypoint.ts.

## Related Skills
- `filesystem-edit-file`
- `code-code-search`
