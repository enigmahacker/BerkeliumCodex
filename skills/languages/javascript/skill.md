---
name: languages-javascript
version: 1.0.0
description: JavaScript ECMAScript standards, Node.js runtimes, ESM vs CommonJS, and event loops.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# JavaScript & Node.js Runtime Engineering

## Purpose
Govern JavaScript execution, ESM (import) vs CommonJS (require) boundaries, and async event loops.

## When to Activate
Activate when editing *.js, *.mjs, *.cjs files or Node.js backend services.

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
JavaScript source files, package.json.

## Preconditions
Node.js runtime must be installed.

## Procedure
1. Check package.json "type" field ("module" vs CommonJS default).
2. Ensure consistent import/export syntax (do not mix require and import in same file).
3. Verify asynchronous Promise handling with async/await and try/catch.
4. Avoid unhandled promise rejections and event listener memory leaks.
5. Validate code using Node.js or test runner.

## Tool Usage
Use read_file to inspect source, shell_execute to run node scripts.

## Safety
Do not use eval() or Function() constructor with untrusted user input.

## Permissions
Safe convention guidelines.

## Verification
Confirm node executes script without unhandled rejections.

## Failure Handling
If ReferenceError: require is not defined occurs, convert to ES module import syntax.

## Output Contract
JavaScriptValidation with moduleFormat (esm/cjs), nodeCompat: boolean.

## Examples
Converting CommonJS require calls to ES module imports in a package.

## Related Skills
- `languages-typescript`
- `frameworks-nodejs`
