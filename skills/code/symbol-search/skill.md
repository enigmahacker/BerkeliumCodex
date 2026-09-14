---
name: code-symbol-search
version: 1.0.0
description: Locates functions, classes, interfaces, and exported types across the project.
category: code
risk: safe
requires_permission: false
required_tools:
  - search_files
optional_tools:
  - read_file
---

# AST & Symbol Definition Search

## Purpose
Find declarations and definitions of classes, interfaces, types, and functions.

## When to Activate
Activate when exploring code architecture, extending interfaces, or refactoring symbols.

## Required Tools
- `search_files`

## Optional Tools
- `read_file`

## Inputs
Symbol name, symbol kind (class, function, interface, type).

## Preconditions
Source files must be accessible.

## Procedure
1. Construct targeted search patterns for symbol declaration in the project language.
2. Search through source directories using search_files.
3. Locate exact declaration file and line range.
4. Read declaration context via read_file to inspect exported signatures.
5. Return symbol definition location and signature.

## Tool Usage
Call search_files with declaration regex, then read_file for signature extraction.

## Safety
Read-only search.

## Permissions
Safe read-only operation.

## Verification
Confirm matching file contains the symbol declaration at the specified line.

## Failure Handling
If symbol not found in workspace, check node_modules/@types or external imports.

## Output Contract
SymbolDeclaration with name, kind, file, line, and signature.

## Examples
Locating the declaration of PermissionEngine across all packages.

## Related Skills
- `code-code-search`
- `code-architecture-analysis`
