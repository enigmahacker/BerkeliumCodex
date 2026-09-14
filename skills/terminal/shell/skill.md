---
name: terminal-shell
version: 1.0.0
description: Executes non-interactive shell commands with strict timeouts, stream capture, and exit code handling.
category: terminal
risk: medium
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - process_list
---

# Safe Shell Execution

## Purpose
Execute commands in a controlled subshell with working directory tracking and timeout enforcement.

## When to Activate
Activate when running package managers, compilers, testing tools, or build scripts.

## Required Tools
- `shell_execute`

## Optional Tools
- `process_list`

## Inputs
Command line string, working directory (optional), timeout_ms (optional).

## Preconditions
Command string must be sanitized and classified by risk tier.

## Procedure
1. Classify command into risk category (SAFE, LOW_RISK, DESTRUCTIVE, PRIVILEGED, NETWORK, IRREVERSIBLE).
2. Check command policy and permission level (ASK, AUTO, FULL).
3. If DESTRUCTIVE or PRIVILEGED, prompt for user confirmation.
4. Execute via shell_execute with timeout (default 30,000ms).
5. Capture stdout, stderr, and exit code.
6. Redact any discovered secrets before returning output.

## Tool Usage
Invoke shell_execute with command, cwd, and timeout_ms.

## Safety
Block destructive commands like rm -rf /, fork bombs, or unconfirmed disk formatters.

## Permissions
Requires shell permission tier.

## Verification
Check exit code is 0 and inspect stdout/stderr.

## Failure Handling
If command times out, kill the process group and report duration and partial output.

## Output Contract
ShellResult with command, cwd, exit_code, stdout, stderr, duration_ms, timed_out.

## Examples
Running pnpm test in repository root.

## Related Skills
- `terminal-command-execution`
- `terminal-permissions`
- `terminal-diagnostics`
