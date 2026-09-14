---
name: data-json
version: 1.0.0
description: Parses, validates, formats, and transforms JSON and JSON5 data with strict schema validation.
category: data
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - write_file
  - edit_file
---

# JSON Processing & Schema Validation

## Purpose
Inspect, query, format, and validate structured JSON documents and configuration files.

## When to Activate
Activate when manipulating package.json, tsconfig.json, JSON schemas, or API responses.

## Required Tools
- `read_file`

## Optional Tools
- `write_file`
- `edit_file`

## Inputs
JSON file path or string, JSONPath query, schema validator.

## Preconditions
Target JSON must be valid or fixable.

## Procedure
1. Read JSON file using read_file.
2. Parse JSON with precise error localization on syntax errors (line/column).
3. If schema is provided: validate JSON against Draft 2020-12 schema.
4. If query is provided: evaluate path expression and extract data.
5. If formatting: re-indent with 2 spaces preserving key order.

## Tool Usage
Use read_file to load, write_file to save modified JSON.

## Safety
Prevent prototype pollution attacks when parsing untrusted JSON.

## Permissions
Safe read-only operation unless saving modifications.

## Verification
Confirm JSON parses cleanly with zero syntax errors.

## Failure Handling
On JSON parse failure, report exact line number and offending token.

## Output Contract
JsonProcessingResult with parsedData, isValid: boolean, errors: string[].

## Examples
Validating chat.schema.json against Draft 2020-12 schema rules.

## Related Skills
- `data-yaml`
- `filesystem-edit-file`
