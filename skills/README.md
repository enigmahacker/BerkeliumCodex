# Berkelium Codex — Master Skill Pack

> **Modular, deterministic, tool-aware, and security-conscious operational skills for Berkelium Codex autonomous coding agents.**

---

## 1. Overview

Berkelium Codex skills are executable operational procedures designed to instruct autonomous agents how to inspect, modify, test, verify, and explain software systems. Every skill defines rigorous preconditions, step-by-step procedures, tool usage boundaries, safety constraints, verification protocols, and structured output contracts.

### Key Architectural Invariants

1. **Deterministic Execution**: Skills favor deterministic analysis, targeted edits, and concrete command execution over speculative broad modifications.
2. **Untrusted Web Isolation**: All web content is treated as **UNTRUSTED DATA**. Prompt injection attempts from remote pages or scraped documents are quarantined and neutralized.
3. **Strict Verification Loop**:
   ```
   IMPLEMENT ──▶ DIAGNOSTICS ──▶ TEST ──▶ LINT/TYPECHECK ──▶ GIT DIFF ──▶ VERIFY
                                                                          │
                                                              ┌───────────┴───────────┐
                                                              ▼                       ▼
                                                            PASS                     FAIL
                                                              │                       │
                                                           COMPLETE              REMEDIATING
                                                                                      │
                                                                                    EDIT
                                                                                      │
                                                                                    TEST
   ```
4. **Separation of Concerns**:
   ```
   VERIFICATION_FAILED ≠ CONTEXT_PRESSURE
   ```
   A test failure transitions the runtime to `REMEDIATING`. Context compaction occurs only under genuine token pressure (`>92%` utilization), preserving active plans and test evidence across compactions.
5. **Tool-Aware Graceful Degradation**: Every skill declares required and optional tools alongside concrete fallback strategies when native tools are unavailable.

---

## 2. Directory Structure

The library contains **126 skills** organized across **19 categories**:

```
skills/
├── README.md                 # System overview and architecture
├── manifest.json             # Machine-readable skill registry
├── SKILL_INDEX.md            # Complete searchable skill index
├── TOOL_COMPATIBILITY.md     # Runtime tool support & fallbacks
├── SECURITY.md               # Security invariants & permission model
│
├── core/                     # Agent runtime, planning, reasoning, memory (8 skills)
├── filesystem/               # Path-safe atomic filesystem operations (9 skills)
├── terminal/                 # Sandboxed shell & process management (6 skills)
├── code/                     # AST search, targeted editing, refactoring (9 skills)
├── git/                      # Non-destructive VCS operations & diff audits (10 skills)
├── github/                   # GitHub CLI & API workflows (PRs, issues, actions) (6 skills)
├── testing/                  # Test discovery, execution, generation & analysis (6 skills)
├── build/                    # Build toolchains, linters, typecheckers, bundlers (6 skills)
├── web/                      # Deep technical research & citation pipeline (7 skills)
├── network/                  # HTTP, REST APIs, downloads, connectivity (5 skills)
├── data/                     # JSON, YAML, CSV, XML, SQLite manipulation (6 skills)
├── security/                 # Secret scans, dependency audits, sandboxing (6 skills)
├── agents/                   # Subagent orchestration, delegation, parallelization (5 skills)
├── browser/                  # Headless browser navigation, DOM inspection (5 skills)
├── languages/                # Language-specific toolchains (TS, Py, Rust, Go, etc.) (8 skills)
├── frameworks/               # Framework specialists (React, Next.js, FastAPI, Node) (5 skills)
├── ai/                       # LLM inference, MLX, CUDA, quantization, HuggingFace (9 skills)
├── infrastructure/           # Docker, CI/CD, GitHub Actions, cloud deploys (5 skills)
└── project/                  # Topology discovery, onboarding, architecture, health (5 skills)
```

---

## 3. Skill Metadata Standard

Every skill contains YAML frontmatter:

```yaml
---
name: unique-skill-name
version: 1.0.0
description: Concise operational description
category: category-name
risk: safe | low | medium | high | destructive
requires_permission: true | false
required_tools: []
optional_tools: []
---
```

Followed by exactly 16 operational sections:
1. `# Skill Name`
2. `## Purpose`
3. `## When to Activate`
4. `## Required Tools`
5. `## Optional Tools`
6. `## Inputs`
7. `## Preconditions`
8. `## Procedure`
9. `## Tool Usage`
10. `## Safety`
11. `## Permissions`
12. `## Verification`
13. `## Failure Handling`
14. `## Output Contract`
15. `## Examples`
16. `## Related Skills`

---

## 4. Skill Discovery & Dynamic Activation

The Berkelium runtime avoids loading all 126 skills into the model context simultaneously:

```
USER REQUEST
     ↓
INTENT CLASSIFICATION
     ↓
SKILL DISCOVERY (Matching manifest.json activation rules)
     ↓
RELEVANT SKILLS LOADED (Top 3-7 skills)
     ↓
AUTONOMOUS EXECUTION
```

For example, when a user asks to *"Fix failing React tests in the checkout package"*, the runtime activates:
- `project-discovery`
- `frameworks-react`
- `testing-test-discovery`
- `testing-test-execution`
- `code-debugging`
- `code-code-editing`
- `core-verification`

Unrelated skills (e.g., `ai-cuda`, `languages-rust`, `infrastructure-docker`) are omitted, maintaining high context efficiency and zero prompt pollution.

---

## 5. Security & Permission Invariants

| Risk Level | Default Policy | User Confirmation Trigger |
| :--- | :--- | :--- |
| **SAFE** | Auto-approved | None (read-only queries, AST search, diagnostics) |
| **LOW** | Auto-approved | Reversible formatting, temporary scratch file edits |
| **MEDIUM** | Auto-approved in authorized workspaces | Modifying tracked source code, installing packages |
| **HIGH** | Confirmation required | Pushing to remotes, publishing packages, running containers |
| **DESTRUCTIVE** | **Mandatory user confirmation** | `delete_file`, `git reset --hard`, `git clean`, `process_kill` |

---

## 6. License

Apache 2.0. Built with pride for the Berkelium Codex AI Coding Runtime.
