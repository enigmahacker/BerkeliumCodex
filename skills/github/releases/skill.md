---
name: github-releases
version: 1.0.0
description: Drafts, authors, and inspects GitHub Releases with semantic tags and changelogs.
category: github
risk: medium
requires_permission: true
required_tools:
  - shell_execute
  - read_file
optional_tools:
  []
---

# GitHub Release & Tag Management

## Purpose
Package release tags, changelog summaries, and asset binaries for GitHub releases.

## When to Activate
Activate when publishing a new version tag (e.g. v1.0.0) or releasing binaries.

## Required Tools
- `shell_execute`
- `read_file`

## Optional Tools
None.

## Inputs
Release tag, release title, changelog notes, asset files.

## Preconditions
Version in package.json and CHANGELOG.md must match release tag.

## Procedure
1. Read CHANGELOG.md to extract version notes.
2. Verify git status is clean and HEAD commit is tagged.
3. Author release notes highlighting breaking changes and new features.
4. Execute gh release create <tag> with notes and optional binary assets.
5. Return release URL.

## Tool Usage
Call gh release create via shell_execute.

## Safety
Do not publish releases without confirming clean benchmark and test passes.

## Permissions
Requires GitHub release creation permission.

## Verification
Verify release URL is active and assets are attached.

## Failure Handling
If release already exists, update existing release or abort.

## Output Contract
ReleaseInfo with tag, url, assets: string[].

## Examples
Drafting GitHub release v1.0.0 for Berkelium Codex.

## Related Skills
- `build-release`
- `code-documentation`
