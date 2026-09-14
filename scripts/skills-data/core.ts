import { SkillDefinition } from './types.js';

export const coreSkills: SkillDefinition[] = [
  {
    name: 'core-agent-runtime',
    version: '1.0.0',
    description: 'Manages the deterministic autonomous execution loop and state machine invariants of Berkelium Codex.',
    category: 'core',
    dir: 'agent-runtime',
    risk: 'safe',
    requires_permission: false,
    required_tools: [],
    optional_tools: ['diagnostics_run'],
    fallbacks: 'Degrade to synchronous step-by-step dispatch without background streaming.',
    title: 'Core Agent Runtime Management',
    purpose: 'Govern the deterministic lifecycle of the autonomous coding loop across all valid state transitions.',
    when_to_activate: 'Activate on session initialization, mode switching, or when supervising multi-step autonomous workflows.',
    inputs: 'Session options, active agent mode, configuration profiles, and initial user prompt.',
    preconditions: 'AgentRuntime and EventBus must be instantiated with a valid workspace root.',
    procedure: `1. Initialize the state machine in IDLE state.
2. Receive task and dispatch state transition to ANALYZING.
3. Validate runtime invariants (provider neutrality, permission boundaries, token budget).
4. Cycle through PLANNING, WAITING_FOR_MODEL, EXECUTING_TOOL, and VERIFYING states.
5. Record telemetry, token counters, and transition history.
6. Terminate gracefully in COMPLETED on success, or trigger failure recovery on unhandled exceptions.`,
    tool_usage: 'Invoke diagnostics_run when system health or telemetry inspection is requested.',
    safety: 'Enforce max_iterations (40) and max_tool_retries (3) to prevent unbounded loops.',
    permissions: 'Safe operation. Sub-operations request permissions via Capability Engine.',
    verification: 'Confirm final state is COMPLETED and all lifecycle events were dispatched via EventBus.',
    failure_handling: 'If state machine encounters an invalid transition, reject via InvalidStateTransitionError and transition to FAILED.',
    output_contract: 'JSON payload containing final execution status, iterations count, and error summary.',
    examples: 'Execution of autonomous goal: bk run "refactor database schema" with full event tracking.',
    related_skills: ['core-planning', 'core-error-recovery', 'core-verification'],
  },
  {
    name: 'core-planning',
    version: '1.0.0',
    description: 'Decomposes complex engineering goals into atomic, dependency-ordered milestones.',
    category: 'core',
    dir: 'planning',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['list_directory'],
    optional_tools: ['read_file', 'search_files'],
    fallbacks: 'Proceed with linear single-step execution if repository discovery tools are unavailable.',
    title: 'Hierarchical Task Planning',
    purpose: 'Formulate an actionable, structured execution plan before code mutations occur.',
    when_to_activate: 'Activate when a user goal spans multiple files, packages, or architectural layers.',
    inputs: 'High-level objective, repository overview, constraints, and relevant file paths.',
    preconditions: 'Workspace root must be resolved and readable.',
    procedure: `1. Analyze the user prompt to identify core requirements and deliverables.
2. Perform rapid repository inspection using list_directory or search_files.
3. Formulate an ordered list of milestone steps with explicit verification criteria.
4. Flag high-risk steps requiring user authorization.
5. Export plan to session memory and emit plan event to EventBus.`,
    tool_usage: 'Use list_directory to inspect repository structure and identify target modules.',
    safety: 'Never plan destructive operations without flagging confirmation requirements.',
    permissions: 'Read-only operation. Requires no elevated capability.',
    verification: 'Verify that every milestone step has an associated observable verification command.',
    failure_handling: 'If dependencies are ambiguous, insert an exploration step before implementation.',
    output_contract: 'Structured Plan object with goal description and array of Step objects.',
    examples: 'Plan creation for adding a new cloud provider adapter with unit tests.',
    related_skills: ['core-task-management', 'core-reasoning', 'core-verification'],
  },
  {
    name: 'core-reasoning',
    version: '1.0.0',
    description: 'Executes deliberative architectural analysis and trade-off evaluation before implementation.',
    category: 'core',
    dir: 'reasoning',
    risk: 'safe',
    requires_permission: false,
    required_tools: [],
    optional_tools: ['read_file'],
    fallbacks: 'Employ heuristic decision-making based on established project conventions.',
    title: 'Deliberative Architectural Reasoning',
    purpose: 'Analyze architectural tradeoffs, algorithm complexity, and edge cases prior to code modification.',
    when_to_activate: 'Activate when resolving subtle bugs, designing APIs, or choosing third-party libraries.',
    inputs: 'Problem statement, architectural invariants, code snippets, and performance budgets.',
    preconditions: 'Relevant file contexts or error traces must be accessible.',
    procedure: `1. State the technical challenge and identify underlying assumptions.
2. Enumerate alternative implementation approaches with pros and cons.
3. Evaluate approaches against project constraints (latency, memory, backwards compatibility).
4. Select the optimal approach adhering to repository invariants.
5. Synthesize justification and pass to planning or coding pipeline.`,
    tool_usage: 'Use read_file to inspect interface contracts and typing definitions.',
    safety: 'Prevent premature optimization; align strictly with AGENTS.md architectural rules.',
    permissions: 'Safe cognitive process requiring no system permissions.',
    verification: 'Check that the selected approach addresses all failure modes identified during analysis.',
    failure_handling: 'If tradeoffs are evenly balanced, prioritize simplicity and minimal diff surface.',
    output_contract: 'Reasoning markdown block detailing problem, options, tradeoff matrix, and decision.',
    examples: 'Deciding between in-memory LRU cache vs persistent disk cache for model tokens.',
    related_skills: ['core-planning', 'code-architecture-analysis'],
  },
  {
    name: 'core-task-management',
    version: '1.0.0',
    description: 'Tracks step progression, blocker resolution, and milestone completion.',
    category: 'core',
    dir: 'task-management',
    risk: 'safe',
    requires_permission: false,
    required_tools: [],
    optional_tools: ['diagnostics_run'],
    fallbacks: 'Track status via linear in-memory execution logs.',
    title: 'Autonomous Task State Management',
    purpose: 'Maintain progress state across multi-step execution plans and notify listeners.',
    when_to_activate: 'Activate on every milestone transition during autonomous plan execution.',
    inputs: 'Active plan ID, current step index, step result (success/failure/blocked).',
    preconditions: 'An active Plan must exist in AgentRuntime session state.',
    procedure: `1. Retrieve current step from active plan.
2. Mark step status as in_progress and emit step_started event.
3. Monitor tool execution and capture output artifacts.
4. Upon verification success, mark step completed; upon failure, mark step failed.
5. If blockers emerge, pause execution and update reason.
6. Evaluate whether all steps are finished to trigger plan completion.`,
    tool_usage: 'Emit typed events over EventBus for TUI updates.',
    safety: 'Never mark a step completed without positive verification output.',
    permissions: 'Safe operation; manipulates internal agent runtime state.',
    verification: 'Ensure step transitions reflect actual tool outcomes and exit codes.',
    failure_handling: 'If a step fails, trigger error-recovery skill rather than silently continuing.',
    output_contract: 'Updated Plan state with timestamps and status for each step.',
    examples: 'Advancing from Step 2 (Write unit test) to Step 3 (Run test suite).',
    related_skills: ['core-planning', 'core-verification', 'core-error-recovery'],
  },
  {
    name: 'core-context-management',
    version: '1.0.0',
    description: 'Monitors token utilization and budgets context window consumption.',
    category: 'core',
    dir: 'context-management',
    risk: 'safe',
    requires_permission: false,
    required_tools: [],
    optional_tools: [],
    fallbacks: 'Estimate token usage using standard character-to-token heuristics (4 chars/token).',
    title: 'Context Window Budgeting & Monitoring',
    purpose: 'Prevent context window exhaustion and optimize model prompt efficiency.',
    when_to_activate: 'Activate continuously before every model interaction turn.',
    inputs: 'Current conversation history, context limit, model identifier, and proposed tool inputs.',
    preconditions: 'Model context window parameters must be defined in provider capabilities.',
    procedure: `1. Measure tokens in prompt layers (system prompt, project memory, conversation history).
2. Calculate current usage percentage: (tokens_used / context_limit) * 100.
3. Classify tier: <70% NORMAL, 70-85% MONITOR, 85-92% PREPARE COMPACTION, >92% COMPACT.
4. Prune transient tool outputs if usage exceeds 85%.
5. Signal compaction requirement when threshold crosses 92%.`,
    tool_usage: 'Uses in-memory Tokenizer and ContextEngine utilities.',
    safety: 'Do not truncate user prompts or core system constraints.',
    permissions: 'Read-only memory calculation.',
    verification: 'Verify that total prompt tokens do not exceed the model maximum context ceiling.',
    failure_handling: 'If context exceeds 95%, initiate emergency compaction immediately.',
    output_contract: 'Context telemetry object with tokens_used, context_limit, and usage_percent.',
    examples: 'Tracking 45,000 tokens against a 128,000 token context window on Llama 3.3.',
    related_skills: ['core-context-compaction', 'core-agent-runtime'],
  },
  {
    name: 'core-context-compaction',
    version: '1.0.0',
    description: 'Executes lossless conversation compaction preserving critical task state and verification evidence.',
    category: 'core',
    dir: 'context-compaction',
    risk: 'safe',
    requires_permission: false,
    required_tools: [],
    optional_tools: [],
    fallbacks: 'Perform deterministic FIFO pruning of intermediate tool execution logs.',
    title: 'Lossless Context Compaction',
    purpose: 'Reduce token footprint while retaining all critical objectives, modified files, and test outcomes.',
    when_to_activate: 'Activate strictly when context utilization exceeds 92%. Never activate due to test failure.',
    inputs: 'Full session conversation history, active objective, plan state, and file diffs.',
    preconditions: 'Active execution state must be saved to restore after compaction.',
    procedure: `1. CRITICAL RULE: Verify that compaction trigger is CONTEXT_PRESSURE, not VERIFICATION_FAILED.
2. Evaluate token budget and confirm context usage exceeds threshold (>92%).
3. Snapshot current runtime state (active step, modified files, errors).
4. Transition state machine to COMPACTING_CONTEXT.
5. Extract user prompt, core architecture decisions, and current file modifications.
6. Condense intermediate tool executions and conversational turns into structured summary within token budget.
7. Replace bloated history with the synthesized summary block.
8. Restore runtime state machine to the previous interrupted state.`,
    tool_usage: 'Invokes ContextCompactor in @berkelium/context.',
    safety: 'Never discard active file paths, open bug reproductions, or user-supplied constraints.',
    permissions: 'Internal memory mutation only.',
    verification: 'Confirm compacted token count is at least 40% lower than pre-compaction total.',
    failure_handling: 'If summarization fails, fall back to aggressive sliding window truncation.',
    output_contract: 'Compacted message array with metadata summary record.',
    examples: 'Compacting 60,000 tokens of test outputs into 8,000 tokens of structured context.',
    related_skills: ['core-context-management', 'core-agent-runtime'],
  },
  {
    name: 'core-error-recovery',
    version: '1.0.0',
    description: 'Classifies execution failures into 10 categories and generates actionable avoidance instructions.',
    category: 'core',
    dir: 'error-recovery',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['diagnostics_run'],
    optional_tools: ['read_file'],
    fallbacks: 'Log error to stderr and prompt user for manual guidance.',
    title: 'Hierarchical Failure Recovery & Avoidance',
    purpose: 'Diagnose runtime errors, update the avoidance ledger, and synthesize remediation steps.',
    when_to_activate: 'Activate whenever a tool execution fails, test suite fails, or runtime exception occurs.',
    inputs: 'Error object, stack trace, tool arguments, and exit code.',
    preconditions: 'FailureLedger must be available in AgentRuntime context.',
    procedure: `1. Parse error message, stack trace, and stderr streams.
2. Classify error into one of 10 classes: syntax, type, dependency, environment, permission, network, model, tool, test, logic.
3. Extract failing file path and line number if present.
4. Formulate concrete avoidance instruction (e.g. "Do not pass --flag to command X").
5. Record entry in FailureLedger.
6. Inject avoidance rules into next prompt layer and transition to REMEDIATING.`,
    tool_usage: 'Use diagnostics_run to verify whether underlying system dependencies are broken.',
    safety: 'Do not retry the exact same failing command without adjusting parameters or environment.',
    permissions: 'Safe analysis operation.',
    verification: 'Verify error class matches failure signatures and avoidance instruction is non-empty.',
    failure_handling: 'If error category cannot be determined, default to category "logic" and limit retries.',
    output_contract: 'FailureClassification object with category, root_cause, and avoidance_rule.',
    examples: 'Recovering from missing TypeScript types by installing @types/node and updating import.',
    related_skills: ['core-verification', 'code-debugging', 'testing-test-execution'],
  },
  {
    name: 'core-verification',
    version: '1.0.0',
    description: 'Enforces the canonical Berkelium autonomous verification loop across tests, linter, and git diff.',
    category: 'core',
    dir: 'verification',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['shell_execute'],
    optional_tools: ['git_diff'],
    fallbacks: 'Perform static file inspection and syntax validation if test runner is absent.',
    title: 'Autonomous Verification & Quality Gate',
    purpose: 'Validate all changes against diagnostics, test suites, type checking, and git diffs before completion.',
    when_to_activate: 'Activate after code editing, refactoring, or bug fixing before marking a task complete.',
    inputs: 'Modified file list, project test script, build script, and working directory.',
    preconditions: 'Mutations must be saved to the filesystem.',
    procedure: `1. Execute project linter or typecheck (e.g. pnpm run typecheck or tsc -b).
2. Execute targeted test suite covering modified code (e.g. vitest run <file>).
3. Inspect git diff to verify changes are minimal and preserve surrounding code formatting.
4. If all checks pass: emit verification_completed(passed=true) and conclude.
5. If any check fails: emit verification_completed(passed=false), transition to REMEDIATING, and remediate.
6. CRITICAL RULE: Never transition from VERIFYING to COMPACTING_CONTEXT due to test failure.`,
    tool_usage: 'Use shell_execute for running test runner; use git_diff to verify patch cleanliness.',
    safety: 'Do not modify verification scripts to force passing results.',
    permissions: 'Requires shell execution capability for test runners.',
    verification: 'Observable test pass report with exit code 0.',
    failure_handling: 'Capture exact failed assertion and feed directly into core-error-recovery.',
    output_contract: 'VerificationReport with passed: boolean, checks: array, and diffSummary: string.',
    examples: 'Validating that a bugfix passes unit tests and typechecking before final signoff.',
    related_skills: ['core-error-recovery', 'testing-test-execution', 'build-type-check'],
  },
];
