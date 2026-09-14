---
name: data-data-analysis
version: 1.0.0
description: Performs statistical analysis, aggregations, trend analysis, and benchmark metric evaluation.
category: data
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  - read_file
---

# Statistical & Benchmark Data Analysis

## Purpose
Analyze latency percentiles (p50, p95, p99), token throughput, memory trends, and distributions.

## When to Activate
Activate when analyzing benchmark outputs, profiling memory logs, or comparing runtimes.

## Required Tools
None.

## Optional Tools
- `read_file`

## Inputs
Numeric dataset or benchmark results array.

## Preconditions
Dataset must be provided or read from benchmark output.

## Procedure
1. Parse numerical arrays (e.g. latency in ms, tokens/sec, memory in MB).
2. Calculate summary statistics: mean, median, min, max, standard deviation.
3. Compute percentiles: p50, p90, p95, p99.
4. Compare against established performance budgets.
5. Formulate recommendations for performance optimization.

## Tool Usage
In-memory statistical computations.

## Safety
Safe mathematical analysis.

## Permissions
Safe operation.

## Verification
Verify statistical metrics are within mathematically valid bounds.

## Failure Handling
Handle empty datasets or NaN values by filtering invalid entries.

## Output Contract
AnalysisSummary with count, mean, median, p95, p99, min, max, budgetPass: boolean.

## Examples
Evaluating whether startup latency (25ms) satisfies the <150ms budget.

## Related Skills
- `data-csv`
- `terminal-diagnostics`
