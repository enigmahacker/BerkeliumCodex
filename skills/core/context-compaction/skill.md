---
name: core-context-compaction
version: 1.0.0
description: Executes lossless conversation compaction preserving critical task state and verification evidence.
category: core
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  []
---

# Lossless Context Compaction

## Purpose
Reduce token footprint while retaining all critical objectives, modified files, and test outcomes.

## When to Activate
Activate strictly when context utilization exceeds 92%. Never activate due to test failure.

## Required Tools
None.

## Optional Tools
None.

## Inputs
Full session conversation history, active objective, plan state, and file diffs.

## Preconditions
Active execution state must be saved to restore after compaction.

## Procedure
1. CRITICAL RULE: Verify that compaction trigger is CONTEXT_PRESSURE, not VERIFICATION_FAILED.
2. Evaluate token budget and confirm context usage exceeds threshold (>92%).
3. Snapshot current runtime state (active step, modified files, errors).
4. Transition state machine to COMPACTING_CONTEXT.
5. Extract user prompt, core architecture decisions, and current file modifications.
6. Condense intermediate tool executions and conversational turns into structured summary within token budget.
7. Replace bloated history with the synthesized summary block.
8. Restore runtime state machine to the previous interrupted state.

## Tool Usage
Invokes ContextCompactor in @berkelium/context.

## Safety
Never discard active file paths, open bug reproductions, or user-supplied constraints.

## Permissions
Internal memory mutation only.

## Verification
Confirm compacted token count is at least 40% lower than pre-compaction total.

## Failure Handling
If summarization fails, fall back to aggressive sliding window truncation.

## Output Contract
Compacted message array with metadata summary record.

## Examples
Compacting 60,000 tokens of test outputs into 8,000 tokens of structured context.

## Related Skills
- `core-context-management`
- `core-agent-runtime`
