---
name: terminal-diagnostics
version: 1.0.0
description: Runs deep system hardware, OS, memory, storage, and developer environment diagnostics.
category: terminal
risk: safe
requires_permission: false
required_tools:
  - diagnostics_run
optional_tools:
  - shell_execute
---

# System Diagnostics & Health Check

## Purpose
Assess platform architecture, chip capabilities, Node version, Git status, and model budget.

## When to Activate
Activate on bk doctor command or when troubleshooting mysterious build or runtime issues.

## Required Tools
- `diagnostics_run`

## Optional Tools
- `shell_execute`

## Inputs
Diagnostic scope: platform, runtime, providers, tools.

## Preconditions
Workspace root must be set.

## Procedure
1. Call diagnostics_run to gather platform metrics (OS, ARM64, CPU cores, RAM).
2. Check available memory budget for local models.
3. Verify Node.js version >= 20 and Git version.
4. Verify provider credentials and network reachability.
5. Compile comprehensive diagnostic report.

## Tool Usage
Invoke diagnostics_run.

## Safety
Read-only diagnostic inspection.

## Permissions
Safe operation.

## Verification
Verify all diagnostic checks report a status (passed, warning, failed).

## Failure Handling
If any sub-check errors, capture error message and mark that check failed.

## Output Contract
DiagnosticReport with system info, provider health, tool status, and warnings.

## Examples
Running bk doctor to verify Apple Silicon M4 Max memory allocation.

## Related Skills
- `core-agent-runtime`
- `project-project-health`
