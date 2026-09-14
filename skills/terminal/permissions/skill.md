---
name: terminal-permissions
version: 1.0.0
description: Evaluates operation risk tiers and manages interactive user confirmation workflows.
category: terminal
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  []
---

# Capability & Permission Policy Evaluation

## Purpose
Enforce capability-based security boundaries, risk classification, and confirmation prompts.

## When to Activate
Activate before executing any mutating filesystem, process, network, or git action.

## Required Tools
None.

## Optional Tools
None.

## Inputs
Operation type, target path or command, requested capability level.

## Preconditions
PermissionEngine must be initialized with the active workspace policy.

## Procedure
1. Classify operation risk: SAFE, LOW_RISK, DESTRUCTIVE, PRIVILEGED, NETWORK, IRREVERSIBLE.
2. Check active permission level: ASK, AUTO, or FULL.
3. If AUTO and operation is SAFE/LOW_RISK, authorize immediately.
4. If ASK or operation is DESTRUCTIVE/PRIVILEGED, emit permission_requested event.
5. Await user authorization (approved, denied, session-scoped).
6. Return permission decision to orchestrator.

## Tool Usage
Operates via PermissionEngine in @berkelium/permissions.

## Safety
Never bypass permission checks or auto-approve destructive operations in ASK mode.

## Permissions
Safe policy evaluator.

## Verification
Check that operation is only dispatched if decision is approved.

## Failure Handling
If user denies permission, abort operation with PermissionDeniedError.

## Output Contract
PermissionResult with action, status (approved/denied), scope, reason.

## Examples
Evaluating whether deleting a directory requires user confirmation.

## Related Skills
- `security-permissions`
- `terminal-shell`
