---
name: infrastructure-github-actions
version: 1.0.0
description: Authors and hardens GitHub Actions workflows, composite actions, and runner matrices.
category: infrastructure
risk: medium
requires_permission: true
required_tools:
  - read_file
  - write_file
optional_tools:
  - shell_execute
---

# GitHub Actions Workflow Authoring & Hardening

## Purpose
Create and harden GitHub Actions workflows with least-privilege permissions and pinned action SHAs.

## When to Activate
Activate when creating new workflows in .github/workflows/*.yml.

## Required Tools
- `read_file`
- `write_file`

## Optional Tools
- `shell_execute`

## Inputs
Workflow trigger (push, pull_request, release), job definitions, matrix runners.

## Preconditions
Directory .github/workflows/ must exist or be created.

## Procedure
1. Configure trigger events (on: push: branches: [main], pull_request).
2. Set top-level permissions: contents: read to enforce least-privilege.
3. Configure matrix strategy: os: [ubuntu-latest, macos-latest], node: [20, 22, 24].
4. Pin actions with full commit SHAs or trusted major version tags (actions/checkout@v4).
5. Add steps for pnpm setup, dependency caching, linting, testing, and building.
6. Save workflow file using write_file.

## Tool Usage
Use write_file to save workflow in .github/workflows/.

## Safety
Avoid using pull_request_target on untrusted forks with write permissions or secret access.

## Permissions
Requires filesystem write permission.

## Verification
Check that YAML is syntactically valid and contains all declared jobs.

## Failure Handling
If syntax validation fails, check indentation and quotes on boolean values.

## Output Contract
WorkflowCreationResult with workflowPath, jobs: array, triggers: array.

## Examples
Creating multi-OS CI workflow for Berkelium Codex on Node 20/22/24.

## Related Skills
- `infrastructure-ci-cd`
- `github-actions`
