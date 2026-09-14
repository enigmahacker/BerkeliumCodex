---
name: code-dependency-analysis
version: 1.0.0
description: Analyzes package manifests, import graphs, circular dependencies, and module coupling.
category: code
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - list_directory
  - shell_execute
---

# Module & Dependency Graph Analysis

## Purpose
Map dependencies between packages in monorepos and detect dependency cycles.

## When to Activate
Activate during project scans, monorepo restructuring, or version conflict resolution.

## Required Tools
- `read_file`

## Optional Tools
- `list_directory`
- `shell_execute`

## Inputs
Package manifest paths (package.json, cargo.toml, pyproject.toml).

## Preconditions
Workspace manifests must be readable.

## Procedure
1. Locate all package.json files in packages/ and apps/.
2. Parse declared dependencies and workspace:* protocols.
3. Construct directed dependency graph.
4. Check for circular dependency cycles.
5. Identify outdated, unused, or mismatched package versions.

## Tool Usage
Use read_file to load manifests; invoke shell_execute for dependency audit tools if present.

## Safety
Read-only analysis.

## Permissions
Safe operation.

## Verification
Verify that dependency graph nodes and edges accurately reflect manifest contents.

## Failure Handling
If a manifest has syntax errors, report JSON parse error with line number.

## Output Contract
DependencyAnalysisReport with graph, circular_dependencies, and external_packages.

## Examples
Detecting if @berkelium/agent depends on apps/cli (violating invariant).

## Related Skills
- `project-dependencies`
- `security-dependency-security`
