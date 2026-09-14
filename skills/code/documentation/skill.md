---
name: code-documentation
version: 1.0.0
description: Generates and maintains API documentation, developer guides, READMEs, and changelogs.
category: code
risk: low
requires_permission: true
required_tools:
  - read_file
  - write_file
  - edit_file
optional_tools:
  - search_files
---

# Technical Documentation Authoring

## Purpose
Produce accurate, repository-grounded documentation for developers, contributors, and users.

## When to Activate
Activate when releasing new features, documenting skills, updating APIs, or writing guides.

## Required Tools
- `read_file`
- `write_file`
- `edit_file`

## Optional Tools
- `search_files`

## Inputs
Source file paths, feature overview, audience (user, developer, contributor).

## Preconditions
Target codebase components must be implemented and tested.

## Procedure
1. Inspect code interfaces and exported types to understand API surface.
2. Read existing documentation (README.md, docs/) to match voice and formatting.
3. Author markdown documentation with clear headers, code snippets, and usage examples.
4. Verify all code snippets in the documentation compile and work.
5. Update CHANGELOG.md with summary of changes under current version.

## Tool Usage
Use read_file to inspect APIs, write_file/edit_file to save documentation.

## Safety
Do not leak sensitive internal credentials, machine paths, or private host details.

## Permissions
Requires filesystem edit permission.

## Verification
Check that all markdown links and code snippet examples are valid.

## Failure Handling
If document formatting is inconsistent, reformat following standard GFM syntax.

## Output Contract
Markdown document file path and generated section summary.

## Examples
Authoring docs/PROVIDER_GUIDE.md for custom LLM provider authors.

## Related Skills
- `filesystem-write-file`
- `code-code-review`
