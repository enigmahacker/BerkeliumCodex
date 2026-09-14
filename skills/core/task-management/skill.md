---
name: core-task-management
version: 1.0.0
description: Tracks step progression, blocker resolution, and milestone completion.
category: core
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  - diagnostics_run
---

# Autonomous Task State Management

## Purpose
Maintain progress state across multi-step execution plans and notify listeners.

## When to Activate
Activate on every milestone transition during autonomous plan execution.

## Required Tools
None.

## Optional Tools
- `diagnostics_run`

## Inputs
Active plan ID, current step index, step result (success/failure/blocked).

## Preconditions
An active Plan must exist in AgentRuntime session state.

## Procedure
1. Retrieve current step from active plan.
2. Mark step status as in_progress and emit step_started event.
3. Monitor tool execution and capture output artifacts.
4. Upon verification success, mark step completed; upon failure, mark step failed.
5. If blockers emerge, pause execution and update reason.
6. Evaluate whether all steps are finished to trigger plan completion.

## Tool Usage
Emit typed events over EventBus for TUI updates.

## Safety
Never mark a step completed without positive verification output.

## Permissions
Safe operation; manipulates internal agent runtime state.

## Verification
Ensure step transitions reflect actual tool outcomes and exit codes.

## Failure Handling
If a step fails, trigger error-recovery skill rather than silently continuing.

## Output Contract
Updated Plan state with timestamps and status for each step.

## Examples
Advancing from Step 2 (Write unit test) to Step 3 (Run test suite).

## Related Skills
- `core-planning`
- `core-verification`
- `core-error-recovery`
