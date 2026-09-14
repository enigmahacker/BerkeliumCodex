---
name: agents-agent-handoff
version: 1.0.0
description: Manages seamless state, context, and artifact handoffs between collaborating subagents.
category: agents
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  []
---

# Subagent State & Artifact Handoff

## Purpose
Transfer execution context, diffs, and verification requirements cleanly from one persona to another.

## When to Activate
Activate when transitioning from Architect -> Coder or Coder -> Reviewer.

## Required Tools
None.

## Optional Tools
None.

## Inputs
Source agent ID, target agent persona, state payload, modified files list.

## Preconditions
Source agent must have completed its milestone.

## Procedure
1. Capture deliverables from source agent (e.g. architecture plan or code diff).
2. Validate deliverable against handoff contract.
3. Package context summary without conversational noise.
4. Pass context to target persona during initialization.
5. Emit agent_handoff event for observability.

## Tool Usage
Internal runtime context transfer.

## Safety
Strip unnecessary conversational turns during handoff to prevent token bloat.

## Permissions
Safe in-memory operation.

## Verification
Confirm target agent receives complete context required to execute.

## Failure Handling
If handoff artifact is incomplete, request missing data before starting target agent.

## Output Contract
HandoffEnvelope with sourcePersona, targetPersona, payload, files.

## Examples
Handing off code diff from Coder to Reviewer for architectural audit.

## Related Skills
- `agents-delegation`
- `agents-agent-review`
