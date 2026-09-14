---
name: github-issues
version: 1.0.0
description: Lists, inspects, comments on, and creates GitHub issues with structured triage tags.
category: github
risk: low
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - http_request
---

# GitHub Issue Triage & Management

## Purpose
Interact with GitHub issues to fetch bug reproductions, feature requests, or add triage notes.

## When to Activate
Activate when resolving reported issues or filing new bug reports.

## Required Tools
- `shell_execute`

## Optional Tools
- `http_request`

## Inputs
Issue number, title, body, labels, state filter (open/closed).

## Preconditions
gh CLI installed and authenticated, or GITHUB_TOKEN configured.

## Procedure
1. Query issues via gh issue list or view.
2. Parse issue description, error logs, and reproduction steps.
3. If creating an issue: validate that title, body, and labels follow repository templates.
4. Call gh issue create or gh issue comment.
5. Return issue URL and identifier.

## Tool Usage
Execute gh issue commands via shell_execute.

## Safety
Do not spam or post automated comments without user consent.

## Permissions
Requires network and GitHub write permission.

## Verification
Confirm issue status or comment was posted successfully.

## Failure Handling
If gh CLI is missing, output formatted markdown issue for manual posting.

## Output Contract
GitHubIssue with number, title, state, url.

## Examples
Fetching issue #42 to inspect crash reproduction details.

## Related Skills
- `github-pull-requests`
- `code-debugging`
