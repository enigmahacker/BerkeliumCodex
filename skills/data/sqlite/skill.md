---
name: data-sqlite
version: 1.0.0
description: Queries and inspects SQLite database schemas, tables, indexes, and records.
category: data
risk: medium
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - file_metadata
---

# SQLite Database Inspection & Querying

## Purpose
Examine SQLite database schemas, execute read-only queries, and verify table states.

## When to Activate
Activate when debugging local application databases, session stores, or cache files.

## Required Tools
- `shell_execute`

## Optional Tools
- `file_metadata`

## Inputs
Database file path, SQL query string.

## Preconditions
Database file must exist and sqlite3 command or driver available.

## Procedure
1. Verify database file exists and is a valid SQLite 3 file.
2. Check if SQL query is read-only (SELECT, PRAGMA).
3. If mutating query (UPDATE, DELETE), request explicit confirmation.
4. Execute query via sqlite3 CLI or driver.
5. Format query result rows as structured JSON or markdown table.

## Tool Usage
Invoke sqlite3 via shell_execute.

## Safety
Enforce read-only mode by default; block destructive DROP/TRUNCATE without authorization.

## Permissions
Requires shell execution and database write permission for mutations.

## Verification
Confirm query returns valid rows and exit code 0.

## Failure Handling
If database is locked (busy), retry with timeout or inspect open processes.

## Output Contract
QueryResult with columns: string[], rows: array, executionTimeMs: number.

## Examples
Running PRAGMA table_info(sessions); on local session database.

## Related Skills
- `data-data-analysis`
- `terminal-shell`
