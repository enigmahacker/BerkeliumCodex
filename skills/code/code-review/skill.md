---
name: code-code-review
version: 1.0.0
description: Audits code changes for security flaws, architectural invariants, performance bottlenecks, and style.
category: code
risk: safe
requires_permission: false
required_tools:
  - git_diff
  - read_file
optional_tools:
  - search_files
---

# Automated Code Review & Invariant Audit

## Purpose
Review proposed diffs against AGENTS.md architectural boundaries and security requirements.

## When to Activate
Activate prior to creating pull requests, committing code, or completing tasks.

## Required Tools
- `git_diff`
- `read_file`

## Optional Tools
- `search_files`

## Inputs
Git diff or branch comparison.

## Preconditions
Changes must be staged or present in the working tree.

## Procedure
1. Generate diff using git_diff.
2. Check for security red flags (hardcoded secrets, unescaped shell inputs, path traversal).
3. Check for architectural invariant violations (provider coupling, direct UI execution).
4. Verify error handling and null safety on all new code paths.
5. Check that tests are included for new features or bug fixes.
6. Produce itemized review comments with line references.

## Tool Usage
Invoke git_diff to view unstaged and staged changes.

## Safety
Read-only analysis.

## Permissions
Safe operation.

## Verification
Confirm all review checklist items are explicitly evaluated.

## Failure Handling
If diff is too large, review file-by-file in chunks.

## Output Contract
CodeReviewReport with status (approved/changes_requested), issues list, and suggestions.

## Examples
Reviewing a PR adding LM Studio provider adapter for provider neutrality compliance.

## Related Skills
- `git-diff`
- `security-security-audit`
- `core-verification`
