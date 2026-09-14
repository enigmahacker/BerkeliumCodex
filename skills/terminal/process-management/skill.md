---
name: terminal-process-management
version: 1.0.0
description: Monitors, inspects, and terminates long-running or background processes.
category: terminal
risk: medium
requires_permission: true
required_tools:
  - process_list
optional_tools:
  - process_kill
  - shell_execute
---

# Process Lifecycle & Termination Management

## Purpose
Supervise background servers, watchers, test daemons, and terminate rogue processes.

## When to Activate
Activate when dev servers hang, port conflicts occur, or background tasks complete.

## Required Tools
- `process_list`

## Optional Tools
- `process_kill`
- `shell_execute`

## Inputs
Process ID (PID), process name, signal (SIGTERM, SIGKILL).

## Preconditions
PID must belong to a spawned child process or user-authorized target.

## Procedure
1. Call process_list to inspect active inference, dev server, or test processes.
2. Locate target process by PID, name, or listening port.
3. If termination is needed, attempt graceful termination with SIGTERM.
4. Wait for graceful shutdown; if process remains active after 3000ms, send SIGKILL.
5. Verify process is no longer active.

## Tool Usage
Call process_list to enumerate processes; process_kill to terminate by PID.

## Safety
NEVER terminate system-critical processes (init, launchd, window manager).

## Permissions
Requires process termination capability.

## Verification
Confirm process no longer appears in process_list.

## Failure Handling
If permission denied when signaling process, alert user that process is owned by another user.

## Output Contract
ProcessStatus with pid, status (running/terminated), exit_signal.

## Examples
Killing a stale Vite dev server running on port 5173.

## Related Skills
- `terminal-shell`
- `terminal-diagnostics`
