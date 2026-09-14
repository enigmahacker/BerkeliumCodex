# Berkelium Codex — Skill Index

Complete index of all **126** production skills across **19 categories**.

| # | Skill Name | Category | Risk | Permission | Required Tools | Description |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| 1 | [core-agent-runtime](core/agent-runtime/skill.md) | `core` | `safe` | No | None | Manages the deterministic autonomous execution loop and state machine invariants of Berkelium Codex. |
| 2 | [core-planning](core/planning/skill.md) | `core` | `safe` | No | `list_directory` | Decomposes complex engineering goals into atomic, dependency-ordered milestones. |
| 3 | [core-reasoning](core/reasoning/skill.md) | `core` | `safe` | No | None | Executes deliberative architectural analysis and trade-off evaluation before implementation. |
| 4 | [core-task-management](core/task-management/skill.md) | `core` | `safe` | No | None | Tracks step progression, blocker resolution, and milestone completion. |
| 5 | [core-context-management](core/context-management/skill.md) | `core` | `safe` | No | None | Monitors token utilization and budgets context window consumption. |
| 6 | [core-context-compaction](core/context-compaction/skill.md) | `core` | `safe` | No | None | Executes lossless conversation compaction preserving critical task state and verification evidence. |
| 7 | [core-error-recovery](core/error-recovery/skill.md) | `core` | `safe` | No | `diagnostics_run` | Classifies execution failures into 10 categories and generates actionable avoidance instructions. |
| 8 | [core-verification](core/verification/skill.md) | `core` | `safe` | No | `shell_execute` | Enforces the canonical Berkelium autonomous verification loop across tests, linter, and git diff. |
| 9 | [filesystem-list-files](filesystem/list-files/skill.md) | `filesystem` | `safe` | No | `list_directory` | Lists directory contents with file type identification and size attributes. |
| 10 | [filesystem-read-file](filesystem/read-file/skill.md) | `filesystem` | `safe` | No | `read_file` | Reads text file content safely with line slice constraints and binary detection. |
| 11 | [filesystem-write-file](filesystem/write-file/skill.md) | `filesystem` | `medium` | Yes | `write_file` | Creates new files or writes complete content with parent directory provisioning. |
| 12 | [filesystem-edit-file](filesystem/edit-file/skill.md) | `filesystem` | `medium` | Yes | `edit_file`, `read_file` | Applies surgical, targeted string replacements to files preserving surrounding structure. |
| 13 | [filesystem-delete-file](filesystem/delete-file/skill.md) | `filesystem` | `destructive` | Yes | `delete_file` | Safely removes files with confirmation gates and dependency warnings. |
| 14 | [filesystem-move-file](filesystem/move-file/skill.md) | `filesystem` | `medium` | Yes | `move_file` | Renames or relocates files across directory hierarchies while preserving Git history. |
| 15 | [filesystem-copy-file](filesystem/copy-file/skill.md) | `filesystem` | `low` | Yes | `copy_file` | Duplicates files or templates across workspace locations. |
| 16 | [filesystem-search-files](filesystem/search-files/skill.md) | `filesystem` | `safe` | No | `search_files` | Searches for files across the workspace by filename glob pattern or extension. |
| 17 | [filesystem-file-metadata](filesystem/file-metadata/skill.md) | `filesystem` | `safe` | No | `file_metadata` | Inspects file stats, permissions, timestamps, MIME types, and line counts. |
| 18 | [terminal-shell](terminal/shell/skill.md) | `terminal` | `medium` | Yes | `shell_execute` | Executes non-interactive shell commands with strict timeouts, stream capture, and exit code handling. |
| 19 | [terminal-command-execution](terminal/command-execution/skill.md) | `terminal` | `medium` | Yes | `shell_execute` | Structured command runner tracking execution duration, memory consumption, and standard output buffers. |
| 20 | [terminal-process-management](terminal/process-management/skill.md) | `terminal` | `medium` | Yes | `process_list` | Monitors, inspects, and terminates long-running or background processes. |
| 21 | [terminal-environment](terminal/environment/skill.md) | `terminal` | `safe` | No | `environment_get` | Inspects and verifies environment variables and platform runtime configurations. |
| 22 | [terminal-permissions](terminal/permissions/skill.md) | `terminal` | `safe` | No | None | Evaluates operation risk tiers and manages interactive user confirmation workflows. |
| 23 | [terminal-diagnostics](terminal/diagnostics/skill.md) | `terminal` | `safe` | No | `diagnostics_run` | Runs deep system hardware, OS, memory, storage, and developer environment diagnostics. |
| 24 | [code-code-search](code/code-search/skill.md) | `code` | `safe` | No | `search_files` | Searches codebase for text patterns, function calls, or error codes using ripgrep semantics. |
| 25 | [code-symbol-search](code/symbol-search/skill.md) | `code` | `safe` | No | `search_files` | Locates functions, classes, interfaces, and exported types across the project. |
| 26 | [code-dependency-analysis](code/dependency-analysis/skill.md) | `code` | `safe` | No | `read_file` | Analyzes package manifests, import graphs, circular dependencies, and module coupling. |
| 27 | [code-code-editing](code/code-editing/skill.md) | `code` | `medium` | Yes | `edit_file`, `read_file` | Applies surgical, convention-preserving modifications to source code following the 8-step edit loop. |
| 28 | [code-refactoring](code/refactoring/skill.md) | `code` | `medium` | Yes | `read_file`, `edit_file`, `shell_execute` | Improves code structure, readability, and performance without altering external behavior. |
| 29 | [code-debugging](code/debugging/skill.md) | `code` | `safe` | No | `read_file`, `search_files` | Diagnoses root causes of failures, stack traces, race conditions, and unhandled rejections. |
| 30 | [code-code-review](code/code-review/skill.md) | `code` | `safe` | No | `git_diff`, `read_file` | Audits code changes for security flaws, architectural invariants, performance bottlenecks, and style. |
| 31 | [code-architecture-analysis](code/architecture-analysis/skill.md) | `code` | `safe` | No | `list_directory`, `read_file` | Maps system architecture, subsystem boundaries, data flow pipelines, and design patterns. |
| 32 | [code-documentation](code/documentation/skill.md) | `code` | `low` | Yes | `read_file`, `write_file`, `edit_file` | Generates and maintains API documentation, developer guides, READMEs, and changelogs. |
| 33 | [git-status](git/status/skill.md) | `git` | `safe` | No | `git_status` | Inspects Git working tree status, staged files, unstaged modifications, and untracked artifacts. |
| 34 | [git-diff](git/diff/skill.md) | `git` | `safe` | No | `git_diff` | Generates and analyzes unified diffs between working tree, index, or historical commits. |
| 35 | [git-log](git/log/skill.md) | `git` | `safe` | No | `git_log` | Inspects commit history, author attribution, commit messages, and hash references. |
| 36 | [git-branch](git/branch/skill.md) | `git` | `low` | Yes | `git_branch` | Lists, creates, switches, and manages local and tracking Git branches. |
| 37 | [git-commit](git/commit/skill.md) | `git` | `low` | Yes | `git_commit` | Stages modified files and authors conventional, descriptive Git commits. |
| 38 | [git-merge](git/merge/skill.md) | `git` | `medium` | Yes | `git_merge` | Merges branches with fast-forward evaluation and conflict detection. |
| 39 | [git-rebase](git/rebase/skill.md) | `git` | `high` | Yes | `shell_execute` | Rebases active branch onto upstream tracking branch for clean linear commit history. |
| 40 | [git-stash](git/stash/skill.md) | `git` | `low` | Yes | `shell_execute` | Temporarily stashes uncommitted changes to allow branch switching or clean testing. |
| 41 | [git-conflict-resolution](git/conflict-resolution/skill.md) | `git` | `medium` | Yes | `read_file`, `edit_file`, `shell_execute` | Detects conflict markers (<<<<<<<, =======, >>>>>>>) and surgically resolves three-way merges. |
| 42 | [git-rollback](git/rollback/skill.md) | `git` | `destructive` | Yes | `git_restore` | Safely undos accidental changes, reverts commits, and restores files without data loss. |
| 43 | [github-repositories](github/repositories/skill.md) | `github` | `safe` | No | `shell_execute` | Interacts with GitHub repository metadata, clones, remotes, and branch protection rules. |
| 44 | [github-issues](github/issues/skill.md) | `github` | `low` | Yes | `shell_execute` | Lists, inspects, comments on, and creates GitHub issues with structured triage tags. |
| 45 | [github-pull-requests](github/pull-requests/skill.md) | `github` | `medium` | Yes | `shell_execute`, `git_diff` | Creates, inspects, checks out, and reviews GitHub Pull Requests adhering to templates. |
| 46 | [github-actions](github/actions/skill.md) | `github` | `safe` | No | `shell_execute` | Inspects, triggers, and analyzes GitHub Actions CI/CD workflows and job run logs. |
| 47 | [github-releases](github/releases/skill.md) | `github` | `medium` | Yes | `shell_execute`, `read_file` | Drafts, authors, and inspects GitHub Releases with semantic tags and changelogs. |
| 48 | [github-code-search](github/code-search/skill.md) | `github` | `safe` | No | `shell_execute` | Searches remote GitHub repositories for code patterns, API usages, and reference examples. |
| 49 | [testing-test-discovery](testing/test-discovery/skill.md) | `testing` | `safe` | No | `search_files` | Discovers test runners, frameworks, config files, and test files across the repository. |
| 50 | [testing-test-execution](testing/test-execution/skill.md) | `testing` | `medium` | Yes | `shell_execute` | Executes targeted or full test suites, parsing assertions, test counts, and durations. |
| 51 | [testing-test-generation](testing/test-generation/skill.md) | `testing` | `medium` | Yes | `read_file`, `write_file` | Authors rigorous unit, integration, and edge-case tests matching existing project conventions. |
| 52 | [testing-regression-testing](testing/regression-testing/skill.md) | `testing` | `medium` | Yes | `shell_execute` | Runs complete test suites to ensure modifications did not break existing behavior. |
| 53 | [testing-integration-testing](testing/integration-testing/skill.md) | `testing` | `medium` | Yes | `shell_execute` | Validates end-to-end interactions between agent runtime, tools, providers, and TUI. |
| 54 | [testing-test-analysis](testing/test-analysis/skill.md) | `testing` | `safe` | No | `read_file` | Parses test coverage reports, failure patterns, slow tests, and flakiness metrics. |
| 55 | [build-build](build/build/skill.md) | `build` | `medium` | Yes | `shell_execute` | Compiles monorepo packages, libraries, and CLI bundles across project targets. |
| 56 | [build-lint](build/lint/skill.md) | `build` | `safe` | No | `shell_execute` | Runs static linters (ESLint, Oxlint, Biome, Flake8) to detect stylistic and code quality defects. |
| 57 | [build-format](build/format/skill.md) | `build` | `low` | Yes | `shell_execute` | Enforces code formatting standards using Prettier, Biome, Black, or Rustfmt. |
| 58 | [build-type-check](build/type-check/skill.md) | `build` | `safe` | No | `shell_execute` | Executes strict compiler type checking across monorepo project references. |
| 59 | [build-package](build/package/skill.md) | `build` | `medium` | Yes | `shell_execute` | Packages binaries, npm tarballs, wheel archives, or container artifacts. |
| 60 | [build-release](build/release/skill.md) | `build` | `high` | Yes | `shell_execute`, `read_file`, `edit_file` | Orchestrates version bumping, changelog generation, and tag publication. |
| 61 | [web-web-search](web/web-search/skill.md) | `web` | `safe` | No | `web_search` | Executes targeted web search queries prioritizing primary sources and official documentation. |
| 62 | [web-web-open](web/web-open/skill.md) | `web` | `safe` | No | `web_open` | Opens and extracts full Markdown/text content from public web pages. |
| 63 | [web-web-research](web/web-research/skill.md) | `web` | `safe` | No | `web_search`, `web_open` | Conducts multi-step deep technical research following the 6-stage research pipeline. |
| 64 | [web-documentation-research](web/documentation-research/skill.md) | `web` | `safe` | No | `web_search`, `web_open` | Prioritizes official documentation, API references, and formal language specifications. |
| 65 | [web-source-verification](web/source-verification/skill.md) | `web` | `safe` | No | `web_open` | Validates source credibility, publication dates, and cross-checks claims across independent sources. |
| 66 | [web-browser](web/browser/skill.md) | `web` | `low` | Yes | `browser_navigate` | Coordinates browser subagent actions for complex interactive web sessions. |
| 67 | [web-web-citations](web/web-citations/skill.md) | `web` | `safe` | No | `web_cite` | Formats and preserves exact URL citations, anchors, and retrieval timestamps for research claims. |
| 68 | [network-http](network/http/skill.md) | `network` | `medium` | Yes | `http_request` | Sends structured HTTP GET, POST, PUT, DELETE requests with headers and payload validation. |
| 69 | [network-api](network/api/skill.md) | `network` | `medium` | Yes | `http_request` | Interacts with REST and GraphQL APIs, handling pagination, rate limits, and JSON schemas. |
| 70 | [network-curl](network/curl/skill.md) | `network` | `medium` | Yes | `shell_execute` | Executes robust curl commands with custom flags, timeouts, proxying, and response header extraction. |
| 71 | [network-downloads](network/downloads/skill.md) | `network` | `medium` | Yes | `download_file` | Downloads remote files, datasets, and release assets with checksum verification. |
| 72 | [network-connectivity](network/connectivity/skill.md) | `network` | `safe` | No | `check_connectivity` | Validates internet connectivity, DNS resolution, and latency to key AI and package registries. |
| 73 | [data-json](data/json/skill.md) | `data` | `safe` | No | `read_file` | Parses, validates, formats, and transforms JSON and JSON5 data with strict schema validation. |
| 74 | [data-yaml](data/yaml/skill.md) | `data` | `safe` | No | `read_file` | Parses, generates, and formats YAML configurations for GitHub Actions, Docker Compose, and skills. |
| 75 | [data-csv](data/csv/skill.md) | `data` | `safe` | No | `read_file` | Parses and analyzes tabular CSV and TSV data files with delimiter detection and headers. |
| 76 | [data-xml](data/xml/skill.md) | `data` | `safe` | No | `read_file` | Parses and queries XML documents, JUnit test reports, and SVG graphics. |
| 77 | [data-sqlite](data/sqlite/skill.md) | `data` | `medium` | Yes | `shell_execute` | Queries and inspects SQLite database schemas, tables, indexes, and records. |
| 78 | [data-data-analysis](data/data-analysis/skill.md) | `data` | `safe` | No | None | Performs statistical analysis, aggregations, trend analysis, and benchmark metric evaluation. |
| 79 | [security-security-audit](security/security-audit/skill.md) | `security` | `safe` | No | `search_files` | Scans workspace, commits, and dependencies for vulnerabilities, misconfigurations, and unsafe patterns. |
| 80 | [security-secrets](security/secrets/skill.md) | `security` | `safe` | No | None | Detects and redacts secrets (API keys, tokens, passwords, private keys) from logs and outputs. |
| 81 | [security-dependency-security](security/dependency-security/skill.md) | `security` | `safe` | No | `shell_execute`, `read_file` | Audits third-party packages for known CVEs, malicious packages, and supply-chain tampering. |
| 82 | [security-permissions](security/permissions/skill.md) | `security` | `safe` | No | None | Enforces capability-based security boundaries and user confirmation gates on dangerous actions. |
| 83 | [security-sandboxing](security/sandboxing/skill.md) | `security` | `safe` | No | None | Jails filesystem and process execution strictly within authorized workspace boundaries. |
| 84 | [security-threat-modeling](security/threat-modeling/skill.md) | `security` | `safe` | No | `read_file` | Analyzes application attack surfaces, trust boundaries, injection vectors, and auth flows. |
| 85 | [agents-subagents](agents/subagents/skill.md) | `agents` | `medium` | Yes | `agent_spawn` | Spawns and manages specialized subagents with bounded scopes, tool allowlists, and timeouts. |
| 86 | [agents-delegation](agents/delegation/skill.md) | `agents` | `medium` | Yes | `agent_delegate` | Delegates complex sub-tasks to specialized subagents with structured input/output contracts. |
| 87 | [agents-parallel-execution](agents/parallel-execution/skill.md) | `agents` | `medium` | Yes | `agent_parallel` | Executes independent subagent tasks concurrently with aggregated result synchronization. |
| 88 | [agents-agent-handoff](agents/agent-handoff/skill.md) | `agents` | `safe` | No | None | Manages seamless state, context, and artifact handoffs between collaborating subagents. |
| 89 | [agents-agent-review](agents/agent-review/skill.md) | `agents` | `safe` | No | `git_diff`, `read_file` | Deploys a dedicated Reviewer subagent to validate output artifacts against invariants before acceptance. |
| 90 | [browser-navigation](browser/navigation/skill.md) | `browser` | `low` | Yes | `browser_navigate` | Navigates headless browser to web addresses, manages redirects, cookies, and history. |
| 91 | [browser-page-inspection](browser/page-inspection/skill.md) | `browser` | `safe` | No | `browser_inspect` | Inspects rendered DOM elements, accessibility trees, computed styles, and text content. |
| 92 | [browser-interaction](browser/interaction/skill.md) | `browser` | `medium` | Yes | `browser_click`, `browser_type` | Clicks buttons, types into input fields, selects dropdowns, and submits forms. |
| 93 | [browser-screenshots](browser/screenshots/skill.md) | `browser` | `low` | Yes | `browser_screenshot` | Captures full-page or element-level screenshots for visual regression and verification. |
| 94 | [browser-browser-debugging](browser/browser-debugging/skill.md) | `browser` | `safe` | No | `browser_inspect` | Inspects browser console errors, failed network requests (HTTP 4xx/5xx), and client crashes. |
| 95 | [languages-python](languages/python/skill.md) | `languages` | `safe` | No | `read_file` | Python project conventions, virtual environments (venv, uv, poetry), pytest, and type hints. |
| 96 | [languages-javascript](languages/javascript/skill.md) | `languages` | `safe` | No | `read_file` | JavaScript ECMAScript standards, Node.js runtimes, ESM vs CommonJS, and event loops. |
| 97 | [languages-typescript](languages/typescript/skill.md) | `languages` | `safe` | No | `read_file` | TypeScript strict mode, composite monorepos, tsconfig project references, and type inference. |
| 98 | [languages-rust](languages/rust/skill.md) | `languages` | `safe` | No | `read_file` | Rust cargo workflows, borrow checker rules, zero-cost abstractions, clippy, and cargo test. |
| 99 | [languages-go](languages/go/skill.md) | `languages` | `safe` | No | `read_file` | Go module conventions, goroutines, channel synchronization, go vet, and go test. |
| 100 | [languages-java](languages/java/skill.md) | `languages` | `safe` | No | `read_file` | Java language conventions, Maven and Gradle project builds, JUnit 5 testing, and JVM diagnostics. |
| 101 | [languages-cpp](languages/cpp/skill.md) | `languages` | `safe` | No | `read_file` | C/C++ modern standards (C++17/20), CMake build configuration, Clang-Tidy, and memory safety. |
| 102 | [languages-shell](languages/shell/skill.md) | `languages` | `safe` | No | `read_file` | Portable POSIX and Bash scripting, ShellCheck static analysis, error trapping, and quote safety. |
| 103 | [frameworks-react](frameworks/react/skill.md) | `frameworks` | `safe` | No | `read_file` | React component architecture, hooks conventions, state management, and virtual DOM rendering. |
| 104 | [frameworks-nextjs](frameworks/nextjs/skill.md) | `frameworks` | `safe` | No | `read_file` | Next.js App Router, Server Components (RSC), Client Components, SSR, and API routes. |
| 105 | [frameworks-nodejs](frameworks/nodejs/skill.md) | `frameworks` | `safe` | No | `read_file` | Node.js backend architectures, native modules, asynchronous I/O, streams, and cluster workers. |
| 106 | [frameworks-fastapi](frameworks/fastapi/skill.md) | `frameworks` | `safe` | No | `read_file` | FastAPI modern Python web APIs, Pydantic data schemas, dependency injection, and async routes. |
| 107 | [frameworks-express](frameworks/express/skill.md) | `frameworks` | `safe` | No | `read_file` | Express.js middleware pipelines, routing controllers, error-handling middleware, and security (Helmet). |
| 108 | [ai-llm](ai/llm/skill.md) | `ai` | `safe` | No | None | Manages LLM discovery, prompt layer composition, context budgeting, and model routing. |
| 109 | [ai-inference](ai/inference/skill.md) | `ai` | `safe` | No | None | Executes local and cloud LLM inference loops, token streaming, and response normalization. |
| 110 | [ai-training](ai/training/skill.md) | `ai` | `high` | Yes | `shell_execute`, `read_file` | Coordinates model fine-tuning (LoRA, QLoRA), dataset formatting (JSONL), and training loss tracking. |
| 111 | [ai-evaluation](ai/evaluation/skill.md) | `ai` | `safe` | No | `shell_execute` | Evaluates model output quality, code pass@1 accuracy, latency benchmarks, and schema compliance. |
| 112 | [ai-huggingface](ai/huggingface/skill.md) | `ai` | `safe` | No | `http_request` | Interacts with Hugging Face Hub, model checkpoints, serverless inference API, and tokenizers. |
| 113 | [ai-ollama](ai/ollama/skill.md) | `ai` | `medium` | Yes | `http_request` | Integrates with local Ollama daemon (127.0.0.1:11434), model pulling, and streaming inference. |
| 114 | [ai-mlx](ai/mlx/skill.md) | `ai` | `safe` | No | `diagnostics_run` | Apple Silicon MLX native acceleration, Metal GPU unified memory allocation, and 4-bit quantization. |
| 115 | [ai-cuda](ai/cuda/skill.md) | `ai` | `safe` | No | `shell_execute` | NVIDIA CUDA acceleration, nvidia-smi diagnostics, TensorRT-LLM, and VRAM memory constraints. |
| 116 | [ai-rocm](ai/rocm/skill.md) | `ai` | `safe` | No | `shell_execute` | AMD ROCm GPU acceleration, rocm-smi diagnostics, HIP runtime, and Radeon memory allocation. |
| 117 | [infrastructure-docker](infrastructure/docker/skill.md) | `infrastructure` | `medium` | Yes | `read_file`, `shell_execute` | Builds, inspects, and manages Dockerfiles, multi-stage builds, containers, and images. |
| 118 | [infrastructure-ci-cd](infrastructure/ci-cd/skill.md) | `infrastructure` | `safe` | No | `read_file` | Designs, validates, and debugs continuous integration and deployment automation pipelines. |
| 119 | [infrastructure-github-actions](infrastructure/github-actions/skill.md) | `infrastructure` | `medium` | Yes | `read_file`, `write_file` | Authors and hardens GitHub Actions workflows, composite actions, and runner matrices. |
| 120 | [infrastructure-environment](infrastructure/environment/skill.md) | `infrastructure` | `medium` | Yes | `read_file` | Manages multi-environment configuration (development, staging, production) and .env files. |
| 121 | [infrastructure-deployment](infrastructure/deployment/skill.md) | `infrastructure` | `high` | Yes | `shell_execute`, `read_file` | Plans, validates, and coordinates application deployments to cloud, serverless, or edge targets. |
| 122 | [project-discovery](project/project-discovery/skill.md) | `project` | `safe` | No | `list_directory`, `read_file` | Discovers repository topology, monorepo workspaces, language ecosystems, entrypoints, and configurations. |
| 123 | [project-onboarding](project/onboarding/skill.md) | `project` | `safe` | No | `read_file`, `shell_execute` | Guides agent and developer onboarding by validating environment prerequisites, tooling, and developer setup. |
| 124 | [project-architecture](project/architecture/skill.md) | `project` | `safe` | No | `read_file`, `search_files` | Analyzes system architecture, module boundaries, architectural invariants, and design patterns across the codebase. |
| 125 | [project-dependencies](project/dependencies/skill.md) | `project` | `safe` | No | `read_file`, `shell_execute` | Inspects project dependencies, version compatibility, duplicate packages, peer dependency mismatches, and updates. |
| 126 | [project-health](project/project-health/skill.md) | `project` | `safe` | No | `read_file`, `shell_execute` | Evaluates overall project health, test coverage, lint status, technical debt, and maintainability metrics. |
