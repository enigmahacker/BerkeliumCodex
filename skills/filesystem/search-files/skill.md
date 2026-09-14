---
name: filesystem-search-files
version: 1.0.0
description: Searches for files across the workspace by filename glob pattern or extension.
category: filesystem
risk: safe
requires_permission: false
required_tools:
  - search_files
optional_tools:
  - list_directory
---

# Workspace File Pattern Search

## Purpose
Locate files matching specific patterns (e.g. *.test.ts, *.json, Dockerfile).

## When to Activate
Activate when looking for test suites, config files, or specific component files.

## Required Tools
- `search_files`

## Optional Tools
- `list_directory`

## Inputs
Glob pattern or filename substring, search root directory.

## Preconditions
Search root must resolve within the workspace.

## Procedure
1. Sanitize glob pattern and resolve root directory.
2. Filter out ignored directories (node_modules, .git, dist).
3. Execute search_files.
4. Sort matching files by relevance and depth.
5. Return array of matched relative file paths.

## Tool Usage
Invoke search_files with pattern and root path.

## Safety
Ensure search does not enter infinite recursion on recursive symlinks.

## Permissions
Safe read-only operation.

## Verification
Check that returned paths exist and match the search pattern.

## Failure Handling
If no files match, broaden pattern or check parent directory.

## Output Contract
Array of matching relative file paths.

## Examples
Finding all Vitest test files matching **/*.test.ts.

## Related Skills
- `filesystem-list-files`
- `code-code-search`
