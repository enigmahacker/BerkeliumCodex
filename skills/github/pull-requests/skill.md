---
name: github-pull-requests
version: 1.0.0
description: Creates, inspects, checks out, and reviews GitHub Pull Requests adhering to templates.
category: github
risk: medium
requires_permission: true
required_tools:
  - shell_execute
  - git_diff
optional_tools:
  - read_file
---

# GitHub Pull Request Management

## Purpose
Author and review PRs using .github/pull_request_template.md standards.

## When to Activate
Activate when submitting finished feature work or checking out PR branches for review.

## Required Tools
- `shell_execute`
- `git_diff`

## Optional Tools
- `read_file`

## Inputs
PR title, body description, target branch, PR number (for checkout/review).

## Preconditions
Current branch must be pushed to remote or ready for pushing.

## Procedure
1. Check .github/pull_request_template.md to load template checklist.
2. Review git_diff to ensure all changes match PR scope.
3. Verify that CI gates (tests, typecheck, benchmarks) pass locally.
4. Push branch to remote using git push origin <branch>.
5. Execute gh pr create with title and filled template body.
6. Return PR URL.

## Tool Usage
Execute gh pr create/view/checkout via shell_execute.

## Safety
Ensure branch contains zero secrets or untracked test debris before opening PR.

## Permissions
Requires git push and GitHub write permission.

## Verification
Verify that PR is created and checks are triggered on GitHub.

## Failure Handling
If push is rejected, verify branch permissions and rebase on upstream.

## Output Contract
PullRequestInfo with number, url, headBranch, baseBranch.

## Examples
Opening PR for failure recovery engine using the repository PR template.

## Related Skills
- `git-commit`
- `code-code-review`
- `github-actions`
