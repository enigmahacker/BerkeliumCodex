---
name: ai-cuda
version: 1.0.0
description: NVIDIA CUDA acceleration, nvidia-smi diagnostics, TensorRT-LLM, and VRAM memory constraints.
category: ai
risk: safe
requires_permission: false
required_tools:
  - shell_execute
optional_tools:
  []
---

# NVIDIA CUDA Acceleration & VRAM Management

## Purpose
Monitor NVIDIA GPUs, query VRAM allocation, and configure CUDA runtime environments.

## When to Activate
Activate when executing on Linux/Windows hosts with NVIDIA GPUs or remote GPU instances.

## Required Tools
- `shell_execute`

## Optional Tools
None.

## Inputs
CUDA device ID, VRAM allocation request.

## Preconditions
NVIDIA driver and CUDA runtime installed.

## Procedure
1. Execute nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv via shell_execute.
2. Parse available free VRAM.
3. Compute whether model weights + KV cache fit inside free VRAM.
4. Set CUDA_VISIBLE_DEVICES to designate target GPU.
5. Return GPU status report.

## Tool Usage
Invoke shell_execute with nvidia-smi.

## Safety
NEVER launch GPU tasks that exceed free VRAM, as it causes CUDA Out-Of-Memory kernel panics.

## Permissions
Safe hardware inspection.

## Verification
Confirm nvidia-smi reports valid GPU name, driver version, and free VRAM.

## Failure Handling
If nvidia-smi fails or is absent, report no CUDA hardware detected.

## Output Contract
CudaGpuStatus with gpuName, totalVramMb, freeVramMb, driverVersion.

## Examples
Checking free VRAM on NVIDIA RTX 4090 before loading a 14B model.

## Related Skills
- `ai-inference`
- `terminal-diagnostics`
