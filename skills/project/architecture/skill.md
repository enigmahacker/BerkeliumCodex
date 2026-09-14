---
name: project-architecture
version: 1.0.0
description: Analyzes system architecture, module boundaries, architectural invariants, and design patterns across the codebase.
category: project
risk: safe
requires_permission: false
required_tools:
  - read_file
  - search_files
optional_tools:
  - list_directory
---

# System Architecture & Boundary Analysis

## Purpose
Map system components, communication patterns, layer boundaries, and enforce architectural invariants.

## When to Activate
Activate when planning large refactors, adding new packages/modules, or auditing design patterns.

## Required Tools
- `read_file`
- `search_files`

## Optional Tools
- `list_directory`

## Inputs
Target module or full workspace architecture specification.

## Preconditions
Workspace source tree must be accessible.

## Procedure
1. Inspect architectural documentation (ARCHITECTURE.md, AGENTS.md, DESIGN.md).
2. Map package and module dependencies to detect circular dependencies or improper coupling.
3. Verify architectural invariants (e.g., UI does not call model APIs directly, tools go through ToolOrchestrator).
4. Identify cross-cutting concerns: logging, error handling, telemetry, and security boundaries.
5. Diagram or summarize component topology and data flow pathways.
6. Provide architectural evaluation and recommendations.

## Tool Usage
Use read_file to inspect architecture docs and core entrypoints; search_files to trace module imports.

## Safety
Read-only analysis.

## Permissions
Safe read-only execution.

## Verification
Confirm module dependencies adhere to declared boundaries and invariants.

## Failure Handling
If architectural docs are absent, infer architecture from workspace directory hierarchy and package manifests.

## Output Contract
ArchitectureReport with componentMap, dataFlow, invariantStatus, and boundaryViolations.

## Examples
Verifying provider-neutrality and event-bus decoupling invariants in Berkelium runtime.

## Related Skills
- `code-architecture-analysis`
- `project-discovery`
- `project-health`
