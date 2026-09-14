---
name: code-code-editing
version: 1.0.0
description: Applies surgical, convention-preserving modifications to source code following the 8-step edit loop.
category: code
risk: medium
requires_permission: true
required_tools:
  - edit_file
  - read_file
optional_tools:
  - git_diff
---

# Precision Code Modification

## Purpose
Implement code changes following the canonical loop: INSPECT -> UNDERSTAND -> PLAN -> EDIT -> FORMAT -> TEST -> DIFF -> VERIFY.

## When to Activate
Activate whenever editing source code to fix bugs, add features, or update interfaces.

## Required Tools
- `edit_file`
- `read_file`

## Optional Tools
- `git_diff`

## Inputs
Target file path, problem explanation, proposed code change.

## Preconditions
File must be read first to understand local context, naming conventions, and style.

## Procedure
1. INSPECT: Read the target file and surrounding context using read_file.
2. UNDERSTAND: Identify naming conventions, typing invariants, and existing comments.
3. PLAN: Determine the minimum diff required to achieve the goal.
4. EDIT: Apply surgical edit using edit_file.
5. FORMAT: Ensure indentation matches file standards.
6. TEST: Run tests covering the edited component.
7. DIFF: Review git diff to verify no unintended changes or extra whitespace.
8. VERIFY: Confirm compilation and typecheck pass cleanly.

## Tool Usage
Call read_file to inspect, edit_file to patch, git_diff to review.

## Safety
NEVER rewrite an entire file when a targeted edit is sufficient. Preserve existing comments and style.

## Permissions
Requires filesystem edit capability.

## Verification
Verify test suite and typechecker pass with exit code 0.

## Failure Handling
If edit fails to apply or breaks tests, revert changes via git checkout and retry.

## Output Contract
CodeEditResult with file, diffSummary, and verificationStatus.

## Examples
Adding a new case handler inside a state machine switch statement.

## Related Skills
- `filesystem-edit-file`
- `core-verification`
- `code-refactoring`
