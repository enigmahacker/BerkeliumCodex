---
name: ai-ollama
version: 1.0.0
description: Integrates with local Ollama daemon (127.0.0.1:11434), model pulling, and streaming inference.
category: ai
risk: medium
requires_permission: true
required_tools:
  - http_request
optional_tools:
  - shell_execute
---

# Ollama Local Daemon Integration

## Purpose
Discover installed local models, pull new weights, and route offline inference to Ollama.

## When to Activate
Activate when running in offline or private local model mode.

## Required Tools
- `http_request`

## Optional Tools
- `shell_execute`

## Inputs
Model tag (e.g. qwen2.5-coder:7b), prompt messages, stream flag.

## Preconditions
Ollama daemon must be running at 127.0.0.1:11434.

## Procedure
1. Ping http://127.0.0.1:11434/api/tags using http_request to verify service health.
2. List locally pulled models and check if target model is present.
3. If model is missing and user authorized pull: trigger /api/pull stream.
4. Send chat completion request to http://127.0.0.1:11434/api/chat.
5. Stream tokens through ResponseNormalizer.
6. Return completed response.

## Tool Usage
Call http_request to Ollama REST endpoints.

## Safety
Check host available RAM before pulling models >= 14B parameters.

## Permissions
Requires local network permission.

## Verification
Confirm Ollama daemon is reachable and responds with model list.

## Failure Handling
If connection refused, alert user to launch Ollama application (ollama serve).

## Output Contract
OllamaStatus with running: boolean, models: string[], activeModel: string.

## Examples
Routing coding task to local qwen2.5-coder:7b on Ollama.

## Related Skills
- `ai-llm`
- `ai-inference`
