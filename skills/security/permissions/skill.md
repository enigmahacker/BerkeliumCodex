---
name: security-permissions
version: 1.0.0
description: Enforces capability-based security boundaries and user confirmation gates on dangerous actions.
category: security
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  []
---

# Capability-Based Permission Enforcement

## Purpose
Guarantee that all destructive filesystem, shell, network, and process actions pass through PermissionEngine.

## When to Activate
Activate before executing any mutating tool operation.

## Required Tools
None.

## Optional Tools
None.

## Inputs
Requested tool call, arguments, risk tier, active policy.

## Preconditions
PermissionEngine must be initialized.

## Procedure
1. Inspect tool action and target resources.
2. Evaluate against permission rules (ASK, AUTO, FULL).
3. If tool requires permission and policy is ASK: pause and request user confirmation.
4. If approved: authorize tool execution with bounded capability token.
5. If denied: abort execution immediately with PermissionDeniedError.

## Tool Usage
Enforced via PermissionEngine.

## Safety
NEVER allow tools to execute without passing through PermissionEngine.

## Permissions
Safe governance mechanism.

## Verification
Verify that every tool call has a recorded permission check in telemetry.

## Failure Handling
If permission state is ambiguous, reject execution and prompt user.

## Output Contract
PermissionEvaluation with isAllowed: boolean, riskTier: string, reason: string.

## Examples
Prompting user before executing rm -rf on build directory.

## Related Skills
- `terminal-permissions`
- `security-sandboxing`
