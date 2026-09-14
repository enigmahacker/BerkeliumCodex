---
name: ai-mlx
version: 1.0.0
description: Apple Silicon MLX native acceleration, Metal GPU unified memory allocation, and 4-bit quantization.
category: ai
risk: safe
requires_permission: false
required_tools:
  - diagnostics_run
optional_tools:
  - shell_execute
---

# Apple Silicon MLX Native Acceleration

## Purpose
Maximize Apple Silicon M-series GPU throughput using MLX native unified memory execution.

## When to Activate
Activate on macOS arm64 when running local models natively.

## Required Tools
- `diagnostics_run`

## Optional Tools
- `shell_execute`

## Inputs
Model weight path or Hugging Face repo (mlx-community/*), quantization mode.

## Preconditions
macOS arm64 platform with Apple Silicon chip (M1/M2/M3/M4).

## Procedure
1. Call diagnostics_run to verify Apple Silicon ARM64 architecture and Unified Memory budget.
2. Check available allocatable memory: ensure model size < 70% of unified memory.
3. Load MLX model using 4-bit or 8-bit quantization.
4. Execute Metal-accelerated inference with unified memory zero-copy tensors.
5. Track generation tokens/sec and memory RSS.

## Tool Usage
Operates through MLXProvider in @berkelium/providers.

## Safety
Do not allocate models exceeding unified memory limits to prevent macOS kernel memory compression freeze.

## Permissions
Safe local acceleration.

## Verification
Verify that MLX generation achieves expected throughput (>30 tokens/sec on M4).

## Failure Handling
If MLX package is missing, fall back to GGUF engine or suggest pip install mlx-lm.

## Output Contract
MlxRuntimeInfo with chipModel, unifiedMemoryGb, allocatableBudgetGb, status.

## Examples
Running berkelium-coder:3b natively on Apple Silicon M4 Max via MLX.

## Related Skills
- `ai-inference`
- `terminal-diagnostics`
