import { SkillDefinition } from './types.js';

export const projectSkills: SkillDefinition[] = [
  {
    name: 'project-discovery',
    version: '1.0.0',
    description: 'Discovers repository topology, monorepo workspaces, language ecosystems, entrypoints, and configurations.',
    category: 'project',
    dir: 'project-discovery',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['list_directory', 'read_file'],
    optional_tools: ['search_files'],
    fallbacks: 'Inspect directory listing at root level and search for standard manifest files.',
    title: 'Project Discovery & Repository Topology',
    purpose: 'Identify project ecosystem, package manager, workspace layout, build tools, and principal entry points.',
    when_to_activate: 'Activate at the beginning of a session or when exploring an unfamiliar codebase or workspace.',
    inputs: 'Workspace root path or current directory.',
    preconditions: 'Target workspace directory must be readable.',
    procedure: `1. List top-level files to identify configuration manifests (package.json, Cargo.toml, go.mod, pyproject.toml).
2. Detect monorepo structures (pnpm-workspace.yaml, lerna.json, nx.json, Cargo workspaces).
3. Identify language ecosystems, frameworks, testing runners, and build systems in use.
4. Locate primary application entry points (src/index.ts, apps/cli/src/main.rs, etc.).
5. Index documentation files (README.md, ARCHITECTURE.md, AGENTS.md, CONTRIBUTING.md).
6. Return structured repository profile to inform subsequent skill activations.`,
    tool_usage: 'Use list_directory to inspect root structure; read_file to parse manifest files.',
    safety: 'Read-only operation. Respect .gitignore and skip large directories like node_modules or .git.',
    permissions: 'Safe read-only execution.',
    verification: 'Confirm repository ecosystem, primary language, and build tools are accurately identified.',
    failure_handling: 'If no manifest file is present, scan source files by extension to classify ecosystem.',
    output_contract: 'ProjectDiscoveryProfile with ecosystem, packageManager, workspaces, entrypoints, and docs.',
    examples: 'Identifying Berkelium monorepo layout with pnpm workspaces and TypeScript packages.',
    related_skills: ['project-onboarding', 'project-architecture', 'project-dependencies'],
  },
  {
    name: 'project-onboarding',
    version: '1.0.0',
    description: 'Guides agent and developer onboarding by validating environment prerequisites, tooling, and developer setup.',
    category: 'project',
    dir: 'onboarding',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['read_file', 'shell_execute'],
    optional_tools: ['environment_get'],
    fallbacks: 'Inspect README.md and CONTRIBUTING.md setup sections statically.',
    title: 'Developer & Agent Onboarding Verification',
    purpose: 'Verify system requirements, toolchain versions, installed dependencies, and initial build readiness.',
    when_to_activate: 'Activate when initializing a new workspace, verifying developer setup, or troubleshooting missing toolchains.',
    inputs: 'Project setup documentation, required runtime versions (node, rustc, python, etc.).',
    preconditions: 'Workspace must be discovered and initialized.',
    procedure: `1. Read setup instructions in README.md, CONTRIBUTING.md, or DEVELOPMENT.md.
2. Check required tool versions against local environment via shell_execute (node -v, pnpm -v, rustc --version).
3. Validate presence of package lockfiles (pnpm-lock.yaml, package-lock.json, Cargo.lock).
4. Verify environment variable prerequisites (.env.example comparison).
5. Run smoke test or quick sanity check (e.g., pnpm run lint --dry-run or equivalent).
6. Produce an onboarding status report highlighting any missing prerequisites.`,
    tool_usage: 'Use read_file for setup guidelines; shell_execute for runtime version checks.',
    safety: 'Do not install global tools or mutate system packages without explicit user confirmation.',
    permissions: 'Read-only and diagnostic command execution.',
    verification: 'Confirm all required compilers, package managers, and dependencies meet project specifications.',
    failure_handling: 'If required tool is missing, provide exact OS-specific installation instructions (Homebrew, apt, etc.).',
    output_contract: 'OnboardingStatusReport with toolchainChecks, envPrerequisites, and readinessScore.',
    examples: 'Verifying Node 20+, pnpm 9+, and Turbo are installed before compiling Berkelium monorepo.',
    related_skills: ['project-discovery', 'terminal-environment', 'project-health'],
  },
  {
    name: 'project-architecture',
    version: '1.0.0',
    description: 'Analyzes system architecture, module boundaries, architectural invariants, and design patterns across the codebase.',
    category: 'project',
    dir: 'architecture',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['read_file', 'search_files'],
    optional_tools: ['list_directory'],
    fallbacks: 'Review ARCHITECTURE.md and AGENTS.md directly without deep source AST traversal.',
    title: 'System Architecture & Boundary Analysis',
    purpose: 'Map system components, communication patterns, layer boundaries, and enforce architectural invariants.',
    when_to_activate: 'Activate when planning large refactors, adding new packages/modules, or auditing design patterns.',
    inputs: 'Target module or full workspace architecture specification.',
    preconditions: 'Workspace source tree must be accessible.',
    procedure: `1. Inspect architectural documentation (ARCHITECTURE.md, AGENTS.md, DESIGN.md).
2. Map package and module dependencies to detect circular dependencies or improper coupling.
3. Verify architectural invariants (e.g., UI does not call model APIs directly, tools go through ToolOrchestrator).
4. Identify cross-cutting concerns: logging, error handling, telemetry, and security boundaries.
5. Diagram or summarize component topology and data flow pathways.
6. Provide architectural evaluation and recommendations.`,
    tool_usage: 'Use read_file to inspect architecture docs and core entrypoints; search_files to trace module imports.',
    safety: 'Read-only analysis.',
    permissions: 'Safe read-only execution.',
    verification: 'Confirm module dependencies adhere to declared boundaries and invariants.',
    failure_handling: 'If architectural docs are absent, infer architecture from workspace directory hierarchy and package manifests.',
    output_contract: 'ArchitectureReport with componentMap, dataFlow, invariantStatus, and boundaryViolations.',
    examples: 'Verifying provider-neutrality and event-bus decoupling invariants in Berkelium runtime.',
    related_skills: ['code-architecture-analysis', 'project-discovery', 'project-health'],
  },
  {
    name: 'project-dependencies',
    version: '1.0.0',
    description: 'Inspects project dependencies, version compatibility, duplicate packages, peer dependency mismatches, and updates.',
    category: 'project',
    dir: 'dependencies',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['read_file', 'shell_execute'],
    optional_tools: ['search_files'],
    fallbacks: 'Parse package manifests directly without running package manager commands.',
    title: 'Project Dependency Management & Audit',
    purpose: 'Analyze external dependencies, detect version drift, resolve peer dependency conflicts, and audit update availability.',
    when_to_activate: 'Activate when updating dependencies, troubleshooting version conflicts, or auditing bundle size impact.',
    inputs: 'Target package.json, Cargo.toml, or lockfile.',
    preconditions: 'Project manifest files must be present.',
    procedure: `1. Read root and workspace package manifests to index direct and development dependencies.
2. Check for duplicate or conflicting versions across monorepo workspace packages.
3. Run package manager audit or dependency tree inspection (pnpm why, cargo tree, pip list).
4. Verify peer dependency compatibility and identify deprecated or abandoned packages.
5. Identify outdated packages and evaluate breaking change risks for candidate upgrades.
6. Return dependency inventory and actionable recommendations.`,
    tool_usage: 'Use read_file to parse manifests; shell_execute for pnpm list/why or cargo tree commands.',
    safety: 'Do not run package update or install commands with mutating flags without explicit user confirmation.',
    permissions: 'Safe read-only and diagnostic execution.',
    verification: 'Confirm dependency tree contains no unresolvable peer dependencies or duplicate conflicting versions.',
    failure_handling: 'If package manager CLI fails, parse lockfile directly to trace dependency versions.',
    output_contract: 'DependencyAuditReport with totalDeps, duplicates, outdatedCount, and vulnerabilityAlerts.',
    examples: 'Detecting mismatched React or TypeScript versions across Berkelium monorepo packages.',
    related_skills: ['security-dependency-security', 'project-health', 'build-build'],
  },
  {
    name: 'project-health',
    version: '1.0.0',
    description: 'Evaluates overall project health, test coverage, lint status, technical debt, and maintainability metrics.',
    category: 'project',
    dir: 'project-health',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['read_file', 'shell_execute'],
    optional_tools: ['search_files'],
    fallbacks: 'Evaluate repository status from static files and Git log without running full test suites.',
    title: 'Project Health & Maintainability Evaluation',
    purpose: 'Synthesize quality signals across tests, linting, type checks, documentation, and security into a health scorecard.',
    when_to_activate: 'Activate when assessing repository readiness for release, conducting a codebase review, or establishing quality baselines.',
    inputs: 'Workspace root, target quality thresholds.',
    preconditions: 'Workspace must be discovered with build tools available.',
    procedure: `1. Run test suite to measure passing, failing, and skipped test counts.
2. Execute linter and type-checker to count warnings, errors, and type safety issues.
3. Check Git status and recent commits for uncommitted changes or broken workflows.
4. Assess documentation completeness (README, API docs, changelog, contribution guides).
5. Aggregate security audit results and dependency health metrics.
6. Compute composite project health score (0-100) and generate prioritized remediation recommendations.`,
    tool_usage: 'Use shell_execute for test and lint runners; read_file for documentation checks.',
    safety: 'Run diagnostic and test commands in non-destructive modes.',
    permissions: 'Diagnostic shell execution.',
    verification: 'Confirm all health metric categories are evaluated with concrete data points.',
    failure_handling: 'If full test suite times out, run smoke test subset and note partial evaluation.',
    output_contract: 'ProjectHealthScorecard with score, testStatus, typeErrors, lintWarnings, and actionItems.',
    examples: 'Generating release-readiness health scorecard for Berkelium Codex v1.0.0.',
    related_skills: ['testing-test-analysis', 'security-security-audit', 'project-architecture'],
  },
];
