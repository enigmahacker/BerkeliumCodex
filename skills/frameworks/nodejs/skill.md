---
name: frameworks-nodejs
version: 1.0.0
description: Node.js backend architectures, native modules, asynchronous I/O, streams, and cluster workers.
category: frameworks
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Node.js Backend & Core APIs

## Purpose
Govern Node.js server architectures, native fs/promises, stream pipelines, and buffer management.

## When to Activate
Activate when developing Node.js CLI tools, background workers, or backend microservices.

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Node.js source files, package.json.

## Preconditions
Node.js 20+ runtime.

## Procedure
1. Check Node.js version target in package.json engines (>= 20.0.0).
2. Utilize native node: namespace imports (node:fs, node:path, node:crypto).
3. Use streams and pipeline() for large file processing rather than reading whole buffers.
4. Ensure graceful process termination with process.on('SIGTERM', ...).
5. Run node validation suite to verify process health and memory footprint.

## Tool Usage
Use read_file to inspect source; shell_execute to run scripts.

## Safety
Avoid synchronous blocking APIs (fs.readFileSync) inside high-concurrency request paths.

## Permissions
Safe convention guidelines.

## Verification
Confirm Node.js processes exit with code 0 on clean completion.

## Failure Handling
If EventEmitter memory leak warning occurs, ensure removeListener is called.

## Output Contract
NodeJsAuditResult with nodeVersion, memoryUsageMb, streamsCompliant: boolean.

## Examples
Architecting streaming NDJSON parser for Berkelium Codex chat protocol.

## Related Skills
- `languages-javascript`
- `languages-typescript`
