---
name: testing-test-generation
version: 1.0.0
description: Authors rigorous unit, integration, and edge-case tests matching existing project conventions.
category: testing
risk: medium
requires_permission: true
required_tools:
  - read_file
  - write_file
optional_tools:
  - shell_execute
---

# Automated Test Case Authoring

## Purpose
Write comprehensive tests covering happy paths, edge cases, error conditions, and invariants.

## When to Activate
Activate when introducing new features, fixing bugs (regression tests), or improving coverage.

## Required Tools
- `read_file`
- `write_file`

## Optional Tools
- `shell_execute`

## Inputs
Target source file, feature specification, edge cases to cover.

## Preconditions
Target implementation and test runner must exist.

## Procedure
1. Read target implementation and existing tests in the same directory.
2. Identify test idioms (Vitest describe/it/expect, mock patterns).
3. Draft test cases covering: happy path, invalid inputs, boundary conditions, and error states.
4. Save new test suite using write_file in tests/ or adjacent to source.
5. Run the new test suite via testing-test-execution to verify it passes.

## Tool Usage
Use read_file to inspect idioms, write_file to save test file.

## Safety
Ensure tests run in isolated environments without side effects on disk or network.

## Permissions
Requires filesystem write permission.

## Verification
Verify new test suite executes and passes cleanly with 100% assertions green.

## Failure Handling
If test fails on first run, verify whether test assumption or source code is flawed.

## Output Contract
TestGenerationResult with testFilePath, testCount, coverageEstimate.

## Examples
Authoring tests/unit/state-machine-transitions.test.ts for FSM edges.

## Related Skills
- `testing-test-execution`
- `code-code-editing`
