---
name: ai-huggingface
version: 1.0.0
description: Interacts with Hugging Face Hub, model checkpoints, serverless inference API, and tokenizers.
category: ai
risk: safe
requires_permission: false
required_tools:
  - http_request
optional_tools:
  - shell_execute
---

# Hugging Face Hub & Serverless Integration

## Purpose
Discover model weights, download GGUF/Safetensors checkpoints, and use Serverless Inference API.

## When to Activate
Activate when querying Hugging Face repositories or using HF Serverless models (<10B free).

## Required Tools
- `http_request`

## Optional Tools
- `shell_execute`

## Inputs
Model repository ID (e.g. Qwen/Qwen2.5-Coder-7B-Instruct), task.

## Preconditions
HF token configured in AuthStore for authenticated calls.

## Procedure
1. Query Hugging Face Hub API to retrieve model card metadata, files, and tags.
2. Inspect model architecture, quantization variants (Q4_K_M, Q8_0), and file sizes.
3. If downloading: obtain direct resolve/main download URL for target file.
4. If invoking Serverless API: send request with authorization header.
5. Normalize response tokens and return output.

## Tool Usage
Invoke http_request against huggingface.co API.

## Safety
Verify model hash before loading external checkpoints to prevent code execution via pickle.

## Permissions
Safe read-only network operation.

## Verification
Confirm model repository exists and serverless API returns valid completion.

## Failure Handling
If HF returns 503 (model loading), wait and retry with exponential backoff.

## Output Contract
HuggingFaceModelDetails with repoId, pipelineTag, downloads, availableGgufFiles: array.

## Examples
Querying Hugging Face for available GGUF quantizations of DeepSeek-Coder.

## Related Skills
- `ai-llm`
- `network-downloads`
