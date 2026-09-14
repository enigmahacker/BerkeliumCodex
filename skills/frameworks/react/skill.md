---
name: frameworks-react
version: 1.0.0
description: React component architecture, hooks conventions, state management, and virtual DOM rendering.
category: frameworks
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
  - edit_file
---

# React Component & Hooks Architecture

## Purpose
Guide React development: hooks rules, state colocation, memoization, and component testing.

## When to Activate
Activate when working on React applications (*.jsx, *.tsx, React web apps).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`
- `edit_file`

## Inputs
React component files, package.json.

## Preconditions
React dependencies must be installed.

## Procedure
1. Check React version (e.g. React 18/19).
2. Validate Rules of Hooks: call hooks only at top level, never inside conditionals or loops.
3. Colocate state to the lowest common ancestor component to prevent unnecessary re-renders.
4. Use React.memo and useMemo only where profiling indicates performance bottlenecks.
5. Run component tests using React Testing Library or Vitest.

## Tool Usage
Use read_file to inspect components; shell_execute for running test suites.

## Safety
Do not mutate component state directly; always use state setter functions.

## Permissions
Safe convention guidelines.

## Verification
Confirm component renders without React key warnings or hook errors.

## Failure Handling
If infinite re-render loop occurs, inspect useEffect dependency array.

## Output Contract
ReactAuditResult with reactVersion, hooksCompliant: boolean, componentCount.

## Examples
Auditing a React UI component for stale closures and missing useEffect dependencies.

## Related Skills
- `frameworks-nextjs`
- `languages-typescript`
