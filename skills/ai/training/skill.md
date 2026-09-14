---
name: ai-training
version: 1.0.0
description: Coordinates model fine-tuning (LoRA, QLoRA), dataset formatting (JSONL), and training loss tracking.
category: ai
risk: high
requires_permission: true
required_tools:
  - shell_execute
  - read_file
optional_tools:
  - file_metadata
---

# Model Fine-Tuning & Training Supervision

## Purpose
Prepare instruction-tuning datasets, configure LoRA parameters, and monitor training checkpoints.

## When to Activate
Activate when fine-tuning coding models or preparing domain-specific adapters.

## Required Tools
- `shell_execute`
- `read_file`

## Optional Tools
- `file_metadata`

## Inputs
Dataset path (JSONL), base model identifier, LoRA rank/alpha, epochs, learning rate.

## Preconditions
Adequate GPU VRAM or Apple Silicon Unified Memory must be verified before launch.

## Procedure
1. Validate dataset format: verify each line is valid JSON with prompt/completion.
2. MEMORY CHECK: Calculate required VRAM based on base model size, quantization, and batch size.
3. NEVER launch training without confirming memory fits within physical RAM.
4. Configure training hyperparameters (LoRA rank=16, alpha=32, lr=2e-4).
5. Execute training script via shell_execute with logging.
6. Monitor training loss across epochs; stop if loss diverges.

## Tool Usage
Use read_file to inspect dataset; shell_execute for training runner.

## Safety
STRICT INVARIANT: Verify VRAM constraints before launch to prevent host freeze or OOM panics.

## Permissions
High risk operation; requires explicit confirmation.

## Verification
Check that final adapter checkpoint is saved and loss converges.

## Failure Handling
If CUDA OOM occurs, reduce batch size, enable gradient accumulation, or use 4-bit QLoRA.

## Output Contract
TrainingSummary with baseModel, adapterPath, finalLoss, epochsCompleted.

## Examples
Fine-tuning a 3B coding model with QLoRA on Apple Silicon using MLX.

## Related Skills
- `ai-evaluation`
- `ai-mlx`
- `ai-cuda`
