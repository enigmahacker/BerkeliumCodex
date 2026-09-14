---
name: testing-test-analysis
version: 1.0.0
description: Parses test coverage reports, failure patterns, slow tests, and flakiness metrics.
category: testing
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Test Coverage & Flakiness Analysis

## Purpose
Analyze test coverage metrics, identify untested code branches, and pinpoint flaky tests.

## When to Activate
Activate when auditing test quality, optimizing test latency, or reviewing PR coverage.

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Coverage report path (lcov.info, coverage-summary.json) or test runner log.

## Preconditions
Test coverage must be generated via pnpm run test:coverage.

## Procedure
1. Read coverage summary file using read_file.
2. Extract line, function, statement, and branch coverage percentages.
3. Identify files or packages with coverage below project threshold (<80%).
4. Scan test timing logs for slow tests (>500ms).
5. Generate recommendations for missing edge-case tests.

## Tool Usage
Use read_file to inspect coverage JSON or LCOV data.

## Safety
Read-only analysis.

## Permissions
Safe operation.

## Verification
Confirm coverage metrics correspond to actual source files.

## Failure Handling
If coverage report is missing, run test runner with --coverage flag.

## Output Contract
TestAnalysisReport with overallCoverage, slowTests: string[], uncoveredFiles: string[].

## Examples
Analyzing branch coverage on packages/permissions policy evaluator.

## Related Skills
- `testing-test-discovery`
- `testing-test-generation`
