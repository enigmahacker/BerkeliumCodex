---
name: filesystem-list-files
version: 1.0.0
description: Lists directory contents with file type identification and size attributes.
category: filesystem
risk: safe
requires_permission: false
required_tools:
  - list_directory
optional_tools:
  - file_metadata
---

# Directory Listing & Inventory

## Purpose
Inspect directory hierarchies, discover repository structure, and locate project assets.

## When to Activate
Activate when exploring an unfamiliar codebase, scanning submodules, or inspecting output directories.

## Required Tools
- `list_directory`

## Optional Tools
- `file_metadata`

## Inputs
Target directory path (absolute or workspace-relative), recursive flag, ignore patterns.

## Preconditions
Target path must exist and resolve within the authorized workspace jail.

## Procedure
1. Resolve target directory path relative to workspace root.
2. Verify path does not escape workspace boundaries.
3. Call list_directory with target path and filtering patterns.
4. Distinguish between subdirectories, regular files, symlinks, and binary artifacts.
5. Format and return structured listing.

## Tool Usage
Invoke list_directory passing directory path and optional recursion flag.

## Safety
Path traversal attacks (e.g. ../../) must be blocked by the workspace jail.

## Permissions
Safe read-only operation.

## Verification
Confirm directory listing contains valid file names and entries.

## Failure Handling
If directory does not exist or is inaccessible, report ENOENT with suggested parent paths.

## Output Contract
Array of FileEntry objects containing name, path, type, and sizeBytes.

## Examples
Listing all source files in packages/agent/src.

## Related Skills
- `filesystem-read-file`
- `filesystem-search-files`
