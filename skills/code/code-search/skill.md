---
name: code-code-search
version: 1.0.0
description: Searches codebase for text patterns, function calls, or error codes using ripgrep semantics.
category: code
risk: safe
requires_permission: false
required_tools:
  - search_files
optional_tools:
  - read_file
---

# Codebase Pattern & Text Search

## Purpose
Rapidly locate code patterns, imports, error strings, or API usages across the workspace.

## When to Activate
Activate when investigating bug reports, tracing variable usages, or auditing callsites.

## Required Tools
- `search_files`

## Optional Tools
- `read_file`

## Inputs
Search query string, file glob filter, case-sensitivity flag, regex flag.

## Preconditions
Workspace must be indexed or readable.

## Procedure
1. Formulate search query (literal string or regex).
2. Apply file extension filters (e.g. *.ts, *.py) to eliminate noise.
3. Exclude build directories and package managers.
4. Execute search_files.
5. Group matches by file and line number.

## Tool Usage
Invoke search_files with query, filePattern, and regex parameters.

## Safety
Avoid unbounded regexes that cause catastrophic backtracking.

## Permissions
Safe read-only operation.

## Verification
Check that returned matches correspond to actual lines in the source files.

## Failure Handling
If no matches found, try case-insensitive or partial keyword search.

## Output Contract
Array of CodeMatch objects with file, line, and matchedText.

## Examples
Finding all occurrences of AgentRuntime in the repository.

## Related Skills
- `code-symbol-search`
- `filesystem-read-file`
