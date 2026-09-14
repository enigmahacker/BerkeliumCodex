# Berkelium Codex — Developer Architecture Guide

**Product**: Berkelium Codex // Neural Coding Runtime  
**Tagline**: *Proudly Indian. Built for the World.*  
**Monorepo Structure**: TypeScript ESM with pnpm workspaces  

---

## 1. Monorepo Organization

```
BerkeliumCodex/
├── apps/
│   └── cli/                # Terminal UI, command palette, interactive REPL loop, animations
├── packages/
│   ├── agent/              # State machine, autonomous loop, planner, verifier, subagents, missions, failure recovery
│   ├── auth/               # macOS Keychain & AES-256-GCM vault isolation
│   ├── config/             # Multi-tier configuration loader, Zod schemas, prompt composer
│   ├── context/            # AST symbol mapper, dependency graph, context compaction, tokenizer
│   ├── events/             # Strongly typed AgentEvents and asynchronous EventBus
│   ├── logging/            # Structured JSON logger and human-readable audit trail
│   ├── permissions/        # Capability policy evaluator, workspace jail, secret redactor
│   ├── plugins/            # Plugin lifecycle hooks (before/after tool, before/after model)
│   ├── providers/          # Universal Provider interface & adapters (Gemini, Groq, OpenRouter, NVIDIA, HF, Ollama, LMStudio)
│   ├── runtime/            # Apple Silicon hardware discovery, MLX/GGUF local model manager
│   ├── telemetry/          # Token counters, TTFT latency tracking, memory accounting
│   ├── themes/             # Terminal ANSI themes, 24-bit color palettes
│   └── tools/              # Tool registry, orchestrator, execution pipeline, native tools & MCP bridge
├── tests/                  # Unit, integration, security, and golden test suites
├── benchmarks/             # Startup latency, ToolBench accuracy, memory RSS benchmarks
└── docs/                   # Developer, security, and extension guides
```

---

## 2. The Core Agent Kernel

The central architectural tenet of Berkelium is:

> **The model is replaceable. The agent harness is the product.**

```
                     ┌───────────────────────┐
                     │   User Terminal/TUI   │
                     └──────────┬────────────┘
                                │ AgentEvents
                     ┌──────────▼────────────┐
                     │     EventBus          │
                     └──────────┬────────────┘
                                │
                     ┌──────────▼────────────┐
                     │     AgentRuntime      │
                     │  (Deterministic FSM)  │
                     └────┬─────────────┬────┘
                          │             │
              ┌───────────▼───┐     ┌───▼───────────┐
              │ ContextEngine │     │   Verifier    │
              │ (Repo/Tokens) │     │ (Build/Tests) │
              └───────────────┘     └───┬───────────┘
                                        │
                     ┌──────────────────▼────┐
                     │    ToolOrchestrator   │
                     ├───────────────────────┤
                     │   PermissionEngine    │
                     │   (3-Tier Policy)     │
                     ├───────────────────────┤
                     │    SecretRedactor     │
                     │ (Credential Scrubbing)│
                     └──────────┬────────────┘
                                │
                     ┌──────────▼────────────┐
                     │    ProviderRouter     │
                     ├───────────────────────┤
                     │ Local (MLX/GGUF) or   │
                     │ Cloud (Gemini/Groq)   │
                     └───────────────────────┘
```

---

## 3. The 12-State Deterministic State Machine

Transitions are verified against `VALID_TRANSITIONS` in `packages/agent/src/state-machine.ts`. Any non-permitted transition throws `InvalidStateTransitionError`:

1. `IDLE`: Awaiting user input or command.
2. `THINKING`: Processing user intent and initializing context.
3. `PLANNING`: Constructing step-by-step goal decomposition.
4. `WAITING_FOR_MODEL`: Streaming completion or tool calls from the active provider.
5. `WAITING_FOR_PERMISSION`: Pausing for user confirmation on medium/high-risk actions.
6. `EXECUTING_TOOL`: Running authorized tool executions in the orchestrator pipeline.
7. `COMPACTING_CONTEXT`: Condensing conversation history when approaching token limits.
8. `RUNNING_SUBAGENT`: Delegating specialized tasks to child subagents (Explorer, Tester, etc.).
9. `VERIFYING`: Validating changes against build, test, lint, and diff criteria.
10. `COMPLETED`: Successfully finalized autonomous task.
11. `FAILED`: Unrecoverable failure or exceeded retry limits.
12. `CANCELLED`: Interrupted via user `Ctrl+C`.

---

## 4. Failure Recovery Workflow

When an operation or verification check fails:

```
CLASSIFY → DIAGNOSE → MINIMAL FIX → RETRY → VERIFY
```

The `FailureClassifier` deterministically categorizes failures into:
- `syntax`
- `type`
- `dependency`
- `environment`
- `permission`
- `network`
- `model`
- `tool`
- `test`
- `logic`

Observations are stored in the `FailureLedger` and formatted into avoidance instructions injected into the system prompt to prevent repetitive looping on known-bad paths.

---

## 5. Running and Validating Locally

```bash
# Clean install
pnpm install

# Typecheck
pnpm run typecheck

# Test suite (unit, integration, security)
pnpm test

# Build all packages
pnpm run build

# Performance benchmarks
pnpm run bench

# Run interactive CLI
pnpm bk
```
