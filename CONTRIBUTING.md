# Contributing to Berkelium Codex

Thank you for your interest in contributing to Berkelium Codex! Berkelium is built by and for software engineers who value terminal-first development, local autonomy, strict security boundaries, and model neutrality.

---

## 1. Foundational Invariants

All contributions MUST adhere to the engineering invariants defined in [AGENTS.md](./AGENTS.md):

1. **Provider Neutrality**: Berkelium is a provider-neutral terminal agent. Never couple UI code or AgentRuntime to vendor-specific endpoints or proprietary SDKs.
2. **Event-Driven Decoupling**: All UI updates and telemetry must originate from `AgentEvents` dispatched through the `EventBus`.
3. **No Direct Execution**: Never execute shell commands or file mutations directly from UI code. Every operation must pass through `ToolOrchestrator` and `PermissionEngine`.
4. **Credential Isolation**: Secrets must be stored via macOS Keychain or AES-256-GCM vault, never printed in logs or passed to model prompt layers.
5. **Quality Gates**: All PRs must compile cleanly (`pnpm run typecheck`), pass unit and integration tests (`pnpm test`), and satisfy benchmark latency budgets (`pnpm run bench`).

---

## 2. Development Setup

### Prerequisites
- **Node.js**: >= 20.0.0 (Node 22 LTS or Node 24 recommended)
- **pnpm**: >= 9.0.0 (`corepack enable` or `npm i -g pnpm`)
- **Git**: >= 2.40.0
- **macOS** (Apple Silicon M1–M4 recommended for local MLX inference) or **Linux**

### Getting Started

```bash
# 1. Fork & clone the repository
git clone https://github.com/<your-username>/BerkeliumCodex.git
cd BerkeliumCodex

# 2. Install monorepo dependencies
pnpm install

# 3. Compile all packages
pnpm run build

# 4. Run tests
pnpm test

# 5. Run typecheck
pnpm run typecheck

# 6. Run benchmarks
pnpm run bench

# 7. Start Berkelium CLI in development mode
pnpm bk
```

---

## 3. Contribution Pathways

### Pathway A: "Your First Berkelium PR"
1. Look for issues labeled `good first issue` or `help wanted`.
2. Create a feature branch: `git checkout -b fix/issue-description` or `feat/new-capability`.
3. Make your changes in the relevant package (`packages/*`) or app (`apps/cli`).
4. Add a unit test in `tests/unit/` covering your change.
5. Run `pnpm test` and `pnpm run typecheck` to verify your code.
6. Open a pull request using our PR template.

### Pathway B: "Build a Provider Adapter"
1. Create a new provider adapter in `packages/providers/src/adapters/<provider>.ts`.
2. Implement the `Provider` interface (`stream`, `generate`, `listModels`).
3. Define capabilities in `packages/providers/src/capability-matrix.ts`.
4. Register the adapter in `packages/providers/src/router.ts`.
5. Add unit tests in `tests/unit/<provider>-provider.test.ts` mocking network calls.

### Pathway C: "Build a Native Tool"
1. Create a tool class implementing `Tool<T>` in `packages/tools/src/<category>/<tool-name>.ts`.
2. Provide a strict Zod input schema and metadata (name, description, category, risk level).
3. Wire the tool into `ToolRegistry.ts`.
4. Add authorization checks in `packages/permissions/src/engine.ts` if the tool mutates state.
5. Add unit tests in `tests/unit/tools.test.ts`.

### Pathway D: "Build a Custom Subagent"
1. Define subagent role, system prompt, allowed tools, and context budget in `packages/agent/src/subagents.ts`.
2. Test subagent dispatch and execution in `tests/unit/subagents-suite.test.ts`.

### Pathway E: "Build a Skill"
1. Create a directory under `.berkelium/skills/<skill_name>/`.
2. Add a `SKILL.md` with YAML frontmatter describing capabilities, allowed tools, and prompt instructions.

---

## 4. Issue and PR Labels

We use standard GitHub labels to triage contributions:

- `good first issue`: Ideal for beginners and first-time contributors.
- `help wanted`: Tasks where community help is actively welcomed.
- `provider`: Changes to model providers and cloud/local adapters.
- `CLI`: Enhancements to the terminal user interface, command palette, and interactive loop.
- `security`: Permission engine, secret redactor, sandboxing, and vulnerability fixes.
- `performance`: Latency, token budget, context compaction, and memory optimizations.
- `testing`: Unit, integration, golden, and ToolBench tests.
- `agent-runtime`: State machine, autonomous loop, planner, and verifier.
- `context-engine`: AST symbol mapping, repo map, rankings, and token compaction.
- `MCP`: Model Context Protocol bridge and server integrations.
- `Apple-Silicon`: macOS MLX acceleration, hardware diagnostics, and metal optimizations.

---

## 5. Coding & Testing Standards

- **TypeScript**: Strict mode enabled across all packages. Avoid `any` where possible.
- **Style**: No hardcoded ANSI escape sequences in components — always consume colors from `ThemeManager`.
- **Imports**: Use explicit `.js` extensions for relative TypeScript imports (`import { x } from './foo.js';`) per Node ESM standards.
- **Tests**: Write Vitest unit tests for every new function or class. Maintain 100% pass rates before submitting PRs.
