---
name: testing-integration-testing
version: 1.0.0
description: Validates end-to-end interactions between agent runtime, tools, providers, and TUI.
category: testing
risk: medium
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - read_file
---

# End-to-End & Integration Testing

## Purpose
Validate cross-package subsystem integration and end-to-end golden workflows.

## When to Activate
Activate when validating provider routing, tool execution pipelines, or CLI sessions.

## Required Tools
- `shell_execute`

## Optional Tools
- `read_file`

## Inputs
Integration test suite path (e.g. tests/integration/agent-loop.test.ts).

## Preconditions
All workspace packages must be built or linked.

## Procedure
1. Verify packages are built via pnpm run build if necessary.
2. Run integration test suite using vitest run tests/integration/...
3. Verify asynchronous event bus event propagation.
4. Verify tool execution and permission checks in realistic scenario.
5. Return integration test report.

## Tool Usage
Call shell_execute with integration test target.

## Safety
Mock external network calls to cloud providers in automated integration tests.

## Permissions
Requires shell execution permission.

## Verification
Confirm all integration steps and event assertions pass.

## Failure Handling
If integration times out, inspect event listener unsubscription or unresolved promises.

## Output Contract
IntegrationTestResult with scenarioName, eventsObserved, durationMs, status.

## Examples
Testing AgentRuntime executing a tool through ToolOrchestrator and PermissionEngine.

## Related Skills
- `testing-test-execution`
- `core-agent-runtime`
