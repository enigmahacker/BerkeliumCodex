# 🌌 Berkelium CLI (Bk)

```
             97               ╭───●───╮              (247)
                            ╭─╯       ╰─╮
             ██████╗      ██╗  ██╗      │
             ██╔══██╗     ██║ ██╔╝      │
             ██████╔╝     █████╔╝       │
             ██╔══██╗     ██╔═██╗       │
             ██████╔╝  ●  ██║  ██╗     ╭─╯
             ╚═════╝      ╚═╝  ╚═╝   ╰───╯

              PROUDLY INDIAN. BUILT FOR THE WORLD.
                          ─────────────
             BERKELIUM CODEX // NEURAL CODING RUNTIME
```

> **Ultra-Customizable, Local-First Terminal AI Coding Agent & Autonomous Workstation**  
> *Engineered for Apple Silicon & modern development environments.*

[![Tests](https://img.shields.io/badge/tests-58%2F58%20passing-brightgreen.svg)](#-verification--benchmarks)
[![Startup Latency](https://img.shields.io/badge/startup%20latency-21ms%20%28budget%20%3C150ms%29-blue.svg)](#-performance-benchmarks)
[![Memory Footprint](https://img.shields.io/badge/memory-74MB%20%28budget%20%3C100MB%29-blueviolet.svg)](#-performance-benchmarks)
[![Token Speed](https://img.shields.io/badge/tokenizer-49.9M%20tok%2Fs-orange.svg)](#-performance-benchmarks)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-informational.svg)](#-installation--developer-guide)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#-license)

---

## 📑 Table of Contents

- [⚡ Overview & Philosophy](#-overview--philosophy)
- [🏛 Core Architectural Invariants](#-core-architectural-invariants)
- [📦 Monorepo Package Breakdown](#-monorepo-package-breakdown)
- [🔍 Interactive Command Palette & Autocomplete](#-interactive-command-palette--autocomplete)
- [🤖 Universal Model Runtime & Multi-Provider Architecture](#-universal-model-runtime--multi-provider-architecture)
- [⚙️ 12-State Agent Runtime & Autonomous Execution Loop](#️-12-state-agent-runtime--autonomous-execution-loop)
- [👥 Subagent Multi-Agent Persona System](#-subagent-multi-agent-persona-system)
- [🧠 Lossless Context Engine & AST Compaction](#-lossless-context-engine--ast-compaction)
- [🛠 20+ Sandboxed Native Tools & MCP Bridge](#-20-sandboxed-native-tools--mcp-bridge)
- [🔒 Enterprise Security, Permissions & Credential Isolation](#-enterprise-security-permissions--credential-isolation)
- [📜 7-Tier Configuration Precedence & Layered System Prompts](#-7-tier-configuration-precedence--layered-system-prompts)
- [🎨 Theming Engine & Live Matrix Rain Animation](#-theming-engine--live-matrix-rain-animation)
- [🔌 Plugin Architecture & Lifecycle Hooks](#-plugin-architecture--lifecycle-hooks)
- [📈 Telemetry, Metrics & Audit Logging](#-telemetry-metrics--audit-logging)
- [💻 CLI Commands & Interactive Slash Command Reference](#-cli-commands--interactive-slash-command-reference)
- [📊 Verification & Performance Benchmarks](#-verification--performance-benchmarks)
- [🚀 Installation & Developer Quickstart](#-installation--developer-quickstart)
- [📄 License & Trademark](#-license--trademark)

---

## ⚡ Overview & Philosophy

**Berkelium CLI (Bk)** is an ultra-fast, local-first terminal AI coding agent engineered from first principles to provide the seamless, fluid developer experience of Claude Code while remaining strictly **provider-neutral**, **privacy-first**, and **deeply customizable**.

### Foundational Principles

1. **Provider Independence**: Seamlessly switch between top-tier cloud APIs (**OpenRouter**, **NVIDIA NIM**, **OpenAI**, **Anthropic**) and zero-latency local models (**Ollama**, **LM Studio**) without changing your workflow.
2. **Instantaneous Terminal UX**: Real-time raw-mode TTY keypress processing, 4-tier fuzzy slash command autocomplete (`/`), and non-executing <kbd>Tab</kbd> expansions with sub-millisecond responsiveness.
3. **Deterministic Self-Healing Runtime**: A 12-state finite state machine with automated verification pipelines (`CHANGE -> BUILD -> TEST -> LINT -> DIFF REVIEW -> VERIFY`).
4. **Hardware-Accelerated Apple Silicon Optimization**: Cold startup under **21ms** (budget <150ms), idle memory under **74MB** (budget <100MB), and BPE tokenization over **49 million tokens/second**.
5. **Zero-Leak Security**: macOS Keychain credential isolation, AES-256 encrypted vault fallback, AST workspace jail security, and automatic secret redaction for API keys, private keys, and JWTs.

---

## 🏛 Core Architectural Invariants

Every subsystem in Berkelium complies with the architectural boundaries defined in `AGENTS.md`:

```
                           BERKELIUM CLI INTERACTIVE TUI
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
               CommandPalette / InputSM            TUIRenderer
                         │                               ▲
                         ▼                               │
                  CommandRegistry                  EventBus (AgentEvents)
                         │                               ▲
                         ▼                               │
                  CommandExecutor                  AgentRuntime
                         │                 (12-State Autonomous FSM)
                         │                               │
                         └───────────────┬───────────────┘
                                         │
             ┌───────────────────────────┼───────────────────────────┐
             ▼                           ▼                           ▼
       ContextEngine            ToolOrchestrator             ProviderRouter
       (RepoMap, Tokens,       (Permissions, Redactor,       (NVIDIA, OpenRouter,
       Compaction)             20+ Native Tools, MCP)        Ollama, LM Studio)
                                         │                           │
                                         ▼                           ▼
                                  PermissionEngine           ResponseNormalizer
```

### Invariants Matrix

| Principle | Invariant Rule | Implementation |
| :--- | :--- | :--- |
| **Provider Neutrality** | Never couple `AgentRuntime` to proprietary provider formats or endpoints. | `packages/providers` + `ResponseNormalizer` |
| **Event-Driven Decoupling** | All TUI renders & telemetry must originate from typed `AgentEvents`. | `packages/events` (`EventBus`) |
| **No Direct UI Execution** | Never execute shell commands or file writes directly from UI code. | `ToolOrchestrator` + `PermissionEngine` |
| **Credential Isolation** | API keys must never touch prompt contexts, logs, or unencrypted storage. | `@berkelium/auth` (macOS Keychain / AES-256) |
| **Mandatory Schemas** | Tools must register strict Zod schemas; provider chunks must normalize. | `ToolRegistry` + `ResponseNormalizer` |
| **Bounded Execution** | Autonomous loops must enforce iteration bounds and tool retry limits. | `max_iterations: 40`, `max_tool_retries: 3` |
| **Zero Hardcoded Themes** | ANSI styling must consume dynamic semantic design tokens. | `@berkelium/themes` (`ThemeManager`) |

---

## 📦 Monorepo Package Breakdown

Berkelium is structured as a high-cohesion, low-coupling **pnpm monorepo** across 13 packages and 1 application:

```
berkelium/
├── apps/
│   └── cli/                  # CLI runner, Command Palette, TUI state machine, Bk matrix animation
├── packages/
│   ├── agent/                # 12-state AgentRuntime, Planner, Verifier, Subagents, Session persistence
│   ├── auth/                 # macOS Keychain integration, AES-256 vault fallback, auto-key detection
│   ├── config/               # 7-tier config hierarchy, schema validation, layered system prompt composer
│   ├── context/              # BPE Tokenizer, AST RepoMap, dependency graph, smart file ranker, compactor
│   ├── events/               # Typed AgentEvent definitions and asynchronous EventBus
│   ├── logging/              # Structured JSON logging and human-readable audit trail
│   ├── permissions/          # 3-tier policy engine (ALLOW/ASK/DENY), workspace jail, SecretRedactor
│   ├── plugins/              # Plugin loader, manifest validator, lifecycle hook dispatcher
│   ├── providers/            # Universal ProviderRouter, adapters (NVIDIA, OpenRouter, Ollama, LM Studio)
│   ├── telemetry/            # Latency tracking, TTFT accumulator, token throughput, memory profiler
│   ├── themes/               # 8 built-in color themes, ANSI tokenization, YAML theme loader
│   └── tools/                # ToolRegistry, ToolOrchestrator, 20+ sandboxed native tools, MCP Bridge
├── benchmarks/               # ToolBench accuracy, startup latency, token throughput, memory RSS
└── tests/                    # 18 unit, integration, golden workflow, and regression test suites
```

### Monorepo Packages Summary

| Package | Path | Direct Dependencies | Responsibility |
| :--- | :--- | :--- | :--- |
| **`@berkelium/cli`** | `apps/cli` | `agent`, `config`, `themes`, `logging`, `events`, `auth`, `providers`, `tools` | Interactive TUI, raw mode input FSM, command palette, startup logo, Matrix rain. |
| **`@berkelium/agent`** | `packages/agent` | `providers`, `tools`, `context`, `config`, `logging`, `events`, `telemetry`, `plugins` | 12-state autonomous execution loop, Planner, Verifier, Subagent personas, session state. |
| **`@berkelium/providers`** | `packages/providers` | `logging`, `events`, `telemetry` | Unified provider interface, adapters for OpenRouter, NVIDIA, Ollama, LM Studio, OpenAI, Anthropic. |
| **`@berkelium/tools`** | `packages/tools` | `permissions`, `logging`, `events`, `config` | Tool registry, execution sandboxing, 20+ native filesystem/shell/git/diagnostic tools, MCP bridge. |
| **`@berkelium/context`** | `packages/context` | `logging`, `events` | BPE tokenizer, AST symbol indexing, RepoMap generation, heuristic ranking, lossless compaction. |
| **`@berkelium/permissions`**| `packages/permissions`| `logging`, `events` | Security policy evaluator, risk tier classification, confirmation workflow, secret redactor. |
| **`@berkelium/config`** | `packages/config` | `logging` | 7-tier config loader, Zod schema validation, 7-layer system prompt composer. |
| **`@berkelium/auth`** | `packages/auth` | `logging`, `events` | macOS Keychain CLI interop, AES-256 encrypted file vault, auto-key detection. |
| **`@berkelium/themes`** | `packages/themes` | *(zero deps)* | 8 built-in themes (`berkelium-dark`, `matrix`, `dracula`, `nord`, etc.), ANSI tokenization. |
| **`@berkelium/plugins`** | `packages/plugins` | `logging`, `events` | Plugin discovery, lifecycle hooks (`before_tool`, `after_tool`, `before_model`, `after_model`). |
| **`@berkelium/events`** | `packages/events` | *(zero deps)* | Strongly-typed event contracts, asynchronous publish-subscribe `EventBus`. |
| **`@berkelium/telemetry`** | `packages/telemetry` | `events` | TTFT metrics, token throughput accumulator, execution latency profiler, memory footprint tracking. |
| **`@berkelium/logging`** | `packages/logging` | *(zero deps)* | Structured JSON logger (`.berkelium/logs/audit.jsonl`) and human-readable audit trail. |

---

## 🔍 Interactive Command Palette & Autocomplete

Berkelium features an instantaneous, Claude Code-style interactive command palette that triggers character-by-character directly in TTY raw mode:

```
berkelium > /m

╭─ COMMANDS: "/m" ───────────────────────────────────────────────────╮
│  › /model       Change active model target or alias                │
│    /models      List discovered local and cloud models             │
│    /matrix      Trigger live Matrix neural digital rain stream     │
│  (1/3)                                                             │
├────────────────────────────────────────────────────────────────────┤
│  Usage: /model <model_name>                                        │
╰────────────────────────────────────────────────────────────────────╯
  ↑↓ Navigate • Tab Complete • Enter Select • Esc Close
```

### Autocomplete State Machine

```
              ┌───────────────────────────┐
              │          NORMAL           │ (Regular chat prompt)
              └─────────────┬─────────────┘
                            │ Type '/'
                            ▼
              ┌───────────────────────────┐
              │       SLASH_COMMAND       │ (Fuzzy command matching)
              └─────────────┬─────────────┘
                            │ Space / Tab with argument
                            ▼
              ┌───────────────────────────┐
              │      SLASH_ARGUMENT       │ (Dynamic option resolution)
              └───────────────────────────┘
```

### Key Capabilities

- **Trigger Safety**: Only a leading `/` (or with leading whitespace `   /`) triggers command mode. Sentences containing slashes (e.g. `explain /etc/hosts`, `search for /src/auth`) are preserved as regular text.
- **4-Tier Fuzzy Ranking**:
  1. **Exact Match** (Score 1000)
  2. **Prefix Match** (Score 800)
  3. **Word-Boundary Match** (Score 650)
  4. **Subsequence Match** (Score 400 - distance)
- **Character Highlight Indexing**: Matched characters are highlighted in real-time in the terminal suggestion box.
- **Non-Executing Tab Completion**: Pressing <kbd>Tab</kbd> places `/model ` into the input buffer without executing it prematurely.
- **Dynamic Argument Expansion**:
  - `/model ` → Live catalog of aliases (`coding`, `local`, `fast`, `reasoning`) and discovered Ollama / LM Studio / OpenRouter models.
  - `/provider ` → Supported providers (`openrouter`, `nvidia`, `ollama`, `lmstudio`, `openai`, `anthropic`).
  - `/theme ` → Live installed color themes (`berkelium-dark`, `matrix`, `dracula`, `nord`, etc.).
  - `/tools ` → Registered tool schemas.
  - `/agents ` → Specialized subagents (`explorer`, `coder`, `tester`, `reviewer`).
  - `/system ` → Prompt layer targets (`identity`, `behavior`, `coding`, `safety`, `tools`, `workspace`, `custom`).
- **Custom Markdown Workflows**: Place any markdown file in `.berkelium/commands/<name>.md` to register persistent project-specific slash commands automatically.

### Keystroke Navigation Matrix

| Keystroke | State: `SLASH_COMMAND` | State: `SLASH_ARGUMENT` |
| :--- | :--- | :--- |
| <kbd>↑</kbd> / <kbd>Ctrl+P</kbd> | Move selection up | Move argument selection up |
| <kbd>↓</kbd> / <kbd>Ctrl+N</kbd> | Move selection down | Move argument selection down |
| <kbd>Home</kbd> / <kbd>End</kbd> | Jump to first / last suggestion | Jump to first / last option |
| <kbd>Tab</kbd> | Fill command into prompt (non-executing) | Fill argument into prompt (non-executing) |
| <kbd>Enter</kbd> | Execute if 0 args required, else populate | Execute command with selected argument |
| <kbd>Esc</kbd> | Dismiss suggestion palette | Dismiss argument palette |
| <kbd>Backspace</kbd> | Delete character / exit palette if empty | Delete character / return to command state |

---

## 🤖 Universal Model Runtime & Multi-Provider Architecture

Berkelium interfaces with local and cloud model backends through a unified, high-throughput `ProviderRouter`:

```bash
# Switch active model target on the fly
/model coding               # Configured primary alias
/model ollama/qwen2.5:14b   # Zero-latency local Ollama model
/model lmstudio/deepseek    # Local LM Studio workstation model
/model nvidia/llama-3.3-70b # High-throughput NVIDIA NIM model
/model openrouter/deepseek  # OpenRouter universal gateway
```

### Model Aliases & Default Routing

Configure smart aliases in your `.berkelium/config.json`:

```json
{
  "default_model": "coding",
  "routing": {
    "primary": "openrouter/coding",
    "fallback": ["nvidia/coding", "ollama/local", "lmstudio/workstation"]
  },
  "models": {
    "coding": {
      "provider": "openrouter",
      "model": "deepseek/deepseek-chat",
      "context_length": 65536,
      "max_tokens": 2048
    },
    "reasoning": {
      "provider": "openrouter",
      "model": "deepseek/deepseek-r1",
      "context_length": 163840
    },
    "local": {
      "provider": "ollama",
      "model": "qwen2.5:14b-instruct-q4_K_M",
      "context_length": 32768
    },
    "fast": {
      "provider": "openrouter",
      "model": "google/gemini-2.0-flash-001",
      "context_length": 1048576
    }
  }
}
```

### Auto-Pasted API Key Detection

Paste raw API keys directly into the interactive prompt for instant zero-configuration registration:
- `sk-or-v1-...` → Stored automatically for **OpenRouter** in macOS Keychain.
- `nvapi-...` → Stored automatically for **NVIDIA NIM** in macOS Keychain.
- `sk-ant-...` → Stored automatically for **Anthropic** in macOS Keychain.
- `sk-proj-...` / `sk-...` → Stored automatically for **OpenAI** in macOS Keychain.

---

## ⚙️ 12-State Agent Runtime & Autonomous Execution Loop

The Berkelium core runtime operates as a deterministic, resilient finite state machine:

```
 ┌─────────┐     User Input      ┌────────────┐
 │  IDLE   │ ──────────────────> │  THINKING  │
 └─────────┘                     └─────┬──────┘
      ▲                                │
      │                                ▼
      │                          ┌────────────┐
      │ Task Done / Cancelled    │  PLANNING  │
      │                          └─────┬──────┘
      │                                │
      │                                ▼
      │                  ┌───────────────────────────┐
      │                  │  WAITING_FOR_PERMISSION   │
      │                  └─────────────┬─────────────┘
      │                                │ Approved
      │                                ▼
      │                  ┌───────────────────────────┐
      │                  │      EXECUTING_TOOL       │
      │                  └─────────────┬─────────────┘
      │                                │
      │                                ▼
      │                  ┌───────────────────────────┐
      │                  │         VERIFYING         │
      │                  │ (Build -> Test -> Lint)   │
      │                  └─────────────┬─────────────┘
      │                                │
      │       ┌────────────────────────┴────────────────────────┐
      │       ▼                                                 ▼
┌───────────┐   ┌────────┐                                ┌──────────┐
│ COMPLETED │   │ FAILED │                                │ CANCELLED│
└───────────┘   └────────┘                                └──────────┘
```

### The 12 Runtime States

| State | Description | Event Triggered |
| :--- | :--- | :--- |
| `IDLE` | Waiting for user command or task in interactive prompt. | `session_idle` |
| `THINKING` | Inspecting context, evaluating prompt, formulating reasoning. | `thinking_started` |
| `PLANNING` | Generating structured multi-step task execution plan. | `plan_generated` |
| `WAITING_FOR_PERMISSION` | Awaiting user confirmation for high-risk operations. | `permission_requested` |
| `EXECUTING_TOOL` | Running sandboxed native tool or MCP call. | `tool_started` |
| `WAITING_FOR_MODEL` | Awaiting streaming response chunk from provider adapter. | `model_stream_chunk` |
| `COMPACTING_CONTEXT` | Losslessly pruning conversation history & token budget. | `compaction_completed` |
| `RUNNING_SUBAGENT` | Delegating isolated sub-task to specialized subagent. | `subagent_spawned` |
| `VERIFYING` | Running automated build, test, lint, and diff validation. | `verification_step` |
| `COMPLETED` | Task successfully accomplished and verified. | `task_completed` |
| `FAILED` | Unrecoverable error encountered after retries. | `task_failed` |
| `CANCELLED` | Aborted by user via <kbd>Ctrl+C</kbd> or `/reset`. | `task_cancelled` |

### Self-Healing Verification Pipeline

When modifications are made to your codebase, Berkelium's `Verifier` automatically runs a continuous quality gate:

1. **CHANGE**: Surgical multi-file edits applied via `edit_file` / `write_file`.
2. **BUILD**: Runs project compiler (`npm run build`, `pnpm build`, `tsc`, `cargo build`).
3. **TEST**: Runs targeted unit and regression test suites.
4. **LINT**: Validates formatting and static analysis rules.
5. **DIFF REVIEW**: Performs automated semantic diff audit against architectural boundaries.
6. **HEAL**: If build, test, or lint fails, the error output is piped back to the `Planner` for automated correction without manual developer intervention.

---

## 👥 Subagent Multi-Agent Persona System

Complex architectural tasks are decomposed across specialized subagent personas:

```
                            SUBAGENT ORCHESTRATOR
                                      │
        ┌──────────────┬──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼              ▼
    EXPLORER         CODER          TESTER        REVIEWER       CUSTOM
  (RepoMap AST,   (Surgical      (Test Runner,  (Diff Audit,   (Project
   Symbols)       Mutations)     Regressions)   Security)      Defined)
```

1. **Explorer**: Read-only codebase traversal. Extracts AST symbol definitions, traces dependency trees, and identifies relevant modules without modifying files.
2. **Coder**: High-precision code generation and surgical diff editing. Enforces language-specific typing and strict architectural modularity.
3. **Tester**: Executes test runners (`vitest`, `jest`, `pytest`, `cargo test`), parses failure stack traces, and pinpoints breaking regressions.
4. **Reviewer**: Audits git working tree diffs, checks security invariants, detects credential leaks, and verifies AGENTS.md rule compliance.

Inspect subagents live via `/agents` or delegate tasks directly:
```bash
/agents coder "Implement JWT token validation in auth service"
```

---

## 🧠 Lossless Context Engine & AST Compaction

Berkelium maintains ultra-lean token usage without losing critical architectural references through its tokenizer-aware context engine:

```
Input Tokens: 4,000  ───►  Lossless Compactor  ───►  Output Tokens: 1,852 (-54%)
```

### Context Pipeline Components

1. **BPE Tokenizer**: Blazing-fast token counter operating at **49.9 million tokens/second**.
2. **RepoMap Generator**: Dynamic AST symbol graph containing exported interfaces, classes, functions, and module dependency relationships.
3. **Smart File Ranker**: Heuristic ranking based on recency, working tree git status, import proximity, and keyword relevance.
4. **Lossless Compaction**: Replaces voluminous intermediate tool outputs with structural summaries while strictly preserving active file diffs and unresolved compiler errors.

Inspect your live context budget:
```bash
/context
/compact
```

---

## 🛠 20+ Sandboxed Native Tools & MCP Bridge

Berkelium provides a comprehensive suite of built-in native tools operating under strict permission policies:

| Category | Tool | Parameters | Description | Policy Default |
| :--- | :--- | :--- | :--- | :--- |
| **Filesystem** | `read_file` | `path`, `offset?`, `length?` | Read file contents with range support | `ALLOW` |
| | `write_file` | `path`, `content`, `overwrite?` | Write new file to workspace | `ALLOW` |
| | `edit_file` | `path`, `target`, `replacement` | Surgical text replacement in file | `ALLOW` |
| | `delete_file` | `path` | Delete workspace file | `PROMPT` |
| | `list_directory` | `path`, `recursive?` | List directory tree structure | `ALLOW` |
| | `search_files` | `pattern`, `directory?` | Find files matching glob pattern | `ALLOW` |
| | `search_text` | `query`, `path?`, `regex?` | Fast semantic grep across files | `ALLOW` |
| **Shell & Process** | `run_shell` | `command`, `timeout_ms?` | Execute safe terminal command | `ALLOW (safe) / PROMPT (destr)` |
| | `run_process` | `command`, `args`, `cwd?` | Run detached or background process | `PROMPT` |
| **Git Intelligence** | `git_status` | *(none)* | Inspect working tree git status | `ALLOW` |
| | `git_diff` | `path?`, `cached?` | View git unified diff | `ALLOW` |
| | `git_log` | `count?` | View recent git commits | `ALLOW` |
| | `git_branch` | *(none)* | List local & remote git branches | `ALLOW` |
| | `git_commit` | `message` | Create staged git commit | `ALLOW` |
| **Diagnostics** | `inspect_project`| *(none)* | Detect package managers, configs & stack | `ALLOW` |
| | `diagnostics` | `path?` | Run project diagnostics & typechecks | `ALLOW` |
| | `test` | `filter?` | Run project unit test suites | `ALLOW` |
| | `lint` | `fix?` | Run linters and formatting tools | `ALLOW` |
| | `build` | *(none)* | Run project build pipeline | `ALLOW` |
| **Web & Network** | `fetch_url` | `url`, `method?`, `headers?` | Fetch HTTP resource content | `PROMPT` |
| | `web_search` | `query` | Query web search engines | `PROMPT` |
| **MCP Bridge** | `mcp-bridge` | Dynamic MCP schema | Connect external Model Context Protocol servers | `PROMPT` |

### Model Context Protocol (MCP) Integration

Connect external tools via standard MCP server definitions in `.berkelium/mcp.json` or `~/.berkelium/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "..." }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

---

## 🔒 Enterprise Security, Permissions & Credential Isolation

Berkelium enforces mandatory multi-tier security policies before performing any filesystem mutation, process invocation, or network communication:

```
╭──────────── BERKELIUM PERMISSIONS ─────────────╮
│                                                │
│ Filesystem                                     │
│ Read workspace                ALLOW            │
│ Write workspace               ALLOW            │
│ Delete workspace              PROMPT           │
│ Outside workspace             DENY             │
│                                                │
│ Shell                                          │
│ Safe commands (ls, git, cat)  ALLOW            │
│ Destructive commands (rm, mv) PROMPT           │
│ Privileged commands (sudo)    DENY             │
│                                                │
│ Network                                        │
│ HTTP requests                 PROMPT           │
╰────────────────────────────────────────────────╯
```

### Security Tiers

1. **`ALLOW`**: Executed autonomously without interrupting the developer.
2. **`PROMPT`**: Displays interactive confirmation modal detailing the exact command/diff before execution.
3. **`DENY`**: Hard-blocked by `PermissionEngine` (e.g., accessing files outside the workspace jail, executing `sudo` or `rm -rf /`).

### Automated Secret Redaction

The built-in `SecretRedactor` scans all model inputs, tool outputs, and telemetry streams in real-time, automatically masking:
- OpenAI / OpenRouter / Anthropic API keys (`sk-...`, `sk-or-v1-...`, `sk-ant-...`)
- NVIDIA NIM API keys (`nvapi-...`)
- AWS Access Keys & Secret Keys (`AKIA...`)
- GitHub Personal Access Tokens (`ghp_...`, `gho_...`)
- JSON Web Tokens (`eyJ...`)
- RSA / OpenSSH Private Keys (`-----BEGIN OPENSSH PRIVATE KEY-----`)

---

## 📜 7-Tier Configuration Precedence & Layered System Prompts

### Configuration Hierarchy

Berkelium resolves settings through a strict 7-tier precedence hierarchy:

```
  CLI Flags                (--model, --provider, --theme)
     ▲
  Session Config           (Live overrides set in active TUI session)
     ▲
  Directory Config         (./.berkelium/dir.json)
     ▲
  Project Config           (./berkelium.json or ./.berkelium/config.json)
     ▲
  Machine Config           (/etc/berkelium/config.json)
     ▲
  Global Config            (~/.berkelium/config.json)
     ▲
  Default Config           (Compiled package defaults)
```

### Composable 7-Layer System Prompt

The system prompt sent to models is dynamically composed from isolated layers:

```
┌────────────────────────────────────────────────────────────┐
│ 1. Identity Layer   (Persona, agent role, invariants)      │
│ 2. Behavior Layer   (Thinking mode, response guidelines)   │
│ 3. Coding Layer     (Code style, typing, architecture)     │
│ 4. Safety Layer     (Credential redaction, boundary rules) │
│ 5. Tools Layer      (Tool calling schema & discipline)     │
│ 6. Workspace Layer  (Dynamic RepoMap, active files tree)   │
│ 7. Custom Layer     (Project AGENTS.md / custom overrides) │
└────────────────────────────────────────────────────────────┘
```

Inspect and modify layers live from the terminal:
```bash
/system view
/system file                         # Opens macOS Finder pop-up selector to choose text file
/system file coding                  # Opens Finder selector and imports into 'coding' layer
/system file custom ./prompt.txt     # Loads directly from text/markdown file
/system set coding "Enforce strict TypeScript with zero any types and FP patterns"
/system reset coding
/system export ./composed-system-prompt.md
```

---

## 🎨 Theming Engine & Live Matrix Rain Animation

Switch terminal aesthetics instantly without restarting:

```bash
/theme berkelium-dark   # Electric cyan & deep obsidian (default)
/theme matrix           # Neon green cyberpunk hacker terminal
/theme dracula          # Classic vampire purple & vibrant pink
/theme nord             # Arctic ice blue & cool slate tones
/theme solarized-dark   # Warm teal & earthy dark palette
/theme cyberpunk        # Hot neon pink, electric yellow & cyan
/theme monokai          # Golden yellow, magenta & charcoal
/theme terminal         # Classic retro amber CRT phosphor
```

### Bk Matrix Digital Rain

Trigger the neural digital rain stream animation anytime via `/matrix`:

```bash
/matrix matrix          # Launch digital rain in matrix neon green
/matrix cyberpunk       # Launch digital rain in cyberpunk neon pink
```

Featuring the Element 97 emblem and the brand tagline:  
**`PROUDLY INDIAN. BUILT FOR THE WORLD.`**

---

## 🔌 Plugin Architecture & Lifecycle Hooks

Extend Berkelium with custom plugins placed in `.berkelium/plugins/<plugin-name>/`:

```
.berkelium/plugins/my-plugin/
├── plugin.json               # Plugin metadata & manifest
└── index.js                  # Lifecycle hook handlers
```

### Supported Lifecycle Hooks

- `before_tool`: Intercept, inspect, or modify tool arguments before execution.
- `after_tool`: Transform or validate tool execution results before model ingestion.
- `before_model`: Modify prompt payloads, add custom context layers, or reroute requests.
- `after_model`: Inspect streaming chunks or normalized responses.
- `on_state_change`: Listen for transitions across the 12 runtime states.

---

## 📈 Telemetry, Metrics & Audit Logging

Berkelium provides deep observability into latency, throughput, and operational security:

- **Time to First Token (TTFT)**: High-resolution profiler measuring streaming responsiveness.
- **Token Throughput**: Real-time tokens/second accumulator tracked across all provider streams.
- **Audit Logging**: Human-readable and structured JSON logs written to `.berkelium/logs/audit.jsonl`.
- **System Metrics**: Live memory footprint (RSS, Heap), active handles, and loop iteration counts.

Inspect runtime telemetry live:
```bash
/status
```

---

## 💻 CLI Commands & Interactive Slash Command Reference

### Global CLI Commands

```bash
bk                         # Launch interactive Berkelium TUI session
bk "Refactor auth tokens"  # One-shot headless autonomous execution
bk doctor                  # Run comprehensive environment & provider diagnostics
bk models                  # List all local & cloud models discovered
bk auth                    # Inspect Keychain & vault credential statuses
bk codex                   # Display the Berkelium Codex Emblem
```

### CLI Flags

| Flag | Short | Description | Example |
| :--- | :--- | :--- | :--- |
| `--model` | `-m` | Specify active model or alias | `bk -m reasoning` |
| `--provider` | `-p` | Specify active provider | `bk -p ollama` |
| `--theme` | `-t` | Set terminal UI color theme | `bk -t matrix` |
| `--cwd` | `-C` | Set working directory root | `bk -C /path/to/project` |
| `--max-iterations`| `-i` | Override max autonomous loops | `bk -i 50` |
| `--verbose` | `-v` | Enable verbose debugging logs | `bk -v` |
| `--version` | `-V` | Print Berkelium CLI version | `bk -V` |
| `--help` | `-h` | Display CLI help menu | `bk -h` |

### Complete Slash Command Reference

| Command | Aliases | Usage | Category | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`/help`** | `/?` | `/help [command]` | `GENERAL` | Display all commands or inspect detailed command usage |
| **`/clear`** | `/cls` | `/clear` | `GENERAL` | Clear terminal screen |
| **`/reset`** | *(none)* | `/reset` | `GENERAL` | Reset active conversation session context |
| **`/quit`** | `/exit`, `/q`| `/quit` | `GENERAL` | Exit Berkelium CLI |
| **`/model`** | `/m` | `/model <model_name>` | `MODEL` | Switch active model target or alias (with dynamic completion) |
| **`/models`**| *(none)* | `/models` | `MODEL` | List discovered local & cloud models across providers |
| **`/provider`**| `/p` | `/provider <name>` | `PROVIDERS` | Change active default provider target |
| **`/providers`**| *(none)*| `/providers` | `PROVIDERS` | List supported model providers and endpoints |
| **`/auth`** | *(none)* | `/auth [status\|login\|logout]` | `PROVIDERS` | Manage API keys in macOS Keychain / Encrypted Vault |
| **`/context`**| `/ctx` | `/context` | `CONTEXT` | Inspect token budget breakdown & context utilization |
| **`/compact`**| *(none)* | `/compact` | `CONTEXT` | Losslessly compact conversation history & token budget |
| **`/tools`** | `/t` | `/tools [tool_name]` | `TOOLS` | List all registered native tools & MCP server schemas |
| **`/agents`**| `/subagents`| `/agents [name]` | `AGENTS` | Inspect and manage specialized subagents |
| **`/config`**| `/cfg` | `/config` | `CONFIGURATION` | Inspect active 7-tier hierarchical configuration |
| **`/system`**| `/prompt`| `/system [view\|file\|set\|load\|reset]` | `CONFIGURATION` | Inspect, edit, or import layered system prompts from text files / Finder selector |
| **`/permissions`**| `/perms`| `/permissions` | `PERMISSIONS` | Inspect security, filesystem jail & shell policies |
| **`/theme`** | *(none)* | `/theme [theme_name]` | `THEMES` | Live-switch terminal color theme (8 built-in themes) |
| **`/matrix`**| *(none)* | `/matrix [theme]` | `THEMES` | Trigger live Matrix neural digital rain stream animation |
| **`/git`** | *(none)* | `/git` | `GIT` | Show working tree git status & branch info |
| **`/diff`** | *(none)* | `/diff` | `GIT` | Show current git working tree unified diff |
| **`/commit`**| *(none)* | `/commit [message]` | `GIT` | Create git commit with automated AI message |
| **`/session`**| *(none)* | `/session [list\|resume]` | `SESSION` | Manage persisted sessions and conversation states |
| **`/history`**| *(none)* | `/history` | `SESSION` | View session command, task, and message history |
| **`/test`** | *(none)* | `/test [filter]` | `DEVELOPMENT` | Run workspace unit test suite |
| **`/build`** | *(none)* | `/build` | `DEVELOPMENT` | Run workspace build pipeline scripts |
| **`/review`**| *(none)* | `/review` | `DEVELOPMENT` | Ask Berkelium to review current git working tree changes |
| **`/fix`** | *(none)* | `/fix [issue]` | `DEVELOPMENT` | Diagnose errors and apply automated self-healing fixes |
| **`/refactor`**| *(none)*| `/refactor [target]` | `DEVELOPMENT` | Refactor codebase architecture cleanly |
| **`/explain`**| *(none)* | `/explain [topic]` | `DEVELOPMENT` | Provide deep architectural walkthrough of codebase |
| **`/status`**| *(none)* | `/status` | `SYSTEM` | View runtime state machine & telemetry statistics |
| **`/doctor`**| *(none)* | `/doctor` | `SYSTEM` | Diagnose local environment, providers & tools |
| **`/version`**| `/v` | `/version` | `SYSTEM` | Show Berkelium CLI version and platform architecture |

---

## 📊 Verification & Performance Benchmarks

### Automated Test Suite (52/52 Passing)

```bash
$ pnpm test

 ✓ tests/unit/command-registry.test.ts (4 tests)
 ✓ tests/unit/command-matcher.test.ts (4 tests)
 ✓ tests/unit/themes.test.ts (3 tests)
 ✓ tests/unit/normalizer.test.ts (2 tests)
 ✓ tests/unit/config.test.ts (3 tests)
 ✓ tests/unit/redaction.test.ts (3 tests)
 ✓ tests/unit/tools.test.ts (3 tests)
 ✓ tests/unit/system-prompt.test.ts (3 tests)
 ✓ tests/unit/permissions.test.ts (3 tests)
 ✓ tests/unit/compaction.test.ts (2 tests)
 ✓ tests/golden/golden-workflow.test.ts (1 test)
 ✓ tests/unit/slash-detection-regression.test.ts (2 tests)
 ✓ tests/unit/dynamic-completion.test.ts (4 tests)
 ✓ tests/integration/agent-loop.test.ts (1 test)
 ✓ tests/unit/input-state-machine.test.ts (7 tests)
 ✓ tests/unit/slash-options.test.ts (2 tests)
 ✓ tests/unit/bk-matrix.test.ts (3 tests)
 ✓ tests/unit/auth-command.test.ts (2 tests)

 Test Files  18 passed (18)
      Tests  52 passed (52)
   Duration  624ms
```

### Performance Benchmarks

```bash
$ pnpm bench

╔════════════════════════════════════════════════════════════╗
║             BERKELIUM PERFORMANCE BENCHMARKS               ║
╚════════════════════════════════════════════════════════════╝

[1] Cold Startup Latency:      21 ms   (Budget: <150ms)           ✓ PASS
[2] ToolBench Schema Accuracy: 100.0%  (6/6 tools verified)       ✓ PASS
[3] Tokenizer Throughput:      0.28 ms (49,931,911 tokens/sec)    ✓ PASS
[4] Context Compaction:        0.34 ms (4000 -> 1852 tokens, -54%)✓ PASS
[5] Memory Footprint (RSS):    74.0 MB (Budget: <100MB)           ✓ PASS
```

---

## 🚀 Installation & Developer Quickstart

### Prerequisites

- **macOS** (Apple Silicon M1/M2/M3/M4 or Intel) or **Linux**
- **Node.js** >= `v20.0.0`
- **pnpm** >= `v9.0.0`

### Setup & Build

```bash
# 1. Clone the repository
git clone https://github.com/enigmahacker/berkelium.git
cd berkelium

# 2. Install monorepo dependencies
pnpm install

# 3. Build all packages
pnpm build

# 4. Run test suites
pnpm test

# 5. Run performance benchmarks
pnpm bench

# 6. Link `bk` globally to your system PATH
npm link --force

# 7. Launch Berkelium!
bk
```

### Setting Up Providers

```bash
# Option A: Paste your API key directly into the Berkelium interactive prompt
bk
berkelium > sk-or-v1-xxxxxxxxxxxxxxxxxxxx

# Option B: Use the /auth slash command
berkelium > /auth login openrouter

# Option C: Use standard environment variables
export OPENROUTER_API_KEY="sk-or-v1-..."
export NVIDIA_API_KEY="nvapi-..."
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 📄 License & Trademark

Distributed under the **MIT License**. See `LICENSE` for more information.

```
       PROUDLY INDIAN. BUILT FOR THE WORLD.
                   ─────────────
      BERKELIUM CODEX // NEURAL CODING RUNTIME
```
