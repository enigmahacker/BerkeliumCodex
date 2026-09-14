---
name: ai-llm
version: 1.0.0
description: Manages LLM discovery, prompt layer composition, context budgeting, and model routing.
category: ai
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  - diagnostics_run
---

# LLM Orchestration & Model Routing

## Purpose
Select and route tasks to optimal LLMs based on capability requirements, latency, context, and cost.

## When to Activate
Activate on model selection, /model command, or when routing tasks autonomously.

## Required Tools
None.

## Optional Tools
- `diagnostics_run`

## Inputs
Task complexity, required context tokens, privacy constraints, available providers.

## Preconditions
ProviderRouter must be configured with registered providers.

## Procedure
1. Analyze task requirements (code generation, architectural reasoning, fast triage).
2. Calculate required context window size.
3. Check provider availability (local MLX/Ollama vs cloud Gemini/Groq/NIM).
4. Evaluate cost and latency tradeoffs.
5. Select target model and configure temperature/sampling parameters.
6. Dispatch generation request through ResponseNormalizer.

## Tool Usage
Operates via ProviderRouter in @berkelium/providers.

## Safety
Respect user privacy settings; never send sensitive code to cloud if privacy mode is LOCAL.

## Permissions
Safe model routing.

## Verification
Confirm selected model supports the required context length and tool calling schema.

## Failure Handling
If selected provider is unavailable, fallback gracefully through ProviderRouter fallback chain.

## Output Contract
ModelRoutingDecision with modelId, provider, contextLimit, isLocal: boolean.

## Examples
Routing a 150,000 token context task to Gemini 2.5 Flash with 1M context.

## Related Skills
- `core-context-management`
- `ai-inference`
