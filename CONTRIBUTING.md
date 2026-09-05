# Contributing to Berkelium

Thank you for your interest in contributing to Berkelium CLI.

## Invariants
1. All contributions must adhere to the rules in [AGENTS.md](file:///Users/prithviaryam/Downloads/claude-code-main/AGENTS.md).
2. Never couple UI code to providers or tools directly.
3. Keep the agent provider-neutral and local-first.
4. Maintain high test coverage with unit, integration, and golden tests.

## Workflow
1. Fork and clone the repository.
2. Run `pnpm install` to install dependencies.
3. Run `pnpm test` and `pnpm run typecheck` to verify code health.
4. Run `pnpm run bench` before and after performance-sensitive modifications.
