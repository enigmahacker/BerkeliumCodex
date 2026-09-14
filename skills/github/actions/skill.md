---
name: github-actions
version: 1.0.0
description: Inspects, triggers, and analyzes GitHub Actions CI/CD workflows and job run logs.
category: github
risk: safe
requires_permission: false
required_tools:
  - shell_execute
optional_tools:
  - read_file
---

# GitHub Actions Workflow Inspection

## Purpose
Monitor CI runs, download job logs for failing builds, and diagnose pipeline bottlenecks.

## When to Activate
Activate when CI fails on remote PRs or after pushing commits to GitHub.

## Required Tools
- `shell_execute`

## Optional Tools
- `read_file`

## Inputs
Workflow name, run ID, branch filter.

## Preconditions
Repository must contain .github/workflows configurations.

## Procedure
1. Query active workflow runs using gh run list.
2. If a run failed: retrieve failed job logs via gh run view <id> --log-failed.
3. Parse failing step, assertion, or compiler error.
4. Pass failure context directly into code-debugging skill.
5. Return workflow summary.

## Tool Usage
Execute gh run commands via shell_execute.

## Safety
Read-only log inspection.

## Permissions
Safe operation.

## Verification
Confirm workflow status matches remote GitHub Actions dashboard.

## Failure Handling
If gh run fails to fetch logs, inspect workflow YAML files to run the commands locally.

## Output Contract
WorkflowRun with id, name, status, conclusion, failedSteps: string[].

## Examples
Checking CI status on commit 5ff6d00.

## Related Skills
- `infrastructure-ci-cd`
- `code-debugging`
