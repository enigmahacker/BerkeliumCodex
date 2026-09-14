---
name: agents-agent-review
version: 1.0.0
description: Deploys a dedicated Reviewer subagent to validate output artifacts against invariants before acceptance.
category: agents
risk: safe
requires_permission: false
required_tools:
  - git_diff
  - read_file
optional_tools:
  []
---

# Adversarial Subagent Review & Quality Gate

## Purpose
Perform objective secondary review of code changes made by Coder subagent.

## When to Activate
Activate after code modifications are finished before marking task complete.

## Required Tools
- `git_diff`
- `read_file`

## Optional Tools
None.

## Inputs
Coder task objective, generated git diff, test results.

## Preconditions
Code changes must be staged in working tree.

## Procedure
1. Spawn Reviewer subagent with read-only tools.
2. Review git diff against original user instructions.
3. Verify that changes do not violate AGENTS.md architectural boundaries.
4. Verify all new logic has corresponding test coverage.
5. Reviewer issues either APPROVAL or REJECTION with required modifications.
6. If rejected: pass feedback back to Coder for remediation.

## Tool Usage
Uses git_diff and read_file in read-only mode.

## Safety
Reviewer cannot edit files directly; must only critique and verify.

## Permissions
Safe read-only review.

## Verification
Confirm review decision is based on verified test and diff evidence.

## Failure Handling
If Reviewer finds defects, do not complete task; return to editing cycle.

## Output Contract
ReviewDecision with approved: boolean, critique: string, requiredFixes: string[].

## Examples
Reviewer subagent validating that a new command does not bypass PermissionEngine.

## Related Skills
- `code-code-review`
- `agents-subagents`
- `core-verification`
