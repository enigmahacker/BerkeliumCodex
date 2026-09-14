---
name: testing-test-execution
version: 1.0.0
description: Executes targeted or full test suites, parsing assertions, test counts, and durations.
category: testing
risk: medium
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - read_file
---

# Test Execution & Result Parsing

## Purpose
Run tests with strict result tracking: DISCOVER -> SELECT -> EXECUTE -> ANALYZE -> FIX -> RE-RUN -> VERIFY.

## When to Activate
Activate after code editing, during verification loops, and in CI runs.

## Required Tools
- `shell_execute`

## Optional Tools
- `read_file`

## Inputs
Target test file or filter pattern, timeout, reporter format.

## Preconditions
Project dependencies must be installed.

## Procedure
1. Identify the targeted test command (e.g. pnpm test or vitest run <file>).
2. Execute test command via shell_execute.
3. Parse test output for passed, failed, skipped counts, and duration.
4. If failures occur, extract assertion diffs and failing stack traces.
5. NEVER claim tests passed unless actual test execution returned exit code 0.
6. Return structured test execution summary.

## Tool Usage
Invoke shell_execute with test runner command.

## Safety
Do not run test commands that wipe production databases without isolation.

## Permissions
Requires shell execution permission.

## Verification
Confirm exit code is 0 and passed count > 0.

## Failure Handling
If tests fail, feed exact error output into code-debugging.

## Output Contract
TestRunSummary with passed: number, failed: number, durationMs: number, exitCode: number.

## Examples
Running vitest run tests/unit/chat-schema.test.ts.

## Related Skills
- `testing-test-analysis`
- `core-verification`
- `code-debugging`
