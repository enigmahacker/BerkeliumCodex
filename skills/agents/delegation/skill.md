---
name: agents-delegation
version: 1.0.0
description: Delegates complex sub-tasks to specialized subagents with structured input/output contracts.
category: agents
risk: medium
requires_permission: true
required_tools:
  - agent_delegate
optional_tools:
  - agent_await
---

# Structured Task Delegation

## Purpose
Hand off focused engineering tasks to dedicated personas with unambiguous deliverables.

## When to Activate
Activate when separating concerns (e.g. delegating test writing to Tester while Coder focuses on implementation).

## Required Tools
- `agent_delegate`

## Optional Tools
- `agent_await`

## Inputs
Target persona, task description, input context, expected deliverable schema.

## Preconditions
Target persona must exist in the subagent registry.

## Procedure
1. Define exact task objective and required output format.
2. Select appropriate persona matching task domain.
3. Bundle relevant file context and constraints.
4. Call agent_delegate.
5. Receive structured output deliverable.
6. Integrate result back into primary plan progression.

## Tool Usage
Call agent_delegate with persona and task.

## Safety
Do not delegate tasks without defining verification criteria.

## Permissions
Requires agent delegation capability.

## Verification
Check that delegated output satisfies the required schema.

## Failure Handling
If delegate fails, primary agent resumes task directly.

## Output Contract
DelegatedTaskResult with persona, status, deliverable.

## Examples
Delegating unit test writing for new schema validator to Tester subagent.

## Related Skills
- `agents-subagents`
- `agents-agent-handoff`
