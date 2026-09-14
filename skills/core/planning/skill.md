---
name: core-planning
version: 1.0.0
description: Decomposes complex engineering goals into atomic, dependency-ordered milestones.
category: core
risk: safe
requires_permission: false
required_tools:
  - list_directory
optional_tools:
  - read_file
  - search_files
---

# Hierarchical Task Planning

## Purpose
Formulate an actionable, structured execution plan before code mutations occur.

## When to Activate
Activate when a user goal spans multiple files, packages, or architectural layers.

## Required Tools
- `list_directory`

## Optional Tools
- `read_file`
- `search_files`

## Inputs
High-level objective, repository overview, constraints, and relevant file paths.

## Preconditions
Workspace root must be resolved and readable.

## Procedure
1. Analyze the user prompt to identify core requirements and deliverables.
2. Perform rapid repository inspection using list_directory or search_files.
3. Formulate an ordered list of milestone steps with explicit verification criteria.
4. Flag high-risk steps requiring user authorization.
5. Export plan to session memory and emit plan event to EventBus.

## Tool Usage
Use list_directory to inspect repository structure and identify target modules.

## Safety
Never plan destructive operations without flagging confirmation requirements.

## Permissions
Read-only operation. Requires no elevated capability.

## Verification
Verify that every milestone step has an associated observable verification command.

## Failure Handling
If dependencies are ambiguous, insert an exploration step before implementation.

## Output Contract
Structured Plan object with goal description and array of Step objects.

## Examples
Plan creation for adding a new cloud provider adapter with unit tests.

## Related Skills
- `core-task-management`
- `core-reasoning`
- `core-verification`
