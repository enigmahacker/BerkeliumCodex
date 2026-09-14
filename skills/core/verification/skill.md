---
name: core-verification
version: 1.0.0
description: Enforces the canonical Berkelium autonomous verification loop across tests, linter, and git diff.
category: core
risk: safe
requires_permission: false
required_tools:
  - shell_execute
optional_tools:
  - git_diff
---

# Autonomous Verification & Quality Gate

## Purpose
Validate all changes against diagnostics, test suites, type checking, and git diffs before completion.

## When to Activate
Activate after code editing, refactoring, or bug fixing before marking a task complete.

## Required Tools
- `shell_execute`

## Optional Tools
- `git_diff`

## Inputs
Modified file list, project test script, build script, and working directory.

## Preconditions
Mutations must be saved to the filesystem.

## Procedure
1. Execute project linter or typecheck (e.g. pnpm run typecheck or tsc -b).
2. Execute targeted test suite covering modified code (e.g. vitest run <file>).
3. Inspect git diff to verify changes are minimal and preserve surrounding code formatting.
4. If all checks pass: emit verification_completed(passed=true) and conclude.
5. If any check fails: emit verification_completed(passed=false), transition to REMEDIATING, and remediate.
6. CRITICAL RULE: Never transition from VERIFYING to COMPACTING_CONTEXT due to test failure.

## Tool Usage
Use shell_execute for running test runner; use git_diff to verify patch cleanliness.

## Safety
Do not modify verification scripts to force passing results.

## Permissions
Requires shell execution capability for test runners.

## Verification
Observable test pass report with exit code 0.

## Failure Handling
Capture exact failed assertion and feed directly into core-error-recovery.

## Output Contract
VerificationReport with passed: boolean, checks: array, and diffSummary: string.

## Examples
Validating that a bugfix passes unit tests and typechecking before final signoff.

## Related Skills
- `core-error-recovery`
- `testing-test-execution`
- `build-type-check`
