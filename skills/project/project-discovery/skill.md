---
name: project-discovery
version: 1.0.0
description: Discovers repository topology, monorepo workspaces, language ecosystems, entrypoints, and configurations.
category: project
risk: safe
requires_permission: false
required_tools:
  - list_directory
  - read_file
optional_tools:
  - search_files
---

# Project Discovery & Repository Topology

## Purpose
Identify project ecosystem, package manager, workspace layout, build tools, and principal entry points.

## When to Activate
Activate at the beginning of a session or when exploring an unfamiliar codebase or workspace.

## Required Tools
- `list_directory`
- `read_file`

## Optional Tools
- `search_files`

## Inputs
Workspace root path or current directory.

## Preconditions
Target workspace directory must be readable.

## Procedure
1. List top-level files to identify configuration manifests (package.json, Cargo.toml, go.mod, pyproject.toml).
2. Detect monorepo structures (pnpm-workspace.yaml, lerna.json, nx.json, Cargo workspaces).
3. Identify language ecosystems, frameworks, testing runners, and build systems in use.
4. Locate primary application entry points (src/index.ts, apps/cli/src/main.rs, etc.).
5. Index documentation files (README.md, ARCHITECTURE.md, AGENTS.md, CONTRIBUTING.md).
6. Return structured repository profile to inform subsequent skill activations.

## Tool Usage
Use list_directory to inspect root structure; read_file to parse manifest files.

## Safety
Read-only operation. Respect .gitignore and skip large directories like node_modules or .git.

## Permissions
Safe read-only execution.

## Verification
Confirm repository ecosystem, primary language, and build tools are accurately identified.

## Failure Handling
If no manifest file is present, scan source files by extension to classify ecosystem.

## Output Contract
ProjectDiscoveryProfile with ecosystem, packageManager, workspaces, entrypoints, and docs.

## Examples
Identifying Berkelium monorepo layout with pnpm workspaces and TypeScript packages.

## Related Skills
- `project-onboarding`
- `project-architecture`
- `project-dependencies`
