---
name: web-documentation-research
version: 1.0.0
description: Prioritizes official documentation, API references, and formal language specifications.
category: web
risk: safe
requires_permission: false
required_tools:
  - web_search
  - web_open
optional_tools:
  []
---

# Official Documentation & Specification Research

## Purpose
Locate authoritative documentation from original package maintainers and language authors.

## When to Activate
Activate when checking function signatures, deprecation notices, or configuration schemas.

## Required Tools
- `web_search`
- `web_open`

## Optional Tools
None.

## Inputs
Package name, API symbol, framework version.

## Preconditions
Target package and version should be identified.

## Procedure
1. Identify the official documentation domain (e.g. react.dev, nodejs.org, python.org).
2. Constrain search to official site using site: query modifier.
3. Locate exact API reference page for the specified version.
4. Extract method signature, parameter types, return value, and exceptions.
5. Check deprecation notes and migration recommendations.

## Tool Usage
Call web_search with site: filter, then web_open on official API docs.

## Safety
Do not trust unofficial blogs, content mills, or automated scraper mirrors over primary documentation.

## Permissions
Safe read-only network operation.

## Verification
Check that retrieved documentation matches the project installed version.

## Failure Handling
If official site is unreachable, check official GitHub repository README or wiki.

## Output Contract
DocReference with apiName, signature, officialUrl, versionNotes.

## Examples
Checking the signature of Vitest vi.mock() in official documentation.

## Related Skills
- `web-web-open`
- `code-symbol-search`
