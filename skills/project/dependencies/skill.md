---
name: project-dependencies
version: 1.0.0
description: Inspects project dependencies, version compatibility, duplicate packages, peer dependency mismatches, and updates.
category: project
risk: safe
requires_permission: false
required_tools:
  - read_file
  - shell_execute
optional_tools:
  - search_files
---

# Project Dependency Management & Audit

## Purpose
Analyze external dependencies, detect version drift, resolve peer dependency conflicts, and audit update availability.

## When to Activate
Activate when updating dependencies, troubleshooting version conflicts, or auditing bundle size impact.

## Required Tools
- `read_file`
- `shell_execute`

## Optional Tools
- `search_files`

## Inputs
Target package.json, Cargo.toml, or lockfile.

## Preconditions
Project manifest files must be present.

## Procedure
1. Read root and workspace package manifests to index direct and development dependencies.
2. Check for duplicate or conflicting versions across monorepo workspace packages.
3. Run package manager audit or dependency tree inspection (pnpm why, cargo tree, pip list).
4. Verify peer dependency compatibility and identify deprecated or abandoned packages.
5. Identify outdated packages and evaluate breaking change risks for candidate upgrades.
6. Return dependency inventory and actionable recommendations.

## Tool Usage
Use read_file to parse manifests; shell_execute for pnpm list/why or cargo tree commands.

## Safety
Do not run package update or install commands with mutating flags without explicit user confirmation.

## Permissions
Safe read-only and diagnostic execution.

## Verification
Confirm dependency tree contains no unresolvable peer dependencies or duplicate conflicting versions.

## Failure Handling
If package manager CLI fails, parse lockfile directly to trace dependency versions.

## Output Contract
DependencyAuditReport with totalDeps, duplicates, outdatedCount, and vulnerabilityAlerts.

## Examples
Detecting mismatched React or TypeScript versions across Berkelium monorepo packages.

## Related Skills
- `security-dependency-security`
- `project-health`
- `build-build`
