---
name: security-dependency-security
version: 1.0.0
description: Audits third-party packages for known CVEs, malicious packages, and supply-chain tampering.
category: security
risk: safe
requires_permission: false
required_tools:
  - shell_execute
  - read_file
optional_tools:
  []
---

# Supply-Chain & Dependency Security Audit

## Purpose
Detect vulnerable dependencies and supply-chain risks using pnpm audit or npm audit.

## When to Activate
Activate when adding new npm/pip packages or running security audits.

## Required Tools
- `shell_execute`
- `read_file`

## Optional Tools
None.

## Inputs
Lockfile path (pnpm-lock.yaml, package-lock.json).

## Preconditions
Project lockfile must exist.

## Procedure
1. Execute pnpm audit --audit-level=high via shell_execute.
2. Parse audit report for advisory IDs, affected packages, and severity.
3. Identify whether a patch version is available to fix the advisory.
4. Verify package integrity via lockfile checksums.
5. Formulate package upgrade plan if vulnerabilities are detected.

## Tool Usage
Call pnpm audit or npm audit via shell_execute.

## Safety
Do not run npm audit fix --force automatically without testing.

## Permissions
Safe read-only execution.

## Verification
Confirm audit output reports 0 critical or high vulnerabilities.

## Failure Handling
If audit reveals unfixable vulnerability, evaluate alternative packages.

## Output Contract
DependencyAuditReport with vulnerabilitiesCount, advisories: array.

## Examples
Auditing pnpm-lock.yaml for high or critical vulnerabilities.

## Related Skills
- `code-dependency-analysis`
- `security-security-audit`
