---
name: git-conflict-resolution
version: 1.0.0
description: Detects conflict markers (<<<<<<<, =======, >>>>>>>) and surgically resolves three-way merges.
category: git
risk: medium
requires_permission: true
required_tools:
  - read_file
  - edit_file
  - shell_execute
optional_tools:
  - git_status
---

# Three-Way Git Conflict Resolution

## Purpose
Parse conflict markers, analyze conflicting edits, and synthesize clean unified resolutions.

## When to Activate
Activate during git merge, rebase, or cherry-pick conflicts.

## Required Tools
- `read_file`
- `edit_file`
- `shell_execute`

## Optional Tools
- `git_status`

## Inputs
List of conflicted file paths.

## Preconditions
Repository must be in a conflicted merge or rebase state.

## Procedure
1. Call git_status to identify all unmerged paths (both modified).
2. For each conflicted file: read file content using read_file.
3. Locate all conflict marker regions (<<<<<<< HEAD, =======, >>>>>>> branch).
4. Analyze the semantic intent of both changes.
5. Apply edit_file to replace the conflict region with the correct unified logic.
6. Run test suite to verify the resolution compiles and tests pass.
7. Stage resolved files with git add.

## Tool Usage
Use read_file to inspect markers, edit_file to replace, shell_execute to stage.

## Safety
Ensure NO conflict markers (<<<<<<<, =======, >>>>>>>) remain in any file.

## Permissions
Requires filesystem edit permission.

## Verification
Verify with search_files that no conflict markers remain and tests pass.

## Failure Handling
If resolution breaks semantics, abort merge via git merge --abort.

## Output Contract
ConflictResolutionReport with resolvedFiles: string[], testStatus.

## Examples
Resolving conflicting package.json version updates.

## Related Skills
- `git-merge`
- `git-rebase`
- `code-code-editing`
