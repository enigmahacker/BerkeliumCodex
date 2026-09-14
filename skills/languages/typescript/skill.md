---
name: languages-typescript
version: 1.0.0
description: TypeScript strict mode, composite monorepos, tsconfig project references, and type inference.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# TypeScript Strict Mode & Composite Project Engineering

## Purpose
Enforce strict type safety, zero `any` types, composite build references, and clean declaration emissions.

## When to Activate
Activate when working on *.ts, *.tsx files across packages/ and apps/.

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
TypeScript source files, tsconfig.json.

## Preconditions
TypeScript compiler must be configured.

## Procedure
1. Check tsconfig.json for strict: true, noImplicitAny: true, and composite: true.
2. Ensure interfaces and types are cleanly exported and imported with type modifiers.
3. Validate generic constraints and discriminated union patterns.
4. Run tsc -b ./tsconfig.json to verify composite project references.
5. Ensure emitted declarations (.d.ts) match implementation signatures.

## Tool Usage
Use read_file to check definitions; shell_execute for tsc -b.

## Safety
Do not use `as any` type assertions to silence valid compiler warnings.

## Permissions
Safe convention guidelines.

## Verification
Confirm tsc -b exits with 0 errors.

## Failure Handling
If circular type reference occurs, extract shared interfaces into dedicated types.ts.

## Output Contract
TypeScriptStatus with compilerVersion, strictMode: boolean, errors: array.

## Examples
Validating discriminated union types for BerkeliumChatEvent.

## Related Skills
- `build-type-check`
- `languages-javascript`
