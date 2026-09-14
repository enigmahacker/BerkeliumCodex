import { SkillDefinition } from './types.js';

export const infrastructureSkills: SkillDefinition[] = [
  {
    name: 'infrastructure-docker',
    version: '1.0.0',
    description: 'Builds, inspects, and manages Dockerfiles, multi-stage builds, containers, and images.',
    category: 'infrastructure',
    dir: 'docker',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['read_file', 'shell_execute'],
    optional_tools: ['write_file'],
    fallbacks: 'Inspect Dockerfile statically without launching container daemon.',
    title: 'Docker Containerization & Image Management',
    purpose: 'Author optimized multi-stage Dockerfiles, inspect container health, and run containerized builds.',
    when_to_activate: 'Activate when containerizing applications, writing Dockerfiles, or debugging container builds.',
    inputs: 'Dockerfile path, image tag, container port mappings.',
    preconditions: 'Docker daemon or OrbStack running on host.',
    procedure: `1. Inspect Dockerfile for multi-stage build optimization and non-root user security.
2. Verify .dockerignore exists to exclude node_modules, .git, and secrets.
3. Build image using docker build -t <tag> . via shell_execute.
4. Verify image layers and resulting image size.
5. If running container: map ports and pass environment variables safely.
6. Return build status.`,
    tool_usage: 'Use read_file to review Dockerfile; shell_execute for docker CLI.',
    safety: 'NEVER build or run Docker containers with privileged mode (--privileged) without explicit confirmation.',
    permissions: 'Requires shell execution and Docker daemon access.',
    verification: 'Confirm docker build completes successfully with exit code 0.',
    failure_handling: 'If build fails on missing file, check .dockerignore patterns.',
    output_contract: 'DockerBuildResult with imageTag, sizeMb, status.',
    examples: 'Building production Alpine container for Berkelium CLI.',
    related_skills: ['infrastructure-ci-cd', 'security-security-audit'],
  },
  {
    name: 'infrastructure-ci-cd',
    version: '1.0.0',
    description: 'Designs, validates, and debugs continuous integration and deployment automation pipelines.',
    category: 'infrastructure',
    dir: 'ci-cd',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['read_file'],
    optional_tools: ['shell_execute', 'write_file'],
    fallbacks: 'Review CI configuration YAML files statically.',
    title: 'CI/CD Pipeline Architecture & Validation',
    purpose: 'Architect resilient multi-OS test matrix pipelines, caching strategies, and quality gates.',
    when_to_activate: 'Activate when setting up CI, optimizing build times, or resolving pipeline failures.',
    inputs: 'Pipeline configuration path (.github/workflows/ci.yml, gitlab-ci.yml).',
    preconditions: 'Pipeline configuration file must exist or be requested.',
    procedure: `1. Inspect pipeline steps: checkout -> setup runtime -> install deps -> typecheck -> test -> build.
2. Validate caching strategy (pnpm store, node_modules cache) to optimize run times.
3. Verify multi-OS matrix coverage (Linux, macOS, Windows where applicable).
4. Ensure critical quality gates (test coverage, benchmark budgets, secret audits) are enforced.
5. Validate YAML syntax and action versions.`,
    tool_usage: 'Use read_file to inspect CI YAML; shell_execute to run local linter.',
    safety: 'Ensure CI secrets are referenced via repository secrets rather than committed plaintext.',
    permissions: 'Safe read-only analysis unless editing workflow files.',
    verification: 'Confirm workflow syntax is valid and all required stages are declared.',
    failure_handling: 'If action uses deprecated node runtime, upgrade action version tag.',
    output_contract: 'CiCdAuditReport with stages: array, matrixConfig: object, warnings: array.',
    examples: 'Auditing .github/workflows/ci.yml in BerkeliumCodex.',
    related_skills: ['infrastructure-github-actions', 'github-actions'],
  },
  {
    name: 'infrastructure-github-actions',
    version: '1.0.0',
    description: 'Authors and hardens GitHub Actions workflows, composite actions, and runner matrices.',
    category: 'infrastructure',
    dir: 'github-actions',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['read_file', 'write_file'],
    optional_tools: ['shell_execute'],
    fallbacks: 'Inspect .github/workflows/ directory.',
    title: 'GitHub Actions Workflow Authoring & Hardening',
    purpose: 'Create and harden GitHub Actions workflows with least-privilege permissions and pinned action SHAs.',
    when_to_activate: 'Activate when creating new workflows in .github/workflows/*.yml.',
    inputs: 'Workflow trigger (push, pull_request, release), job definitions, matrix runners.',
    preconditions: 'Directory .github/workflows/ must exist or be created.',
    procedure: `1. Configure trigger events (on: push: branches: [main], pull_request).
2. Set top-level permissions: contents: read to enforce least-privilege.
3. Configure matrix strategy: os: [ubuntu-latest, macos-latest], node: [20, 22, 24].
4. Pin actions with full commit SHAs or trusted major version tags (actions/checkout@v4).
5. Add steps for pnpm setup, dependency caching, linting, testing, and building.
6. Save workflow file using write_file.`,
    tool_usage: 'Use write_file to save workflow in .github/workflows/.',
    safety: 'Avoid using pull_request_target on untrusted forks with write permissions or secret access.',
    permissions: 'Requires filesystem write permission.',
    verification: 'Check that YAML is syntactically valid and contains all declared jobs.',
    failure_handling: 'If syntax validation fails, check indentation and quotes on boolean values.',
    output_contract: 'WorkflowCreationResult with workflowPath, jobs: array, triggers: array.',
    examples: 'Creating multi-OS CI workflow for Berkelium Codex on Node 20/22/24.',
    related_skills: ['infrastructure-ci-cd', 'github-actions'],
  },
  {
    name: 'infrastructure-environment',
    version: '1.0.0',
    description: 'Manages multi-environment configuration (development, staging, production) and .env files.',
    category: 'infrastructure',
    dir: 'environment',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['read_file'],
    optional_tools: ['write_file', 'file_metadata'],
    fallbacks: 'Inspect .env.example or template configs.',
    title: 'Multi-Environment Configuration & .env Management',
    purpose: 'Manage development, staging, and production environment settings while protecting secret tokens.',
    when_to_activate: 'Activate when bootstrapping new dev setups, loading environment configs, or checking .env files.',
    inputs: 'Environment name (dev, staging, prod), variable keys.',
    preconditions: 'Workspace must be configured.',
    procedure: `1. Inspect .env.example or template to determine required configuration variables.
2. Verify that .env is listed in .gitignore so secrets are never committed.
3. Check for missing required environment variables.
4. If generating .env: use write_file with placeholder values, alerting user to fill actual keys.
5. Return environment audit report.`,
    tool_usage: 'Use read_file to check templates; write_file for .env.local.',
    safety: 'NEVER commit .env, .env.local, or credential vaults to git.',
    permissions: 'Requires filesystem write permission for creating local env files.',
    verification: 'Verify .gitignore contains .env before creating any local configuration file.',
    failure_handling: 'If .env is tracked in git, immediately untrack with git rm --cached .env.',
    output_contract: 'EnvironmentConfigStatus with environmentName, variablesPresent: string[], missing: string[].',
    examples: 'Checking if all variables in .env.example are defined in local environment.',
    related_skills: ['security-secrets', 'terminal-environment'],
  },
  {
    name: 'infrastructure-deployment',
    version: '1.0.0',
    description: 'Plans, validates, and coordinates application deployments to cloud, serverless, or edge targets.',
    category: 'infrastructure',
    dir: 'deployment',
    risk: 'high',
    requires_permission: true,
    required_tools: ['shell_execute', 'read_file'],
    optional_tools: ['check_connectivity'],
    fallbacks: 'Perform pre-flight deployment check and generate deployment commands for user.',
    title: 'Deployment Pre-Flight & Orchestration',
    purpose: 'Execute pre-flight checks, build production bundles, and deploy to target cloud platforms.',
    when_to_activate: 'Activate when deploying web apps, servers, or releasing CLI distribution binaries.',
    inputs: 'Deployment target (Vercel, Cloudflare Workers, Docker, AWS, GCP), environment.',
    preconditions: 'Production build must be generated and passing all tests.',
    procedure: `1. PRE-FLIGHT: Confirm tests pass, typecheck passes, and working tree is clean.
2. Verify production build artifacts exist and have been validated.
3. Check target platform credentials and connectivity.
4. Execute deployment tool or CLI (e.g. vercel deploy, wrangler deploy, gcloud run deploy).
5. Verify deployment URL returns HTTP 200 with expected response headers.
6. Return deployment report with live URL.`,
    tool_usage: 'Call shell_execute with deployment CLI tool.',
    safety: 'Require explicit user authorization before triggering production deployments.',
    permissions: 'High risk deployment capability.',
    verification: 'Check that deployed live URL is reachable and serves the new build.',
    failure_handling: 'If deployment fails, capture platform error log and preserve previous active revision.',
    output_contract: 'DeploymentResult with target, environment, liveUrl, deployedRevision.',
    examples: 'Deploying documentation site to Vercel with pre-flight test validation.',
    related_skills: ['infrastructure-ci-cd', 'build-build'],
  },
];
