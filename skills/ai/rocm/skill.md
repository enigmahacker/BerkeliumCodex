---
name: ai-rocm
version: 1.0.0
description: AMD ROCm GPU acceleration, rocm-smi diagnostics, HIP runtime, and Radeon memory allocation.
category: ai
risk: safe
requires_permission: false
required_tools:
  - shell_execute
optional_tools:
  []
---

# AMD ROCm Acceleration & Diagnostics

## Purpose
Manage AMD Radeon / Instinct GPUs, verify ROCm HIP runtime, and inspect VRAM allocation.

## When to Activate
Activate when running local models on AMD GPU hardware.

## Required Tools
- `shell_execute`

## Optional Tools
None.

## Inputs
ROCm device ID, memory request.

## Preconditions
AMD ROCm drivers installed.

## Procedure
1. Execute rocm-smi --showid --showmeminfo vram via shell_execute.
2. Extract available VRAM for AMD graphics cards.
3. Verify HIP_VISIBLE_DEVICES environment configuration.
4. Check compatibility with PyTorch ROCm or llama.cpp ROCm backend.
5. Return AMD hardware status.

## Tool Usage
Call shell_execute with rocm-smi.

## Safety
Ensure adequate VRAM headroom to avoid hardware crash.

## Permissions
Safe hardware inspection.

## Verification
Confirm rocm-smi outputs valid device and memory details.

## Failure Handling
If rocm-smi is missing, report ROCm runtime not installed.

## Output Contract
RocmStatus with deviceName, vramFreeMb, vramTotalMb.

## Examples
Checking VRAM availability on AMD Radeon 7900 XTX.

## Related Skills
- `ai-cuda`
- `terminal-diagnostics`
