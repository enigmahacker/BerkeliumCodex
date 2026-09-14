---
name: agents-parallel-execution
version: 1.0.0
description: Executes independent subagent tasks concurrently with aggregated result synchronization.
category: agents
risk: medium
requires_permission: true
required_tools:
  - agent_parallel
optional_tools:
  - agent_await
---

# Concurrent Independent Task Execution

## Purpose
Run strictly independent sub-tasks concurrently (e.g. testing multiple independent packages).

## When to Activate
Activate ONLY when sub-tasks have zero shared mutable state or file dependencies.

## Required Tools
- `agent_parallel`

## Optional Tools
- `agent_await`

## Inputs
Array of independent task definitions with target personas.

## Preconditions
Tasks must be mutually independent.

## Procedure
1. Analyze task dependencies: verify NO two tasks write to the same files.
2. If tasks share write targets, reject parallel execution and execute sequentially.
3. Launch parallel subagents using agent_parallel.
4. Monitor concurrent execution with Promise.allSettled semantics.
5. Aggregate results from all child agents.
6. Synthesize combined report for primary agent.

## Tool Usage
Invoke agent_parallel with array of subagent tasks.

## Safety
STRICT INVARIANT: Never parallelize tasks that mutate shared files or git index.

## Permissions
Requires parallel execution capability.

## Verification
Verify all child tasks completed without file contention or race conditions.

## Failure Handling
If one child task fails, collect successful outputs and report failed task for retry.

## Output Contract
ParallelExecutionSummary with results: array, successCount, failureCount.

## Examples
Running linting on packages/agent while running typecheck on packages/providers.

## Related Skills
- `agents-subagents`
- `core-planning`
