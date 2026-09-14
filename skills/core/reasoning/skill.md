---
name: core-reasoning
version: 1.0.0
description: Executes deliberative architectural analysis and trade-off evaluation before implementation.
category: core
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  - read_file
---

# Deliberative Architectural Reasoning

## Purpose
Analyze architectural tradeoffs, algorithm complexity, and edge cases prior to code modification.

## When to Activate
Activate when resolving subtle bugs, designing APIs, or choosing third-party libraries.

## Required Tools
None.

## Optional Tools
- `read_file`

## Inputs
Problem statement, architectural invariants, code snippets, and performance budgets.

## Preconditions
Relevant file contexts or error traces must be accessible.

## Procedure
1. State the technical challenge and identify underlying assumptions.
2. Enumerate alternative implementation approaches with pros and cons.
3. Evaluate approaches against project constraints (latency, memory, backwards compatibility).
4. Select the optimal approach adhering to repository invariants.
5. Synthesize justification and pass to planning or coding pipeline.

## Tool Usage
Use read_file to inspect interface contracts and typing definitions.

## Safety
Prevent premature optimization; align strictly with AGENTS.md architectural rules.

## Permissions
Safe cognitive process requiring no system permissions.

## Verification
Check that the selected approach addresses all failure modes identified during analysis.

## Failure Handling
If tradeoffs are evenly balanced, prioritize simplicity and minimal diff surface.

## Output Contract
Reasoning markdown block detailing problem, options, tradeoff matrix, and decision.

## Examples
Deciding between in-memory LRU cache vs persistent disk cache for model tokens.

## Related Skills
- `core-planning`
- `code-architecture-analysis`
