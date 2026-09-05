# 🌌 Berkelium CLI

> **Ultra-Customizable Terminal AI Coding Agent**  
> *Proudly Indian. Built for the World.*

Berkelium is a production-grade, provider-neutral, local-first terminal AI coding workstation engineered for Apple Silicon and modern developer environments.

---

## ⚡ Features

- **Universal Model Runtime**: Use **NVIDIA**, **OpenRouter**, **Ollama**, and **LM Studio** interchangeably without altering agent workflows.
- **Provider Neutrality**: No model-specific transport leaks into the core runtime.
- **12-State Resilient State Machine**: Deterministic execution loop, intelligent planning, verification, and subagent orchestration.
- **20+ Sandboxed Native Tools**: File editing, multi-file search, terminal execution, Git intelligence, diagnostics, and MCP bridges.
- **Deep Theming**: 8 built-in themes (`berkelium-dark`, `matrix`, `dracula`, `nord`, `terminal`, `minimal`, `high-contrast`, etc.) and hot-reloadable custom YAML themes in `~/.berkelium/themes/`.
- **Live Terminal UI**: Rich status indicators, real-time token streaming, thinking/reasoning inspection, non-blocking cyberpunk launch sequence, and Hackathon mode (`--hackathon`).
- **Security & Privacy**: macOS Keychain credential storage, granular permission policies, and automatic secret redaction (`.env`, tokens, private keys).
- **Apple Silicon Native**: ARM64-optimized, sub-150ms boot times, low memory overhead.

---

## 🚀 Quick Start

```bash
# Launch interactive TUI
berkelium

# Direct task execution
berkelium run "Refactor session auth and run tests"

# Check system health
berkelium doctor

# Theming
berkelium --theme matrix
```
