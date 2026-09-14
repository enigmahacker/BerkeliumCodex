---
name: code-debugging
version: 1.0.0
description: Diagnoses root causes of failures, stack traces, race conditions, and unhandled rejections.
category: code
risk: safe
requires_permission: false
required_tools:
  - read_file
  - search_files
optional_tools:
  - shell_execute
---

# Root-Cause Localization & Debugging

## Purpose
Isolate the defect origin from logs, stack traces, and failing tests, formulating reproduction tests.

## When to Activate
Activate upon test failures, exceptions, unexpected outputs, or customer bug reports.

## Required Tools
- `read_file`
- `search_files`

## Optional Tools
- `shell_execute`

## Inputs
Error message, stack trace, failing test output, reproduction steps.

## Preconditions
Failing logs or reproduction steps must be provided.

## Procedure
1. Parse stack trace to isolate the failing file and line number.
2. Read the failing line and surrounding execution scope via read_file.
3. Trace data flow leading to the invalid state or undefined reference.
4. Formulate an atomic reproduction test case replicating the defect.
5. Pinpoint root cause (e.g. off-by-one, race condition, missing null check, wrong type assumption).
6. Provide diagnosis and handover to code-editing.

## Tool Usage
Use search_files to find error symbols; read_file to inspect failing functions.

## Safety
Do not modify production code while investigating; keep diagnostics read-only.

## Permissions
Safe read-only diagnosis.

## Verification
Verify that reproduction test fails reliably before applying fixes.

## Failure Handling
If stack trace is obfuscated, inspect source maps or run tests with source map support.

## Output Contract
DebugReport with error_classification, root_cause_analysis, and failing_line.

## Examples
Debugging InvalidStateTransitionError: illegal transition from EXECUTING to IDLE.

## Related Skills
- `core-error-recovery`
- `code-code-editing`
- `testing-test-execution`
