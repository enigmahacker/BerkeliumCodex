---
name: agents-subagents
version: 1.0.0
description: Spawns and manages specialized subagents with bounded scopes, tool allowlists, and timeouts.
category: agents
risk: medium
requires_permission: true
required_tools:
  - agent_spawn
optional_tools:
  - agent_await
---

# Specialized Subagent Orchestration

## Purpose
Spawn scoped subagent personas (Explorer, Coder, Tester, Reviewer, Security) with dedicated tool constraints.

## When to Activate
Activate when delegating isolated sub-goals (e.g. read-only codebase indexing or parallel test execution).

## Required Tools
- `agent_spawn`

## Optional Tools
- `agent_await`

## Inputs
Subagent persona, explicit objective, tool allowlist, max steps, timeout_ms, parent task ID.

## Preconditions
SubagentManager must be initialized in AgentRuntime.

## Procedure
1. Verify subagent persona is valid (Explorer, Architect, Coder, Debugger, Tester, Reviewer, Security, Performance, Documentation).
2. Configure bounded tool allowlist (e.g. Explorer has read-only tools; no shell write).
3. Assign discrete step limit (max 10 steps) and execution timeout.
4. Spawn subagent using agent_spawn.
5. Monitor subagent events via child event bus.
6. Await subagent output contract fulfillment.

## Tool Usage
Invoke agent_spawn with persona, objective, and allowedTools.

## Safety
Never spawn subagents recursively without depth bounds (max depth = 2).

## Permissions
Requires agent orchestration permission.

## Verification
Confirm subagent completes with output adhering to its persona contract.

## Failure Handling
If subagent exceeds timeout or step limit, terminate cleanly and return partial findings.

## Output Contract
SubagentResult with subagentId, status (completed/timeout), outputContract.

## Examples
Spawning Explorer subagent to map packages/providers directory structure.

## Related Skills
- `agents-delegation`
- `agents-parallel-execution`
- `agents-agent-review`
