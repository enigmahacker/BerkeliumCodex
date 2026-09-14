---
name: terminal-environment
version: 1.0.0
description: Inspects and verifies environment variables and platform runtime configurations.
category: terminal
risk: safe
requires_permission: false
required_tools:
  - environment_get
optional_tools:
  - shell_execute
---

# Environment Variable Inspection

## Purpose
Check for presence of required environment variables, toolchain versions, and platform flags.

## When to Activate
Activate during doctor diagnostics, toolchain setup, or missing API key verification.

## Required Tools
- `environment_get`

## Optional Tools
- `shell_execute`

## Inputs
Target variable names or prefix filter.

## Preconditions
SecretRedactor must be active to mask sensitive tokens.

## Procedure
1. Query environment variables using environment_get.
2. Redact sensitive values (API keys, tokens, passwords) showing only mask e.g. [sk-...].
3. Verify presence of required runtime variables (NODE_ENV, PATH, HOME).
4. Return sanitized key-value map.

## Tool Usage
Invoke environment_get with filter keys.

## Safety
NEVER expose raw credential values in chat or logs.

## Permissions
Safe read-only operation; sensitive values are masked.

## Verification
Confirm returned dictionary has all sensitive keys redacted.

## Failure Handling
If variable is missing, inform user with instructions on how to set it.

## Output Contract
Record<string, string> of sanitized environment variables.

## Examples
Checking if OPENROUTER_API_KEY or GROQ_API_KEY is present in environment.

## Related Skills
- `security-secrets`
- `terminal-diagnostics`
