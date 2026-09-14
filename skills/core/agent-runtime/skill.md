---
name: core-agent-runtime
version: 1.0.0
description: Manages the deterministic autonomous execution loop and state machine invariants of Berkelium Codex.
category: core
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  - diagnostics_run
---

# Core Agent Runtime Management

## Purpose
Govern the deterministic lifecycle of the autonomous coding loop across all valid state transitions.

## When to Activate
Activate on session initialization, mode switching, or when supervising multi-step autonomous workflows.

## Required Tools
None.

## Optional Tools
- `diagnostics_run`

## Inputs
Session options, active agent mode, configuration profiles, and initial user prompt.

## Preconditions
AgentRuntime and EventBus must be instantiated with a valid workspace root.

## Procedure
1. Initialize the state machine in IDLE state.
2. Receive task and dispatch state transition to ANALYZING.
3. Validate runtime invariants (provider neutrality, permission boundaries, token budget).
4. Cycle through PLANNING, WAITING_FOR_MODEL, EXECUTING_TOOL, and VERIFYING states.
5. Record telemetry, token counters, and transition history.
6. Terminate gracefully in COMPLETED on success, or trigger failure recovery on unhandled exceptions.

## Tool Usage
Invoke diagnostics_run when system health or telemetry inspection is requested.

## Safety
Enforce max_iterations (40) and max_tool_retries (3) to prevent unbounded loops.

## Permissions
Safe operation. Sub-operations request permissions via Capability Engine.

## Verification
Confirm final state is COMPLETED and all lifecycle events were dispatched via EventBus.

## Failure Handling
If state machine encounters an invalid transition, reject via InvalidStateTransitionError and transition to FAILED.

## Output Contract
JSON payload containing final execution status, iterations count, and error summary.

## Examples
Execution of autonomous goal: bk run "refactor database schema" with full event tracking.

## Related Skills
- `core-planning`
- `core-error-recovery`
- `core-verification`
