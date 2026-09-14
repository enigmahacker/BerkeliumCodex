---
name: security-security-audit
version: 1.0.0
description: Scans workspace, commits, and dependencies for vulnerabilities, misconfigurations, and unsafe patterns.
category: security
risk: safe
requires_permission: false
required_tools:
  - search_files
optional_tools:
  - shell_execute
  - read_file
---

# Workspace Security Audit & Vulnerability Scan

## Purpose
Conduct comprehensive security audits detecting injection flaws, insecure dependencies, and misconfigurations.

## When to Activate
Activate on bk scan security, before releases, or when auditing PR contributions.

## Required Tools
- `search_files`

## Optional Tools
- `shell_execute`
- `read_file`

## Inputs
Workspace root path, audit scope (secrets, dependencies, code, git).

## Preconditions
Workspace must be accessible.

## Procedure
1. Run SecurityScanner across all workspace files.
2. Scan for hardcoded credentials (API keys, private keys, passwords).
3. Check for path traversal vulnerabilities and unsafe command execution patterns.
4. Scan dependency manifests for known CVEs or supply-chain advisories.
5. Compile vulnerability findings with severity ratings (CRITICAL, HIGH, MEDIUM, LOW).
6. Provide concrete remediation steps for every finding.

## Tool Usage
Invoke search_files and SecurityScanner.

## Safety
Never display unmasked raw secrets in the audit report.

## Permissions
Safe read-only audit.

## Verification
Confirm all discovered issues have severity, file location, and remediation guidance.

## Failure Handling
If scanner errors on binary files, exclude binaries and continue scan.

## Output Contract
SecurityAuditReport with totalIssues, criticalCount, highCount, findings: array.

## Examples
Running bk scan security in BerkeliumCodex root.

## Related Skills
- `security-secrets`
- `security-dependency-security`
- `security-threat-modeling`
