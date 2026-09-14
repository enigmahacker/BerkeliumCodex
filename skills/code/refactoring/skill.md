---
name: code-refactoring
version: 1.0.0
description: Improves code structure, readability, and performance without altering external behavior.
category: code
risk: medium
requires_permission: true
required_tools:
  - read_file
  - edit_file
  - shell_execute
optional_tools:
  - git_diff
---

# Behavior-Preserving Code Refactoring

## Purpose
Refactor code safely by maintaining test passing status at every intermediate transformation.

## When to Activate
Activate when eliminating code duplication, decomposing large functions, or modernizing syntax.

## Required Tools
- `read_file`
- `edit_file`
- `shell_execute`

## Optional Tools
- `git_diff`

## Inputs
Target file(s), refactoring goal (extract method, rename symbol, decompose module).

## Preconditions
Existing test suite must be passing before refactoring begins.

## Procedure
1. Run baseline test suite to confirm all tests currently pass.
2. Plan atomic refactoring steps (one transformation at a time).
3. Apply code edit via edit_file.
4. Run test suite after each step to verify behavior is strictly preserved.
5. Inspect git diff to ensure public API signatures remain backward compatible.
6. Conclude when code cleanliness goal is achieved.

## Tool Usage
Use read_file, edit_file, and shell_execute to run test validation.

## Safety
Never alter external function signatures or breaking public contracts during refactoring.

## Permissions
Requires filesystem edit capability.

## Verification
All existing tests must continue to pass with 0 regressions.

## Failure Handling
If any test breaks, revert the immediate transformation step and re-evaluate.

## Output Contract
RefactoringSummary with steps_taken, files_modified, and test_verification.

## Examples
Extracting redundant error formatting logic into a shared helper function.

## Related Skills
- `code-code-editing`
- `testing-regression-testing`
