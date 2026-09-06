# Berkelium CLI

> Your terminal. Your codebase. Your AI.

Berkelium CLI is a terminal-native AI development platform and coding agent. It integrates Ollama-style local model management, hardware-accelerated local runtimes, cloud AI providers, local repository intelligence, and policy-gated tool execution into a single command-line interface. Built from the ground up for software engineering, Berkelium provides an autonomous development loop that plans, edits, tests, and verifies code directly inside your terminal.

```
$ berkelium
Berkelium CLI
Model     qwen3-coder:30b
Runtime   MLX
Mode      LOCAL
Privacy   LOCAL
Status    ● READY
› Fix the authentication bug
Inspecting repository...
Found 3 failing tests.
Editing:
src/auth/session.ts
Running tests...
✓ 47 passed
```

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Local Models](#local-models)
- [Apple Silicon](#apple-silicon)
- [Cloud Models](#cloud-models)
- [Local / Cloud / Hybrid](#local--cloud--hybrid)
- [Agentic Development](#agentic-development)
- [Repository Intelligence](#repository-intelligence)
- [Tools](#tools)
- [Security](#security)
- [Privacy](#privacy)
- [Accessibility](#accessibility)
- [Sessions](#sessions)
- [Slash Commands](#slash-commands)
- [Diagnostics](#diagnostics)
- [Command Reference](#command-reference)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [Security Reporting](#security-reporting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Berkelium puts model management, AI inference, and agentic software development directly in the terminal. Instead of wrapping web views or relying on external cloud daemons, Berkelium executes as a lean, provider-neutral command-line process that communicates directly with local inference engines and remote model APIs.

The system strictly decouples architectural concerns across seven core layers:

```
┌────────────────────────────────────────────────────────┐
│                      BERKELIUM CLI                     │
├───────────────┬────────────────────────┬───────────────┤
│     AGENT     │    ROUTER & RUNTIME    │   SECURITY    │
│  State Loop   │   Unified Target ID    │ Policy Engine │
│  Planner      │   MLX Engine           │ Jail Sandbox  │
│  Verifier     │   GGUF Engine          │ Secret Redact │
│  Memory       │   Cloud Providers      │ Privacy Tier  │
└───────────────┴────────────────────────┴───────────────┘
```

- **Model**: Format-agnostic weights and parameter definitions (MLX, GGUF, or remote API endpoints).
- **Runtime**: Local execution engines executing on your machine (Apple MLX, llama.cpp server, CPU).
- **Provider**: External cloud model gateways (Google Gemini, OpenAI, Anthropic, Groq, NVIDIA NIM, Hugging Face).
- **Router**: Capability-aware resolver mapping target identifiers (`local/<model>`, `cloud/<provider>/<model>`) to the appropriate engine.
- **Agent**: State machine orchestrating codebase inspection, step-by-step planning, tool invocation, and test verification.
- **Tools**: Sandboxed filesystem, shell, git, search, and build utilities operating under explicit access control.
- **Security**: Permission engine enforcing policy boundaries, destructive command gates, and secret redaction.

---

## Features

Berkelium presents its capabilities as concrete, terminal-first CLI workflows:

### Local Runtime

Manage, inspect, and execute local models without external servers:

- `berkelium list` — List downloaded local models with size, runtime, and context window metrics.
- `berkelium pull <model>` — Download and verify model weights from Hugging Face or model registries.
- `berkelium run <model>` — Run inference or a coding task headlessly against a specified model.
- `berkelium show <model>` — Inspect architecture, quantization, context limits, and storage paths.
- `berkelium ps` — Display active local runtime subprocesses and memory consumption.
- `berkelium rm <model>` — Delete local model weights and free storage space.

### Cloud Stack

Access supported cloud inference providers through a unified interface:

- `berkelium cloud providers` — Display connected cloud providers and connection statuses.
- `berkelium cloud models [provider]` — List models available through authenticated cloud providers.
- `berkelium cloud login <provider>` — Securely store API credentials in the macOS Keychain or encrypted vault.
- `berkelium cloud status` — Inspect API connectivity, authentication state, and token usage.

### Agentic Development

Run an autonomous software engineering loop directly in your workspace:

- `berkelium` — Launch the interactive terminal coding agent.
- `berkelium run "<task>"` — Execute a specific coding task, bug fix, or refactor non-interactively.
- `berkelium resume [id]` — Restore conversation context, memory, and task state from a prior session.

```
$ berkelium
› Refactor the database connection pool to use exponential backoff.
Inspecting repository...
Planning:
  1. Locate database pool implementation in src/db/pool.ts
  2. Implement backoff calculation with jitter
  3. Update retry handler in acquireConnection()
  4. Run database unit and integration tests
Editing:
  src/db/pool.ts
Running tests...
✓ 24 passed
✓ 0 failed
Verified.
```

---

## Quick Start

### Installation

Clone the repository and build from source:

```bash
git clone https://github.com/berkelium-org/berkelium.git
cd berkelium
pnpm install
pnpm run build
```

Verify that the CLI executable is built and functional:

```bash
./apps/cli/dist/bin/berkelium.js --version
```

*(Optional)* Create a symbolic link in your local binary path:

```bash
ln -sf "$(pwd)/apps/cli/dist/bin/berkelium.js" /usr/local/bin/berkelium
```

### Initial Diagnostic Check

Run `berkelium doctor` to assess your system environment, hardware detection, runtimes, and providers:

```bash
berkelium doctor
```

```
BERKELIUM DOCTOR
Diagnostics and environment health assessment

Platform
  ✓ macOS Operating System           macOS (25.6.0)
  ✓ Apple Silicon Native (ARM64)     Native arm64 architecture
  ✓ Apple Silicon Chip (M4 Max)      12P + 4E cores, 40 GPU cores
  ✓ Model Memory Budget              51.0 GB allocatable for local models

Runtime
  ✓ Node.js Runtime                  Node v26.8.1
  ✓ Git Version Control              git version 2.50.1
  ✓ macOS Keychain Storage           Available
  ✓ Apple MLX Inference Engine       Ready (v0.29.1)
  ✓ GGUF (llama.cpp) Inference Engine Ready (installed)
  ✓ CPU Fallback Inference Engine    Ready

Providers
  ✓ Google Gemini Provider           Authenticated / API key present
  ✓ Groq LPU Inference Engine        Authenticated / API key present
  ✓ OpenRouter Cloud Provider        Authenticated / API key present
  ✓ Ollama Local Provider            Local service running at 127.0.0.1:11434

✓ No critical system issues found. Berkelium is ready.
```

### Launch the Terminal Agent

```bash
berkelium
```

---

## Local Models

Berkelium manages local models in `~/.berkelium/models/` with an indexed manifest tracking parameter counts, quantization formats, context lengths, and disk footprints.

### Listing Local Models

*(Example terminal output)*:

```
$ berkelium list
NAME                    SIZE       RUNTIME    CONTEXT
────────────────────────────────────────────────────────
berkelium-coder:3b     2.1 GB     MLX        32K
qwen3-coder:30b       18.4 GB     MLX        128K
deepseek-coder:33b    20.1 GB     GGUF       128K
```

> **Note:** Models are downloaded on demand and are not pre-bundled with the repository.

### Pulling a Model

Download model weights from supported registries or Hugging Face repositories:

```bash
$ berkelium pull <model>
```

Example:

```
$ berkelium pull qwen3-coder:30b
Pulling model qwen3-coder:30b...
  Resolving manifest from Hugging Face Hub...
  Architecture: Qwen2.5-Coder-30B-Instruct (4-bit MLX)
  Downloading weights: [████████████████████] 100% (18.4 GB)
  Verifying SHA256 checksum...
✓ Successfully installed qwen3-coder:30b to ~/.berkelium/models/
```

### Inspecting Model Metadata

```bash
$ berkelium show <model>
```

Example:

```
$ berkelium show qwen3-coder:30b
Model:           qwen3-coder:30b
Architecture:    qwen
Parameters:      30B (4-bit quantized)
Context Window:  131,072 tokens
Runtime:         MLX (Apple Silicon optimized)
Disk Size:       18.4 GB
Location:        ~/.berkelium/models/qwen3-coder-30b/
Capabilities:    chat, code, tool_calling, structured_output
```

### Selecting an Active Model

Select a model interactively using the arrow-key model picker, or pass a target identifier directly:

```bash
# Open interactive picker (groups LOCAL and CLOUD models)
berkelium model

# Direct selection
berkelium model use local/qwen3-coder:30b
```

### Process Inspection, Verification, and Removal

```bash
# List active model processes
berkelium ps

# Validate file integrity and SHA256 checksums
berkelium model verify <model>

# Remove a model from local disk
berkelium rm <model>
```

---

## Apple Silicon

Berkelium is engineered specifically for Apple Silicon hardware, including M1, M2, M3, M4, and future generations.

```
┌────────────────────────────────────────────────────────┐
│                  UNIFIED MEMORY POOL                   │
├───────────────────────────┬────────────────────────────┤
│       CPU CORES           │         GPU CORES          │
│   (Performance +          │   (Metal Graphic &         │
│    Efficiency Cores)      │    Compute Pipeline)       │
├───────────────────────────┴────────────────────────────┤
│         APPLE MLX / NEURAL ENGINE ACCELERATOR          │
└────────────────────────────────────────────────────────┘
```

- **Unified Memory Architecture**: CPU, GPU, and Neural Engine access a shared physical memory pool. Weights loaded into memory do not require redundant host-to-device bus transfers.
- **Sub-Millisecond Hardware Discovery**: `HardwareDetector` queries system control interfaces and native hardware tables in <1ms, identifying exact chip generation, core topologies (Performance vs. Efficiency), GPU core counts, and total system RAM.
- **Memory-Aware Operation & Dynamic Budgeting**: Berkelium checks available memory before launching a model. It enforces safety headroom to protect against macOS memory compression overhead and system thrashing:
  ```bash
  $ berkelium status
  HARDWARE & MEMORY BUDGET
  Chip:           M4 Max
  CPU:            12P + 4E cores
  GPU:            40 cores
  Neural Engine:  Available
  Memory:         37.2 GB available / 64.0 GB total
  Model Budget:   51.0 GB allocatable
  ```
- **MLX Runtime Optimization**: Spawns isolated native `mlx_lm` subprocesses with Server-Sent Events (SSE) streaming, native structured tool calling, and clean signal handling.
- **Quantization Support**: Runs 4-bit and 8-bit quantized models natively, allowing 30B+ parameter code models to run comfortably within workstation memory.
- **Context Limits**: Enforces context sliding and token window caps based on physical memory allocation rather than theoretical model ceilings.

---

## Cloud Models

Berkelium provides a unified adapter interface for external inference providers, enabling access to large cloud reasoning models when local compute is insufficient or when remote models are preferred.

*(Example terminal output)*:

```
$ berkelium cloud providers
PROVIDER       STATUS
────────────────────────────
Gemini         ● CONNECTED
OpenAI         ○ DISCONNECTED
Anthropic      ○ DISCONNECTED
Groq           ● CONNECTED
```

> **Provider Notice:** Provider availability depends on local implementation, network reachability, and official API support. Berkelium connects via official developer API keys; it does not claim access to third-party consumer subscriptions unless a dedicated and supported API authentication method exists.

### Credential Isolation

API credentials are never saved in project directories, workspace configuration files, or prompt contexts. They are stored securely in macOS Keychain or an encrypted vault fallback:

```bash
# Securely store a provider API key in macOS Keychain
berkelium cloud login <provider>

# Or supply via standard environment variables
export GEMINI_API_KEY="<your-api-key>"
export GROQ_API_KEY="<your-api-key>"
export OPENROUTER_API_KEY="<your-api-key>"
```

### Cloud Operations

```bash
# Inspect cloud provider status and configuration
berkelium cloud status

# List models available from a connected provider
berkelium cloud models gemini

# Select a cloud model target
berkelium model use cloud/gemini/gemini-3.6-flash

# Review token consumption and cost tracking
berkelium cloud usage
```

---

## Local / Cloud / Hybrid

Berkelium allows you to set your execution mode to balance privacy, latency, reasoning depth, and hardware availability:

```
                 BERKELIUM
                     │
              ┌──────┴──────┐
              │             │
           LOCAL          CLOUD
              │             │
             MLX        API PROVIDER
              │             │
              └──────┬──────┘
                     │
                    AGENT
```

### Runtime Modes

```bash
berkelium mode local
berkelium mode cloud
berkelium mode hybrid
berkelium mode auto
```

- **`local`**: Strictly local execution. Tokens are processed entirely by your machine's MLX or GGUF runtime. Zero prompt data leaves your device.
- **`cloud`**: Direct inference via configured remote API providers.
- **`hybrid`**: Two-stage execution pipeline:
  1. **Local Context Preparation**: AST parsing, symbol mapping, codebase search, and sensitive file redaction execute locally.
  2. **Cloud Reasoning**: Complex architectural planning or difficult bug isolation is processed by a high-parameter cloud model.
  3. **Local Tool Execution**: File mutations, shell commands, and test verification execute locally under strict policy controls.
- **`auto`**: Evaluates model requirements against currently allocatable unified memory. If the model fits within your hardware budget, Berkelium executes locally; otherwise, it resolves to cloud providers adhering to the active privacy policy.

---

## Agentic Development

Berkelium is built for agentic software engineering. It operates through a bounded iterative state machine that inspects repository context, drafts plans, applies surgical code edits, and executes tests to verify every modification.

```
INSPECT ──→ PLAN ──→ EDIT ──→ TEST ──→ VERIFY
                                │         ▲
                                └── FAIL ─┘
```

### Realistic Workflow Session

```
$ berkelium
› Find and fix the failing authentication tests.
Inspecting repository...
Planning:
  1. Locate authentication middleware
  2. Trace token validation
  3. Identify failure
  4. Apply minimal patch
  5. Run affected tests
  6. Run full verification
Editing:
  src/auth/middleware.ts
Testing...
✓ 47 passed
✓ 0 failed
Verified.
```

### Engineering Loop Invariants

- **Inspect**: Extracts relevant symbols, reads file segments, and locates error traces before touching any code.
- **Plan**: Constructs an explicit sequence of modification steps visible in the terminal before execution.
- **Edit**: Performs targeted, non-contiguous patch replacements rather than rewriting entire files.
- **Test**: Executes workspace test runners (`vitest`, `jest`, `pytest`, `cargo test`, `go test`) to validate fixes.
- **Verify**: Inspects exit codes and test summaries. If tests fail, the agent analyzes the failure output and attempts a corrected patch within bounded iterations (`max_iterations: 40`, `max_tool_retries: 3`).

---

## Repository Intelligence

Berkelium inspects your codebase efficiently by extracting symbols and structure without exhausting model context budgets.

```bash
# Generate a token-budgeted AST repository symbol map
berkelium map

# Search symbols, classes, functions, and interfaces across files
berkelium search <query>

# Inspect file metadata, line counts, token density, and symbols
berkelium inspect <path>
```

### How the Agent Reads Codebases

- **Source Code**: Slices files by line ranges with strict byte and token limits.
- **Symbols**: Indexes functions, methods, classes, and exported interfaces using AST extractors.
- **Dependencies**: Analyzes package manifests (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`) to determine framework conventions.
- **Configuration**: Respects `.gitignore`, workspace configuration, and local ignore rules.
- **Tests**: Identifies test runners, test file naming conventions, and failure stack traces.
- **Documentation**: Locates project READMEs, architecture documents, and API specifications.

Example output:

```
$ berkelium search SessionStore
SEARCH RESULTS FOR "SessionStore"
Found 1 matching file

  • src/auth/session.ts
    class SessionStore, method createSession, method invalidateSession
```

---

## Tools

All tool execution in Berkelium is controlled. The agent cannot execute arbitrary shell commands or write to disk without passing through the policy and permission engine.

```
Agent
  ↓
Policy
  ↓
Permission
  ↓
Tool
  ↓
Result
```

### Implemented Native Tools

- **`read_file`**: Read file contents with line range slicing and token limits.
- **`write_file`**: Write new files with atomic workspace validation.
- **`edit_file`**: Apply non-contiguous line replacements with exact string matching.
- **`list_dir`**: Traverse directories with recursive entry summaries and size tracking.
- **`search` / `file_search`**: Find files by path glob matching while respecting ignore rules.
- **`grep_search`**: Fast regex and literal pattern matching across files.
- **`shell`**: Execute shell commands inside the workspace directory under security supervision.
- **`git`**: Inspect repository working tree status, commit history, and diffs.
- **`test`**: Run workspace test runners with output capture and error parsing.
- **`lint`**: Execute project linter checks.
- **`typecheck`**: Validate TypeScript or language-specific types.
- **`build`**: Execute workspace build scripts and report compiler outputs.

---

## Security

Berkelium treats model output as untrusted. Autonomy is bounded by deterministic policy checks, sandbox constraints, and secret redaction.

```
MODEL OUTPUT
      ↓
POLICY
      ↓
PERMISSION
      ↓
AUTHORIZATION
      ↓
TOOL
```

### Security Controls

- **Untrusted Model Output**: Model output is treated strictly as an unvalidated proposal. The model cannot execute commands directly; every operation is dispatched through the `ToolOrchestrator`.
- **Controlled Tool Execution**: Filesystem operations are confined to the workspace root by default. Directory traversal outside the workspace is denied unless explicitly permitted.
- **Authorization for Destructive Actions**: Destructive operations (such as `git reset --hard`, `git clean -f`, or `rm -rf`) require explicit user confirmation via flags (`--force`) or interactive prompts.
- **Secret Redaction**: Inputs sent to models and outputs returned from tools are scanned by `SecretRedactor` to prevent API tokens, private keys, passwords, and sensitive strings from entering model context or persistent logs.
- **Immutable Security Policy**: Workspace repository files cannot override root security policies or disable sandbox boundaries.
- **Integrity Validation**: Local model files undergo SHA256 checksum verification to ensure downloaded weights have not been corrupted or altered.

---

## Privacy

Berkelium provides explicit privacy tiers to control whether code and context may leave your local machine:

```bash
berkelium privacy local
berkelium privacy balanced
berkelium privacy hybrid
berkelium privacy cloud
```

| Privacy Tier | External Inference | Code Transmission | User Confirmation |
|:---|:---|:---|:---|
| **`local`** | Blocked | Never leaves machine | None (strictly local operation) |
| **`balanced`** | Permitted | Permitted with confirmation | Prompts confirmation before cloud escalation |
| **`hybrid`** | Permitted | Redacted context only | Allows pre-approved cloud models |
| **`cloud`** | Permitted | Permitted | None (cloud-first operation) |

When operating under `local` privacy mode, any attempted external network call by a model or tool triggers an immediate error:

```
Error: Privacy policy violation: Outbound network inference blocked under "local" privacy policy.
```

---

## Accessibility

Berkelium is designed to be accessible to developers using screen readers, Braille displays, high-contrast monitors, or reduced-motion environments.

```bash
# Enable high-contrast accessibility mode
berkelium accessibility enable

# Inspect accessibility settings
berkelium accessibility status

# Run any command without ANSI escape sequences
berkelium --plain status
```

### Support Matrix

- **Available**:
  - Full keyboard navigation throughout all interactive prompts and menus.
  - Zero-ANSI plain mode (`--plain`) for compatibility with screen readers and Braille terminals.
  - High-contrast terminal color theme (`high-contrast`).
  - Structured machine-readable JSON output (`--json`) for scriptable inspection.
  - Automatic disabling of terminal animations in plain mode.
- **Planned**:
  - Speech-to-text voice input bridge (`/voice`).
  - Text-to-speech audio status updates.
  - Synthesized audio indicator cues for task success and test failures.
- **Experimental**:
  - Large-text layout formatting for low-vision workflows.

---

## Sessions

Berkelium persists task execution state, token consumption metrics, and conversation context in session files located in `~/.berkelium/sessions/`.

```bash
# List previous sessions
berkelium session list

# Start a fresh persistent session
berkelium session new

# Resume a specific session by ID
berkelium session resume <session-id>

# Delete a session file
berkelium session delete <session-id>
```

Example listing:

```
$ berkelium session list
PERSISTENT SESSIONS
Saved state across runs in ~/.berkelium/sessions/

  • ses_1788689423_a1b2c3  2026-09-06 10:10:23  [qwen3-coder:30b]
    ~/Projects/my-app
  • ses_1788626096_d4e5f6  2026-09-05 16:35:05  [gemini-3.6-flash]
    ~/Projects/backend-service
```

> **Credential Isolation Notice:** Session files persist task history, prompt context, and token usage. API keys, secrets, and authorization tokens are never written into session files.

---

## Slash Commands

In the interactive TUI, typing `/` opens the command palette. It displays available commands, provides fuzzy filtering, and allows keyboard navigation. Typing `/` opens the palette for selection; it does not immediately execute a command.

```
/
────────────────────────────────────
/plan
/build
/debug
/test
/review
/search
/model
/cloud
/privacy
/session
/help
↑ ↓ navigate
Enter select
Esc close
```

### Available Interactive Commands

| Slash Command | Description |
|:---|:---|
| `/help` | Display all available slash commands and descriptions |
| `/plan <task>` | Create an implementation plan before executing edits |
| `/build` | Run project build scripts and parse outputs |
| `/debug` | Analyze test failure stack traces or error logs |
| `/test [filter]` | Run workspace test suite or filtered test files |
| `/review` | Review uncommitted git changes and diffs |
| `/search <query>`| Search codebase symbols and files |
| `/model [name]` | Open interactive model picker or select model |
| `/cloud [action]`| Inspect cloud providers, login, and monitor usage |
| `/mode [mode]` | Switch execution mode (`local`, `cloud`, `hybrid`, `auto`) |
| `/privacy [tier]`| Switch data privacy policy (`local`, `balanced`, `hybrid`, `cloud`) |
| `/session [act]` | Manage persistent sessions (`list`, `resume`, `clear`) |
| `/context` | Display token budget breakdown and context usage |
| `/compact` | Losslessly compact conversation history |
| `/git` | Inspect working tree status |
| `/diff` | Display uncommitted git diffs |
| `/theme [name]` | Live-switch terminal color theme |
| `/clear` | Clear terminal screen buffer |
| `/quit` | Exit Berkelium CLI |

---

## Diagnostics

Verify your local environment, hardware detection, runtimes, model store, and provider credentials at any time:

```bash
# Show summary of hardware, memory budget, runtimes, and models
berkelium status

# Run comprehensive environment diagnostic check
berkelium doctor

# Run deep health assessment
berkelium doctor --deep
```

*(Example diagnostic output)*:

```
$ berkelium doctor
CLI                 ✓
Configuration       ✓
Runtime             ✓
Model               ✓
Storage             ✓
Agent               ✓
Tools               ✓
Permissions         ✓
Git                 ✓
Cloud               ✓
STATUS: READY
```

---

## Command Reference

| Command | Purpose |
|:---|:---|
| `berkelium` | Start the interactive agent |
| `berkelium run <task>` | Run a task or command non-interactively |
| `berkelium resume [id]` | Resume a previous session |
| `berkelium list` | List local models |
| `berkelium pull <model>` | Download a model |
| `berkelium show <model>` | Show model information |
| `berkelium ps` | Show active models |
| `berkelium rm <model>` | Remove a model |
| `berkelium model` | Open interactive model picker |
| `berkelium model use <model>` | Select a model |
| `berkelium model verify <model>` | Validate model checksum and file integrity |
| `berkelium model cache` | Inspect model cache disk usage |
| `berkelium model prune [days]` | Remove models unused for N days |
| `berkelium runtime list` | List local inference runtimes |
| `berkelium runtime status` | Inspect runtime health and versions |
| `berkelium cloud providers` | List supported cloud providers and status |
| `berkelium cloud models [prov]` | List models from a cloud provider |
| `berkelium cloud login <prov>` | Store provider API key in Keychain |
| `berkelium cloud logout <prov>` | Remove provider API key |
| `berkelium cloud status` | Show cloud provider status |
| `berkelium cloud usage` | View token usage and cost tracking |
| `berkelium mode local` | Use local inference |
| `berkelium mode cloud` | Use cloud inference |
| `berkelium mode hybrid` | Use hybrid inference |
| `berkelium mode auto` | Use dynamic resource-aware inference |
| `berkelium privacy [policy]` | Inspect or set data privacy tier |
| `berkelium map` | Display AST repository symbol map |
| `berkelium search <query>` | Search codebase symbols and files |
| `berkelium inspect <path>` | Inspect file size, lines, tokens, and symbols |
| `berkelium session list` | List saved persistent sessions |
| `berkelium session new` | Create a new session |
| `berkelium session resume <id>` | Resume a specific session |
| `berkelium session delete <id>` | Delete a saved session |
| `berkelium git status` | Show working tree status |
| `berkelium git diff` | Show working tree diff |
| `berkelium git history [n]` | View recent commit history |
| `berkelium accessibility [act]` | Enable or disable screen-reader friendly mode |
| `berkelium config list` | View active layered configuration |
| `berkelium config get <key>` | Get specific configuration property |
| `berkelium config set <k> <v>` | Set configuration property override |
| `berkelium config path` | Show configuration filesystem paths |
| `berkelium doctor` | Diagnose installation |
| `berkelium status` | View hardware, memory, runtimes, and models |

---

## Configuration

Berkelium configuration is resolved using a strict 7-tier precedence hierarchy:

```
Defaults → Global Config → Machine Config → Project Config → Directory Config → Session Config → CLI Flags
```

Configuration files reside in:
- Global: `~/.berkelium/config.json`
- Project: `<workspace>/.berkelium/config.json`

### Configuration Categories

- **`runtime`**: Default local runtime (`mlx`, `gguf`, `cpu`), execution mode (`local`, `cloud`, `hybrid`, `auto`).
- **`model`**: Default model target identifier, context limit overrides, temperature.
- **`provider`**: Cloud provider endpoints, timeout thresholds, base URLs.
- **`privacy`**: Active tier (`local`, `balanced`, `hybrid`, `cloud`), outbound network permissions.
- **`security`**: Filesystem read/write/delete boundaries, shell execution policies, dangerous command blacklist.
- **`agent`**: Maximum autonomous iterations (`max_iterations: 40`), retry limits.
- **`routing`**: Cost caps (`hard_limit_usd`, `warn_limit_usd`), capability routing preferences.

### Example Configuration

```json
{
  "default_model": "local/qwen3-coder:30b",
  "runtime": {
    "default": "mlx",
    "mode": "local"
  },
  "privacy": {
    "mode": "balanced",
    "allow_external_inference": true
  },
  "cost": {
    "hard_limit_usd": 10.0,
    "warn_limit_usd": 5.0
  },
  "permissions": {
    "filesystem": {
      "read": "allow",
      "write": { "workspace": "allow", "outside_workspace": "ask" },
      "delete": { "workspace": "ask", "outside_workspace": "deny" }
    },
    "shell": {
      "enabled": true,
      "ask_on_destructive": true
    },
    "network": {
      "allow_outbound": true
    }
  },
  "ui": {
    "theme": "berkelium-dark",
    "launch_animation": true,
    "plain_mode": false
  },
  "agent": {
    "max_iterations": 40
  }
}
```

> **Credential Notice:** Do not write raw API credentials into configuration files. Store them securely in macOS Keychain using `berkelium cloud login <provider>` or export them via environment variables.

---

## Architecture

```
                     BERKELIUM CLI
                           │
                     ┌─────▼─────┐
                     │   Agent   │
                     └─────┬─────┘
                           │
                    ┌──────▼──────┐
                    │ Model Router│
                    └──────┬──────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           Local         Cloud         Hybrid
             │             │             │
            MLX        Providers      Local + Cloud
             │             │             │
             └─────────────┼─────────────┘
                           │
                     ┌─────▼─────┐
                     │   Tools   │
                     └───────────┘
```

- **Agent Engine**: Autonomous state machine coordinating planning, context budgeting, tool execution, and verification.
- **Model Router**: Resolves unified target identifiers (`local/...`, `cloud/...`) based on capability requirements, cost constraints, and privacy policies.
- **Inference Layer**: Direct bindings to Apple MLX and GGUF subprocesses locally, or HTTPS streaming adapters for remote cloud providers.
- **Tool Orchestrator**: Gated execution layer enforcing permission checks, workspace boundaries, and secret redaction.

---

## Troubleshooting

### Model will not load
- **Symptom**: CLI reports `Model allocation failed` or local process terminates immediately upon loading.
- **Cause**: The requested model exceeds the available unified memory budget.
- **Command to diagnose**: `berkelium status`
- **Possible fix**: Select a smaller model or higher quantization tier (e.g. 4-bit instead of 8-bit/fp16), or switch to a cloud target using `berkelium model use cloud/gemini/gemini-3.6-flash`.

### Runtime unavailable
- **Symptom**: `Runtime MLX unavailable` or `llama-server not found`.
- **Cause**: The underlying engine dependencies are not installed in your environment.
- **Command to diagnose**: `berkelium doctor`
- **Possible fix**: For MLX on Apple Silicon, ensure Python 3.10+ and `mlx-lm` are installed (`pip install mlx-lm`). For GGUF, ensure `llama-server` is in your system `$PATH`.

### Cloud provider unavailable
- **Symptom**: Remote inference returns network timeout or connection refused.
- **Cause**: Provider endpoint is unreachable, service is degraded, or firewall is blocking outbound HTTPS.
- **Command to diagnose**: `berkelium cloud status`
- **Possible fix**: Check external provider status pages, verify network connectivity, or switch to local inference with `berkelium mode local`.

### Authentication failure
- **Symptom**: Cloud model calls return `401 Unauthorized` or `Invalid API Key`.
- **Cause**: The stored credential has expired, been revoked, or contains whitespace.
- **Command to diagnose**: `berkelium cloud status`
- **Possible fix**: Re-authenticate with `berkelium cloud login <provider>` or export a fresh key in your shell environment.

### Insufficient memory
- **Symptom**: System reports high memory pressure or inference slows significantly during generation.
- **Cause**: Other applications are competing for unified memory.
- **Command to diagnose**: `berkelium status`
- **Possible fix**: Close background memory-heavy applications, lower model context length in `.berkelium/config.json`, or switch execution to `berkelium mode hybrid`.

### Model download failed
- **Symptom**: `berkelium pull` terminates with network error or checksum mismatch.
- **Cause**: Network interruption or invalid model repository identifier.
- **Command to diagnose**: `berkelium model verify <model>`
- **Possible fix**: Verify repository name and re-run `berkelium pull <model>`.

### Agent cannot execute a command
- **Symptom**: Tool execution outputs `Permission denied by security policy`.
- **Cause**: The command attempts to modify files outside the workspace root or matches a restricted shell pattern.
- **Command to diagnose**: Check permissions with `/permissions` in the interactive session or view `.berkelium/config.json`.
- **Possible fix**: Adjust permission settings in `<workspace>/.berkelium/config.json` if the operation is legitimate.

### Tests fail during agent task
- **Symptom**: Agent stops and reports test regression after applying edits.
- **Cause**: The generated code patch broke an existing test assertion.
- **Command to diagnose**: Review the test execution output displayed in the terminal.
- **Possible fix**: The agent will automatically inspect the failure and attempt a patch within its iteration budget. If stalled, type `/reset` to clear the conversation context.

### Ctrl+C does not stop an operation
- **Symptom**: Pressing `Ctrl+C` does not exit the running process.
- **Cause**: The CLI is running inside a detached subshell or handling an active child subprocess.
- **Command to diagnose**: Check active subprocesses with `berkelium ps`.
- **Possible fix**: In an interactive terminal, a single `Ctrl+C` sends an abort signal to the running task; pressing `Ctrl+C` a second time within 1.5 seconds forces an immediate exit.

---

## Development

Berkelium is maintained as a pnpm monorepo written in TypeScript using composite project references.

### Building from Source

```bash
# Clone the repository
git clone https://github.com/berkelium-org/berkelium.git
cd berkelium

# Install dependencies
pnpm install

# Build all packages and CLI application
pnpm run build

# Typecheck with TypeScript composite references
pnpm run typecheck

# Run test suite
pnpm run test
```

### Validation Workflow

Run the complete validation suite before submitting code:

```bash
# Run unit, integration, and security tests
pnpm run test

# Typecheck across all workspace packages
pnpm run typecheck

# Verify build outputs
pnpm run build
```

---

## Contributing

Contributions that improve Berkelium while preserving its architectural boundaries are welcome:

1. **Preserve Architectural Invariants**: Maintain provider neutrality. Never place provider-specific logic, endpoints, or error formatting inside `AgentRuntime`.
2. **Apple Silicon First**: Preserve sub-150ms startup latency, sub-millisecond hardware detection, and lean memory footprints. Avoid background daemons.
3. **Decouple UI from Execution**: All terminal UI updates must originate from `AgentEvents` dispatched through the `EventBus`. Never couple TUI rendering directly to model APIs.
4. **Enforce Security & Privacy Controls**: All filesystem mutations, shell executions, and outbound network requests must pass through `PermissionEngine` and privacy validation.
5. **Add Tests**: All new features require corresponding unit tests, type validation (`pnpm run typecheck`), and regression coverage for bug fixes.
6. **Document Behavioral Changes**: Keep command references, configuration schemas, and options updated.

---

## Security Reporting

If you discover a security vulnerability, sandbox escape, or credential leakage issue in Berkelium, please report it responsibly:

- Do **not** post vulnerability details in public GitHub issues, discussions, or pull requests.
- Do **not** include actual API keys, passwords, private keys, or personal tokens in reports.
- Disclose findings privately through repository security advisories or by contacting the project maintainers.

---

## Roadmap

- [x] Local model runtime abstraction (MLX, GGUF, CPU)
- [x] Model management (`pull`, `list`, `show`, `rm`, `ps`, `verify`)
- [x] Apple Silicon hardware detection and unified memory budgeting
- [x] Cloud provider adapters (Gemini, OpenRouter, Groq, NVIDIA NIM, Hugging Face)
- [x] Capability-aware model routing and unified target identifiers
- [x] Local, cloud, hybrid, and auto inference modes
- [x] Data privacy governance tiers (`local`, `balanced`, `hybrid`, `cloud`)
- [x] Agentic development loop (inspect, plan, edit, test, verify)
- [x] Repository intelligence (AST symbol mapper, search, file inspector)
- [x] Sandboxed native tools and permission engine
- [x] Safe Git operations with destructive command protection
- [x] Persistent session management (`list`, `new`, `resume`, `delete`)
- [x] Interactive terminal model picker and `/` command palette
- [x] Screen-reader friendly accessibility mode (`--plain`) and high-contrast theme
- [x] Environment health diagnostics (`berkelium doctor`)
- [ ] Speech-to-text voice input bridge
- [ ] Text-to-speech audio status cues
- [ ] Multi-node distributed inference bridge

---

## License

License: To be determined.
