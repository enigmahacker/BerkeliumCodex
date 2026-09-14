# Getting Support for Berkelium Codex

Thank you for building with Berkelium Codex. We are committed to providing an open, responsive, and developer-friendly community.

---

## 1. Documentation & Self-Service

Before filing an issue, please check the existing documentation:

- **Quick Start & CLI Overview**: [README.md](./README.md)
- **Architecture Invariants**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Antigravity Engineering Rules**: [AGENTS.md](./AGENTS.md)
- **Security Policy & Hardening**: [SECURITY.md](./SECURITY.md)
- **Testing Pyramid**: [TESTING.md](./TESTING.md)
- **Local Diagnostics**: Run `berkelium doctor` or `bk doctor` in your terminal to automatically audit your Node runtime, Apple Silicon hardware acceleration, local inference engines (Ollama, LM Studio, MLX, GGUF), and provider credentials.

---

## 2. Where to Ask Questions

| Channel | Purpose |
| :--- | :--- |
| **GitHub Issues (Bug Reports)** | For reproducible errors, broken commands, tool crashes, and unexpected agent failures. |
| **GitHub Issues (Feature Requests)** | For proposing new providers, tools, subagents, or TUI capabilities. |
| **GitHub Discussions** | For architecture discussions, ideas, showcasing workflows, and general Q&A. |
| **Security Reports** | For reporting vulnerabilities. Email **security@berkelium.dev** (do not open public issues). |

---

## 3. Creating a Great Bug Report

To help maintainers diagnose and resolve issues quickly:

1. **Run `berkelium doctor`**: Paste the diagnostic output in your issue.
2. **Include Node and OS Versions**: e.g., Node.js v22.13.0 on macOS Darwin 24.3 (Apple Silicon M3 Max).
3. **Provide Minimal Reproduction Steps**: Include the exact slash command or agent prompt that triggered the issue.
4. **Sanitize Outputs**: Never paste actual API keys, passwords, or proprietary source code in public issues (Berkelium's built-in `SecretRedactor` automatically protects runtime outputs, but exercise care with your own shell history).

---

## 4. Supported Platforms & Environments

- **Tier 1 (Fully Supported & Tested in CI)**:
  - macOS 12+ (Apple Silicon M1/M2/M3/M4)
  - Linux (x86_64, aarch64 on Ubuntu 22.04+ / Debian 12+)
  - Node.js >= 20.0.0 (Node 22 LTS and Node 24 recommended)
  - pnpm >= 9.0.0
- **Tier 2 (Community Supported)**:
  - Windows 11 via WSL2 (Ubuntu)
  - Intel x86_64 macOS
