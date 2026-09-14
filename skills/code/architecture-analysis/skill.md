---
name: code-architecture-analysis
version: 1.0.0
description: Maps system architecture, subsystem boundaries, data flow pipelines, and design patterns.
category: code
risk: safe
requires_permission: false
required_tools:
  - list_directory
  - read_file
optional_tools:
  - search_files
---

# System Architecture & Subsystem Mapping

## Purpose
Evaluate structural boundaries, layering rules, and event communication flows.

## When to Activate
Activate when onboarding to a new codebase, designing new subsystems, or refactoring monorepos.

## Required Tools
- `list_directory`
- `read_file`

## Optional Tools
- `search_files`

## Inputs
Workspace root, project documentation, package structure.

## Preconditions
Project documentation and source trees must exist.

## Procedure
1. Read ARCHITECTURE.md and AGENTS.md to understand core design invariants.
2. Inspect package boundaries and export maps across packages/.
3. Trace data flow: UI -> EventBus -> AgentRuntime -> ToolOrchestrator -> PermissionEngine.
4. Verify decoupling: ensure UI never directly imports provider clients or executes shell commands.
5. Document architecture map and identify any boundary violations.

## Tool Usage
Use list_directory and read_file to inspect package definitions.

## Safety
Read-only analysis.

## Permissions
Safe operation.

## Verification
Confirm identified components align with the documented architectural rules.

## Failure Handling
If architectural docs are missing, synthesize architecture from package dependencies.

## Output Contract
ArchitectureMap with layers, components, data flows, and invariant compliance status.

## Examples
Verifying that @berkelium/providers does not depend on @berkelium/cli.

## Related Skills
- `code-dependency-analysis`
- `core-reasoning`
