---
name: security-sandboxing
version: 1.0.0
description: Jails filesystem and process execution strictly within authorized workspace boundaries.
category: security
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  []
---

# Workspace Jail & Path Traversal Prevention

## Purpose
Confine all file reads, writes, edits, and deletions strictly inside the designated workspace.

## When to Activate
Activate on every filesystem operation and working directory change.

## Required Tools
None.

## Optional Tools
None.

## Inputs
Target path (relative or absolute), workspace root.

## Preconditions
Workspace root must be an absolute path.

## Procedure
1. Resolve target path against workspace root: path.resolve(workspaceRoot, targetPath).
2. Check that resolved path starts with workspaceRoot + path.sep (or equals workspaceRoot).
3. Detect symlink escapes using realpath.
4. If path escapes workspace: throw PathEscapeError and emit path_escape_blocked event.
5. If path is valid: permit operation to proceed.

## Tool Usage
Enforced by ToolOrchestrator and WorkingDirectoryManager.

## Safety
STRICT INVARIANT: Never permit tool access to /etc, /var, ~/.ssh, or host root outside workspace.

## Permissions
Safe enforcement mechanism.

## Verification
Verify tests in tests/security/workspace-jail.test.ts pass with 0 escapes.

## Failure Handling
Block operation immediately with security warning event.

## Output Contract
SandboxingCheck with isJailed: boolean, resolvedPath: string.

## Examples
Blocking an attempted read of ../../../.ssh/id_rsa.

## Related Skills
- `filesystem-read-file`
- `security-permissions`
