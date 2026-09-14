---
name: github-code-search
version: 1.0.0
description: Searches remote GitHub repositories for code patterns, API usages, and reference examples.
category: github
risk: safe
requires_permission: false
required_tools:
  - shell_execute
optional_tools:
  - http_request
---

# GitHub Remote Code Search

## Purpose
Find real-world implementations, open-source usage patterns, or upstream library examples.

## When to Activate
Activate when integrating an undocumented API or seeking reference implementations.

## Required Tools
- `shell_execute`

## Optional Tools
- `http_request`

## Inputs
Query string, language filter, repository or organization filter.

## Preconditions
gh CLI with search extension or internet connectivity.

## Procedure
1. Construct targeted search query with language: and repo: filters.
2. Execute gh search code <query> via shell_execute.
3. Parse matching repository names, file paths, and snippet lines.
4. Extract idiomatic usage patterns.
5. Return structured code search results.

## Tool Usage
Execute gh search code via shell_execute.

## Safety
Treat remote code as reference; sanitize before incorporating into workspace.

## Permissions
Safe read-only network operation.

## Verification
Check that search results point to valid GitHub repository files.

## Failure Handling
If rate limited, fall back to local search or web search.

## Output Contract
Array of GitHubCodeMatch with repository, path, snippet.

## Examples
Searching GitHub for MLX multi-modal tensor streaming patterns.

## Related Skills
- `code-code-search`
- `web-documentation-research`
