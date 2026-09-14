---
name: core-context-management
version: 1.0.0
description: Monitors token utilization and budgets context window consumption.
category: core
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  []
---

# Context Window Budgeting & Monitoring

## Purpose
Prevent context window exhaustion and optimize model prompt efficiency.

## When to Activate
Activate continuously before every model interaction turn.

## Required Tools
None.

## Optional Tools
None.

## Inputs
Current conversation history, context limit, model identifier, and proposed tool inputs.

## Preconditions
Model context window parameters must be defined in provider capabilities.

## Procedure
1. Measure tokens in prompt layers (system prompt, project memory, conversation history).
2. Calculate current usage percentage: (tokens_used / context_limit) * 100.
3. Classify tier: <70% NORMAL, 70-85% MONITOR, 85-92% PREPARE COMPACTION, >92% COMPACT.
4. Prune transient tool outputs if usage exceeds 85%.
5. Signal compaction requirement when threshold crosses 92%.

## Tool Usage
Uses in-memory Tokenizer and ContextEngine utilities.

## Safety
Do not truncate user prompts or core system constraints.

## Permissions
Read-only memory calculation.

## Verification
Verify that total prompt tokens do not exceed the model maximum context ceiling.

## Failure Handling
If context exceeds 95%, initiate emergency compaction immediately.

## Output Contract
Context telemetry object with tokens_used, context_limit, and usage_percent.

## Examples
Tracking 45,000 tokens against a 128,000 token context window on Llama 3.3.

## Related Skills
- `core-context-compaction`
- `core-agent-runtime`
