---
name: project-onboarding
version: 1.0.0
description: Guides agent and developer onboarding by validating environment prerequisites, tooling, and developer setup.
category: project
risk: safe
requires_permission: false
required_tools:
  - read_file
  - shell_execute
optional_tools:
  - environment_get
---

# Developer & Agent Onboarding Verification

## Purpose
Verify system requirements, toolchain versions, installed dependencies, and initial build readiness.

## When to Activate
Activate when initializing a new workspace, verifying developer setup, or troubleshooting missing toolchains.

## Required Tools
- `read_file`
- `shell_execute`

## Optional Tools
- `environment_get`

## Inputs
Project setup documentation, required runtime versions (node, rustc, python, etc.).

## Preconditions
Workspace must be discovered and initialized.

## Procedure
1. Read setup instructions in README.md, CONTRIBUTING.md, or DEVELOPMENT.md.
2. Check required tool versions against local environment via shell_execute (node -v, pnpm -v, rustc --version).
3. Validate presence of package lockfiles (pnpm-lock.yaml, package-lock.json, Cargo.lock).
4. Verify environment variable prerequisites (.env.example comparison).
5. Run smoke test or quick sanity check (e.g., pnpm run lint --dry-run or equivalent).
6. Produce an onboarding status report highlighting any missing prerequisites.

## Tool Usage
Use read_file for setup guidelines; shell_execute for runtime version checks.

## Safety
Do not install global tools or mutate system packages without explicit user confirmation.

## Permissions
Read-only and diagnostic command execution.

## Verification
Confirm all required compilers, package managers, and dependencies meet project specifications.

## Failure Handling
If required tool is missing, provide exact OS-specific installation instructions (Homebrew, apt, etc.).

## Output Contract
OnboardingStatusReport with toolchainChecks, envPrerequisites, and readinessScore.

## Examples
Verifying Node 20+, pnpm 9+, and Turbo are installed before compiling Berkelium monorepo.

## Related Skills
- `project-discovery`
- `terminal-environment`
- `project-health`
