---
name: languages-shell
version: 1.0.0
description: Portable POSIX and Bash scripting, ShellCheck static analysis, error trapping, and quote safety.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Portable Shell & Bash Scripting

## Purpose
Author robust, portable shell scripts with strict error trapping (set -euo pipefail) and quotes.

## When to Activate
Activate when writing launcher scripts (bin/bk), CI scripts, or hook wrappers (*.sh).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Shell script files.

## Preconditions
Bash or POSIX sh environment.

## Procedure
1. Include standard shebang (#!/usr/bin/env bash or #!/bin/sh).
2. Set strict error handling: set -euo pipefail.
3. Always double-quote variable expansions ("$VAR") to prevent word-splitting and glob expansion.
4. Handle symlink resolution cleanly using readlink loop.
5. Run ShellCheck (shellcheck script.sh) to detect portability and syntax flaws.

## Tool Usage
Use read_file to inspect, shell_execute to run shellcheck.

## Safety
NEVER use rm -rf "$VAR" without verifying that $VAR is non-empty and not root /.

## Permissions
Safe convention guidelines.

## Verification
Confirm shellcheck reports zero warnings and script executes correctly under bash and zsh.

## Failure Handling
If script behaves inconsistently across macOS and Linux, replace Bash-specific syntax with POSIX.

## Output Contract
ShellScriptValidation with shellcheckClean: boolean, portable: boolean.

## Examples
Authoring bin/bk with robust symlink resolution for global CLI usage.

## Related Skills
- `terminal-shell`
- `build-lint`
