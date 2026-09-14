---
name: data-csv
version: 1.0.0
description: Parses and analyzes tabular CSV and TSV data files with delimiter detection and headers.
category: data
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - write_file
---

# CSV & Tabular Data Processing

## Purpose
Parse tabular datasets, extract column stats, filter rows, and format markdown tables.

## When to Activate
Activate when inspecting benchmark results, telemetry dumps, or data export files.

## Required Tools
- `read_file`

## Optional Tools
- `write_file`

## Inputs
CSV file path, delimiter (comma, tab, semicolon), hasHeaders flag.

## Preconditions
CSV file must exist and be readable.

## Procedure
1. Read CSV sample slice using read_file.
2. Detect delimiter (comma, tab, semicolon).
3. Parse header row and column names.
4. Stream and parse data rows, handling quoted fields containing commas.
5. Compute basic summary metrics (row count, numeric column means).
6. Return structured tabular object.

## Tool Usage
Invoke read_file with line slicing.

## Safety
Do not load multi-gigabyte CSV files entirely into memory; process in slices.

## Permissions
Safe read-only operation.

## Verification
Verify parsed column counts are consistent across all rows.

## Failure Handling
If rows have inconsistent column counts, report line numbers of irregular rows.

## Output Contract
TabularData with columns: string[], rowCount: number, preview: array.

## Examples
Parsing benchmark latency logs from benchmarks/results.csv.

## Related Skills
- `data-data-analysis`
- `data-json`
