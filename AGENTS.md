# AGENTS.md — Antigravity Engineering Boundaries & Invariants

This file defines the foundational development and architecture rules for Berkelium CLI. Every AI coding agent, human contributor, and Antigravity system MUST follow these invariants without exception.

---

## 1. Core Architectural Invariants

1. **Provider Neutrality**: Berkelium is a provider-neutral terminal agent. Never bypass `Provider` interfaces. Never put provider-specific logic, endpoints, or error formatting inside `AgentRuntime`.
2. **Event-Driven Decoupling**: All UI updates and telemetry MUST originate from `AgentEvents` dispatched via the `EventBus`. Never couple TUI rendering directly to model APIs or tools.
3. **No Direct UI Execution**: Never execute shell commands or file mutations directly from UI code. All operations must pass through `ToolOrchestrator` and `PermissionEngine`.
4. **Credential Isolation**: Never access credentials directly from tools. Authentication details are resolved strictly by `@berkelium/auth` and injected into Provider adapters. Never pass raw credentials into model prompt context.
5. **Mandatory Schema & Normalization**:
   - All tools must register their input schema and metadata through `ToolRegistry`.
   - All provider responses and stream chunks MUST pass through `ResponseNormalizer`.
6. **Explicit Security Policies**:
   - All filesystem, process, shell, and network mutations must pass through `PermissionEngine`.
   - Tool outputs and model inputs must pass through `SecretDetector` and `SecretRedactor`.
7. **Customization & Externalization**:
   - Never hard-code themes or ANSI colors into components. Always consume tokens from `@berkelium/themes`.
   - Never hard-code the system prompt. System prompt layers must be resolved through `@berkelium/config` from configuration and markdown templates.
8. **Configuration Precedence**:
   Always obey the hierarchy: Defaults → Global Config → Machine Config → Project Config → Directory Config → Session Config → CLI Flags.
9. **Bounded Execution & Safety**:
   Never create unbounded autonomous loops. Enforce `max_iterations` (default 40) and `max_tool_retries` (default 3).
10. **Apple Silicon First**:
    Ensure zero unnecessary background daemons, minimal startup latency (<150ms), and lean memory usage (<100MB idle).
11. **Quality Gates**:
    All new features require unit/integration tests and type validation.

---

## 2. Directory Responsibilities

- `apps/cli`: CLI entrypoint, command parsing, terminal UI, interactive loop, keybindings, startup animation.
- `packages/agent`: Agent runtime state machine, autonomous loop, planner, verifier, subagent orchestrator, session persistence.
- `packages/providers`: Universal provider interface and adapters for NVIDIA, OpenRouter, Ollama, LM Studio, plus response normalization and routing.
- `packages/tools`: Tool registry, orchestrator, execution pipeline, sandboxed native tools (filesystem, shell, git, search, diagnostics, MCP).
- `packages/context`: Tokenizer, repository map, dependency graph, smart file ranker, token budgeting, lossless compaction.
- `packages/permissions`: Policy evaluator, risk classification, confirmation workflow, permission manager.
- `packages/auth`: macOS Keychain integration, encrypted vault fallback, environment variable authentication.
- `packages/config`: Multi-tier configuration loader, schema validation, prompt layer composer.
- `packages/themes`: Core color palettes, dynamic theme loader, YAML theme parser.
- `packages/plugins`: Plugin loader, lifecycle hooks (`before_tool`, `after_tool`, `before_model`, `after_model`, etc.).
- `packages/events`: Strongly-typed `AgentEvent` definitions and asynchronous `EventBus`.
- `packages/logging`: Structured JSON logger and human-readable audit trail.
- `packages/telemetry`: Latency tracking, token usage accumulator, and system metrics.
- `benchmarks`: Standardized ToolBench, startup latency, TTFT, token throughput, and macOS footprint benchmarks.
