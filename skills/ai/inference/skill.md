---
name: ai-inference
version: 1.0.0
description: Executes local and cloud LLM inference loops, token streaming, and response normalization.
category: ai
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  []
---

# Model Inference & Streaming Normalization

## Purpose
Execute inference streams across diverse providers and normalize chunks into unified AgentEvents.

## When to Activate
Activate during autonomous reasoning and generation turns.

## Required Tools
None.

## Optional Tools
None.

## Inputs
Prompt messages array, model target, temperature, stop sequences.

## Preconditions
Target provider adapter must be authenticated.

## Procedure
1. Format prompt messages adhering to provider API specification.
2. Open streaming connection to provider inference endpoint.
3. Stream tokens through ResponseNormalizer.
4. Detect tool calls and extract structured JSON arguments.
5. Emit typed AgentEvents (token_received, tool_requested) over EventBus.
6. Return complete normalized response.

## Tool Usage
Invokes ProviderAdapter generateStream method.

## Safety
Enforce response token limits to prevent runaway generation.

## Permissions
Safe operation.

## Verification
Confirm stream terminates cleanly with stop reason (stop, tool_calls, length).

## Failure Handling
If stream drops or times out, retry with exponential backoff up to max_tool_retries.

## Output Contract
NormalizedInferenceResponse with text, toolCalls: array, tokenUsage: object.

## Examples
Streaming tokens from local Apple MLX inference engine.

## Related Skills
- `ai-llm`
- `core-agent-runtime`
