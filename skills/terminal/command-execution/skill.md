---
name: terminal-command-execution
version: 1.0.0
description: Structured command runner tracking execution duration, memory consumption, and standard output buffers.
category: terminal
risk: medium
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  []
---

# Structured Command Execution & Logging

## Purpose
Run and audit CLI commands with structured telemetry and secret detection.

## When to Activate
Activate when running toolchain utilities (e.g. git, tsc, cargo, python, vitest).

## Required Tools
- `shell_execute`

## Optional Tools
None.

## Inputs
Executable binary, argument list, environment variables, working directory.

## Preconditions
Target executable must be resolvable in system PATH or workspace.

## Procedure
1. Construct sanitized argument string without shell injection vectors.
2. Set execution context (working directory, environment variables).
3. Run command via shell_execute.
4. Filter standard output buffers through SecretRedactor.
5. Record execution metrics in telemetry accumulator.

## Tool Usage
Call shell_execute with full command string.

## Safety
Escape shell metacharacters unless subshell piping is explicitly required.

## Permissions
Requires shell execution permission.

## Verification
Verify command completion and status code.

## Failure Handling
If exit code is non-zero, capture stderr and classify error in FailureRecovery.

## Output Contract
CommandExecutionRecord with exit_code, stdout, stderr, execution_time.

## Examples
Running tsc -b ./tsconfig.json to validate type definitions.

## Related Skills
- `terminal-shell`
- `core-error-recovery`
