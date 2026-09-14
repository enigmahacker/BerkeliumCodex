---
name: filesystem-edit-file
version: 1.0.0
description: Applies surgical, targeted string replacements to files preserving surrounding structure.
category: filesystem
risk: medium
requires_permission: true
required_tools:
  - edit_file
  - read_file
optional_tools:
  - git_diff
---

# Surgical Targeted File Editing

## Purpose
Modify existing code with exact target match replacement, never rewriting whole files needlessly.

## When to Activate
Activate when fixing bugs, inserting features, or updating configuration parameters.

## Required Tools
- `edit_file`
- `read_file`

## Optional Tools
- `git_diff`

## Inputs
Target file path, target content substring, replacement content substring.

## Preconditions
Target file must exist, and targetContent must match uniquely within the file.

## Procedure
1. Read the target section of the file using read_file.
2. Identify unique target substring including indentation and whitespace.
3. Formulate replacement string preserving code conventions.
4. Call edit_file with target and replacement.
5. Verify that the diff is minimal and syntactically correct.

## Tool Usage
Invoke edit_file with targetPath, targetContent, and replacementContent.

## Safety
Target string must be unique within the file to prevent unintended replacement.

## Permissions
Requires filesystem edit permission.

## Verification
Check git diff or read the edited lines to confirm proper modification.

## Failure Handling
If targetContent is not found or ambiguous, re-read file and specify a wider range.

## Output Contract
Diff or confirmation of updated lines.

## Examples
Replacing a broken regex pattern inside src/parser.ts.

## Related Skills
- `filesystem-read-file`
- `code-code-editing`
- `core-verification`
