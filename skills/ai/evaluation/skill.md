---
name: ai-evaluation
version: 1.0.0
description: Evaluates model output quality, code pass@1 accuracy, latency benchmarks, and schema compliance.
category: ai
risk: safe
requires_permission: false
required_tools:
  - shell_execute
optional_tools:
  - read_file
---

# Model Quality & Benchmark Evaluation

## Purpose
Measure model coding capabilities, schema adherence accuracy, TTFT, and token throughput.

## When to Activate
Activate when benchmarking model adapters, comparing local runtimes, or testing fine-tuned checkpoints.

## Required Tools
- `shell_execute`

## Optional Tools
- `read_file`

## Inputs
Target model, evaluation dataset or benchmark suite (ToolBench, HumanEval, TTFT).

## Preconditions
Model provider must be online.

## Procedure
1. Load evaluation test cases (e.g. benchmarks/index.ts).
2. Execute model prompts sequentially or in controlled batches.
3. Measure Time-to-First-Token (TTFT) and tokens-per-second throughput.
4. Evaluate schema accuracy: check if tool call arguments match JSON schema definitions.
5. Execute generated code tests to measure functional correctness (pass@1).
6. Compile benchmark report.

## Tool Usage
Invoke tsx benchmarks/index.ts via shell_execute.

## Safety
Run evaluated code in isolated sandboxes to prevent test execution side effects.

## Permissions
Safe benchmarking evaluation.

## Verification
Confirm benchmark assertions pass within target latency and accuracy budgets.

## Failure Handling
If evaluation fails to parse outputs, record exact raw response for failure analysis.

## Output Contract
ModelBenchmarkReport with accuracyPercent, ttftMs, tokensPerSec, memoryMb.

## Examples
Evaluating ToolBench schema accuracy (100%) and startup latency (25ms).

## Related Skills
- `ai-llm`
- `data-data-analysis`
