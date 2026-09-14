# Changelog

All notable changes to Berkelium Codex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-14

### Added
- **12-State Deterministic Finite State Machine**: Implemented strict transition validation matrix (`VALID_TRANSITIONS`), structured state change events, transition history tracking, and invalid state transition rejection.
- **Hierarchical Failure Recovery Engine**: Added `FailureClassifier` categorizing execution failures across 10 error classes (`syntax`, `type`, `dependency`, `environment`, `permission`, `network`, `model`, `tool`, `test`, `logic`) with automated root cause diagnosis and fix suggestions.
- **9 Scoped Subagent Personas**: Implemented explicit tool allowlists, context limits, and task contracts for `Explorer`, `Architect`, `Coder`, `Debugger`, `Tester`, `Reviewer`, `Security`, `Performance`, and `Documentation`.
- **Expanded Slash Commands**: Added `/budget`, `/route`, `/agent`, and `/sandbox` commands with terminal overlays.
- **OSI-Approved Licensing & Governance**: Formally licensed Berkelium Codex under the Apache License 2.0 with Contributor Covenant 2.1, support guidelines, and open governance.
- **Enterprise CI/CD Workflow**: Added GitHub Actions workflow matrix testing across Node 20.x, 22.x, 24.x on macOS and Linux with automated typechecking, test suites, builds, CLI smoke tests, and security audits.
- **Provider & Model Ecosystem**: Full support for Google Gemini (Flash 3.8/3.1, Pro 2.5), Groq (Llama 3.3 70B, Qwen 2.5 72B), OpenRouter community endpoints, NVIDIA NIM, Hugging Face Serverless, Ollama, LM Studio, and Apple Silicon MLX/GGUF local inference.

### Fixed
- **Repository Pollution**: Removed over 3,200 tracked build artifacts, local caches, and `.DS_Store` files from version control; established a comprehensive `.gitignore`.
- **Local Machine Path Leak**: Sanitized hardcoded absolute developer paths in `CONTRIBUTING.md`.
- **Authentic Context Compaction Output**: Removed dummy sample messages in `/compact` and replaced with truthful session state reporting.
- **Permission & Security Gates**: Sealed workspace jail prefix matching and hardened subprocess environment variable isolation.

### Changed
- Refactored `AgentStateMachine` to strictly enforce transition policies and prevent illegal state mutations.
- Enhanced `ToolOrchestrator` to enforce capability-based permission evaluation before any file or process mutations.
