---
name: core-error-recovery
version: 1.0.0
description: Classifies execution failures into 10 categories and generates actionable avoidance instructions.
category: core
risk: safe
requires_permission: false
required_tools:
  - diagnostics_run
optional_tools:
  - read_file
---

# Hierarchical Failure Recovery & Avoidance

## Purpose
Diagnose runtime errors, update the avoidance ledger, and synthesize remediation steps.

## When to Activate
Activate whenever a tool execution fails, test suite fails, or runtime exception occurs.

## Required Tools
- `diagnostics_run`

## Optional Tools
- `read_file`

## Inputs
Error object, stack trace, tool arguments, and exit code.

## Preconditions
FailureLedger must be available in AgentRuntime context.

## Procedure
1. Parse error message, stack trace, and stderr streams.
2. Classify error into one of 10 classes: syntax, type, dependency, environment, permission, network, model, tool, test, logic.
3. Extract failing file path and line number if present.
4. Formulate concrete avoidance instruction (e.g. "Do not pass --flag to command X").
5. Record entry in FailureLedger.
6. Inject avoidance rules into next prompt layer and transition to REMEDIATING.

## Tool Usage
Use diagnostics_run to verify whether underlying system dependencies are broken.

## Safety
Do not retry the exact same failing command without adjusting parameters or environment.

## Permissions
Safe analysis operation.

## Verification
Verify error class matches failure signatures and avoidance instruction is non-empty.

## Failure Handling
If error category cannot be determined, default to category "logic" and limit retries.

## Output Contract
FailureClassification object with category, root_cause, and avoidance_rule.

## Examples
Recovering from missing TypeScript types by installing @types/node and updating import.

## Related Skills
- `core-verification`
- `code-debugging`
- `testing-test-execution`
