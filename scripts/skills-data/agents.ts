import { SkillDefinition } from './types.js';

export const agentsSkills: SkillDefinition[] = [
  {
    name: 'agents-subagents',
    version: '1.0.0',
    description: 'Spawns and manages specialized subagents with bounded scopes, tool allowlists, and timeouts.',
    category: 'agents',
    dir: 'subagents',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['agent_spawn'],
    optional_tools: ['agent_await'],
    fallbacks: 'Execute sub-tasks sequentially in primary agent runtime.',
    title: 'Specialized Subagent Orchestration',
    purpose: 'Spawn scoped subagent personas (Explorer, Coder, Tester, Reviewer, Security) with dedicated tool constraints.',
    when_to_activate: 'Activate when delegating isolated sub-goals (e.g. read-only codebase indexing or parallel test execution).',
    inputs: 'Subagent persona, explicit objective, tool allowlist, max steps, timeout_ms, parent task ID.',
    preconditions: 'SubagentManager must be initialized in AgentRuntime.',
    procedure: `1. Verify subagent persona is valid (Explorer, Architect, Coder, Debugger, Tester, Reviewer, Security, Performance, Documentation).
2. Configure bounded tool allowlist (e.g. Explorer has read-only tools; no shell write).
3. Assign discrete step limit (max 10 steps) and execution timeout.
4. Spawn subagent using agent_spawn.
5. Monitor subagent events via child event bus.
6. Await subagent output contract fulfillment.`,
    tool_usage: 'Invoke agent_spawn with persona, objective, and allowedTools.',
    safety: 'Never spawn subagents recursively without depth bounds (max depth = 2).',
    permissions: 'Requires agent orchestration permission.',
    verification: 'Confirm subagent completes with output adhering to its persona contract.',
    failure_handling: 'If subagent exceeds timeout or step limit, terminate cleanly and return partial findings.',
    output_contract: 'SubagentResult with subagentId, status (completed/timeout), outputContract.',
    examples: 'Spawning Explorer subagent to map packages/providers directory structure.',
    related_skills: ['agents-delegation', 'agents-parallel-execution', 'agents-agent-review'],
  },
  {
    name: 'agents-delegation',
    version: '1.0.0',
    description: 'Delegates complex sub-tasks to specialized subagents with structured input/output contracts.',
    category: 'agents',
    dir: 'delegation',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['agent_delegate'],
    optional_tools: ['agent_await'],
    fallbacks: 'Execute delegated sub-task directly within primary agent loop.',
    title: 'Structured Task Delegation',
    purpose: 'Hand off focused engineering tasks to dedicated personas with unambiguous deliverables.',
    when_to_activate: 'Activate when separating concerns (e.g. delegating test writing to Tester while Coder focuses on implementation).',
    inputs: 'Target persona, task description, input context, expected deliverable schema.',
    preconditions: 'Target persona must exist in the subagent registry.',
    procedure: `1. Define exact task objective and required output format.
2. Select appropriate persona matching task domain.
3. Bundle relevant file context and constraints.
4. Call agent_delegate.
5. Receive structured output deliverable.
6. Integrate result back into primary plan progression.`,
    tool_usage: 'Call agent_delegate with persona and task.',
    safety: 'Do not delegate tasks without defining verification criteria.',
    permissions: 'Requires agent delegation capability.',
    verification: 'Check that delegated output satisfies the required schema.',
    failure_handling: 'If delegate fails, primary agent resumes task directly.',
    output_contract: 'DelegatedTaskResult with persona, status, deliverable.',
    examples: 'Delegating unit test writing for new schema validator to Tester subagent.',
    related_skills: ['agents-subagents', 'agents-agent-handoff'],
  },
  {
    name: 'agents-parallel-execution',
    version: '1.0.0',
    description: 'Executes independent subagent tasks concurrently with aggregated result synchronization.',
    category: 'agents',
    dir: 'parallel-execution',
    risk: 'medium',
    requires_permission: true,
    required_tools: ['agent_parallel'],
    optional_tools: ['agent_await'],
    fallbacks: 'Execute tasks sequentially.',
    title: 'Concurrent Independent Task Execution',
    purpose: 'Run strictly independent sub-tasks concurrently (e.g. testing multiple independent packages).',
    when_to_activate: 'Activate ONLY when sub-tasks have zero shared mutable state or file dependencies.',
    inputs: 'Array of independent task definitions with target personas.',
    preconditions: 'Tasks must be mutually independent.',
    procedure: `1. Analyze task dependencies: verify NO two tasks write to the same files.
2. If tasks share write targets, reject parallel execution and execute sequentially.
3. Launch parallel subagents using agent_parallel.
4. Monitor concurrent execution with Promise.allSettled semantics.
5. Aggregate results from all child agents.
6. Synthesize combined report for primary agent.`,
    tool_usage: 'Invoke agent_parallel with array of subagent tasks.',
    safety: 'STRICT INVARIANT: Never parallelize tasks that mutate shared files or git index.',
    permissions: 'Requires parallel execution capability.',
    verification: 'Verify all child tasks completed without file contention or race conditions.',
    failure_handling: 'If one child task fails, collect successful outputs and report failed task for retry.',
    output_contract: 'ParallelExecutionSummary with results: array, successCount, failureCount.',
    examples: 'Running linting on packages/agent while running typecheck on packages/providers.',
    related_skills: ['agents-subagents', 'core-planning'],
  },
  {
    name: 'agents-agent-handoff',
    version: '1.0.0',
    description: 'Manages seamless state, context, and artifact handoffs between collaborating subagents.',
    category: 'agents',
    dir: 'agent-handoff',
    risk: 'safe',
    requires_permission: false,
    required_tools: [],
    optional_tools: [],
    fallbacks: 'Pass artifacts via disk files in scratch directory.',
    title: 'Subagent State & Artifact Handoff',
    purpose: 'Transfer execution context, diffs, and verification requirements cleanly from one persona to another.',
    when_to_activate: 'Activate when transitioning from Architect -> Coder or Coder -> Reviewer.',
    inputs: 'Source agent ID, target agent persona, state payload, modified files list.',
    preconditions: 'Source agent must have completed its milestone.',
    procedure: `1. Capture deliverables from source agent (e.g. architecture plan or code diff).
2. Validate deliverable against handoff contract.
3. Package context summary without conversational noise.
4. Pass context to target persona during initialization.
5. Emit agent_handoff event for observability.`,
    tool_usage: 'Internal runtime context transfer.',
    safety: 'Strip unnecessary conversational turns during handoff to prevent token bloat.',
    permissions: 'Safe in-memory operation.',
    verification: 'Confirm target agent receives complete context required to execute.',
    failure_handling: 'If handoff artifact is incomplete, request missing data before starting target agent.',
    output_contract: 'HandoffEnvelope with sourcePersona, targetPersona, payload, files.',
    examples: 'Handing off code diff from Coder to Reviewer for architectural audit.',
    related_skills: ['agents-delegation', 'agents-agent-review'],
  },
  {
    name: 'agents-agent-review',
    version: '1.0.0',
    description: 'Deploys a dedicated Reviewer subagent to validate output artifacts against invariants before acceptance.',
    category: 'agents',
    dir: 'agent-review',
    risk: 'safe',
    requires_permission: false,
    required_tools: ['git_diff', 'read_file'],
    optional_tools: [],
    fallbacks: 'Execute code-review skill in primary agent runtime.',
    title: 'Adversarial Subagent Review & Quality Gate',
    purpose: 'Perform objective secondary review of code changes made by Coder subagent.',
    when_to_activate: 'Activate after code modifications are finished before marking task complete.',
    inputs: 'Coder task objective, generated git diff, test results.',
    preconditions: 'Code changes must be staged in working tree.',
    procedure: `1. Spawn Reviewer subagent with read-only tools.
2. Review git diff against original user instructions.
3. Verify that changes do not violate AGENTS.md architectural boundaries.
4. Verify all new logic has corresponding test coverage.
5. Reviewer issues either APPROVAL or REJECTION with required modifications.
6. If rejected: pass feedback back to Coder for remediation.`,
    tool_usage: 'Uses git_diff and read_file in read-only mode.',
    safety: 'Reviewer cannot edit files directly; must only critique and verify.',
    permissions: 'Safe read-only review.',
    verification: 'Confirm review decision is based on verified test and diff evidence.',
    failure_handling: 'If Reviewer finds defects, do not complete task; return to editing cycle.',
    output_contract: 'ReviewDecision with approved: boolean, critique: string, requiredFixes: string[].',
    examples: 'Reviewer subagent validating that a new command does not bypass PermissionEngine.',
    related_skills: ['code-code-review', 'agents-subagents', 'core-verification'],
  },
];
