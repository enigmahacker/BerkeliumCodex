---
name: testing-regression-testing
version: 1.0.0
description: Runs complete test suites to ensure modifications did not break existing behavior.
category: testing
risk: medium
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  []
---

# Full Regression Suite Validation

## Purpose
Guard against unintentional regressions across all packages and components.

## When to Activate
Activate before finalizing tasks, before creating pull requests, or after refactoring.

## Required Tools
- `shell_execute`

## Optional Tools
None.

## Inputs
Full test command (e.g. pnpm test).

## Preconditions
All modified files must be saved.

## Procedure
1. Execute full project test command via shell_execute.
2. Monitor all test suite files across all monorepo packages.
3. Verify that all suites pass with zero failures.
4. If any historical test regresses, flag as a regression defect.
5. Prevent task completion until regression is fixed.

## Tool Usage
Call shell_execute with pnpm test.

## Safety
Ensure adequate timeout for full regression suites (default 60s).

## Permissions
Requires shell execution permission.

## Verification
Check that all test suites pass (e.g. 50/50 test files passed).

## Failure Handling
If a regression occurs, use git diff to see which edit caused the break.

## Output Contract
RegressionTestReport with totalSuites, totalTests, regressions: string[].

## Examples
Running pnpm test verifying 262/262 tests pass.

## Related Skills
- `testing-test-execution`
- `core-verification`
