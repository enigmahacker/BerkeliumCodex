---
name: infrastructure-ci-cd
version: 1.0.0
description: Designs, validates, and debugs continuous integration and deployment automation pipelines.
category: infrastructure
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
  - write_file
---

# CI/CD Pipeline Architecture & Validation

## Purpose
Architect resilient multi-OS test matrix pipelines, caching strategies, and quality gates.

## When to Activate
Activate when setting up CI, optimizing build times, or resolving pipeline failures.

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`
- `write_file`

## Inputs
Pipeline configuration path (.github/workflows/ci.yml, gitlab-ci.yml).

## Preconditions
Pipeline configuration file must exist or be requested.

## Procedure
1. Inspect pipeline steps: checkout -> setup runtime -> install deps -> typecheck -> test -> build.
2. Validate caching strategy (pnpm store, node_modules cache) to optimize run times.
3. Verify multi-OS matrix coverage (Linux, macOS, Windows where applicable).
4. Ensure critical quality gates (test coverage, benchmark budgets, secret audits) are enforced.
5. Validate YAML syntax and action versions.

## Tool Usage
Use read_file to inspect CI YAML; shell_execute to run local linter.

## Safety
Ensure CI secrets are referenced via repository secrets rather than committed plaintext.

## Permissions
Safe read-only analysis unless editing workflow files.

## Verification
Confirm workflow syntax is valid and all required stages are declared.

## Failure Handling
If action uses deprecated node runtime, upgrade action version tag.

## Output Contract
CiCdAuditReport with stages: array, matrixConfig: object, warnings: array.

## Examples
Auditing .github/workflows/ci.yml in BerkeliumCodex.

## Related Skills
- `infrastructure-github-actions`
- `github-actions`
