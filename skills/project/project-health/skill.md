---
name: project-health
version: 1.0.0
description: Evaluates overall project health, test coverage, lint status, technical debt, and maintainability metrics.
category: project
risk: safe
requires_permission: false
required_tools:
  - read_file
  - shell_execute
optional_tools:
  - search_files
---

# Project Health & Maintainability Evaluation

## Purpose
Synthesize quality signals across tests, linting, type checks, documentation, and security into a health scorecard.

## When to Activate
Activate when assessing repository readiness for release, conducting a codebase review, or establishing quality baselines.

## Required Tools
- `read_file`
- `shell_execute`

## Optional Tools
- `search_files`

## Inputs
Workspace root, target quality thresholds.

## Preconditions
Workspace must be discovered with build tools available.

## Procedure
1. Run test suite to measure passing, failing, and skipped test counts.
2. Execute linter and type-checker to count warnings, errors, and type safety issues.
3. Check Git status and recent commits for uncommitted changes or broken workflows.
4. Assess documentation completeness (README, API docs, changelog, contribution guides).
5. Aggregate security audit results and dependency health metrics.
6. Compute composite project health score (0-100) and generate prioritized remediation recommendations.

## Tool Usage
Use shell_execute for test and lint runners; read_file for documentation checks.

## Safety
Run diagnostic and test commands in non-destructive modes.

## Permissions
Diagnostic shell execution.

## Verification
Confirm all health metric categories are evaluated with concrete data points.

## Failure Handling
If full test suite times out, run smoke test subset and note partial evaluation.

## Output Contract
ProjectHealthScorecard with score, testStatus, typeErrors, lintWarnings, and actionItems.

## Examples
Generating release-readiness health scorecard for Berkelium Codex v1.0.0.

## Related Skills
- `testing-test-analysis`
- `security-security-audit`
- `project-architecture`
