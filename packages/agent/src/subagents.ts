import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ToolOrchestrator } from '@berkelium/tools';
import { ProviderRouter } from '@berkelium/providers';

export type SubagentRole =
  | 'explorer'
  | 'architect'
  | 'coder'
  | 'debugger'
  | 'tester'
  | 'reviewer'
  | 'security'
  | 'performance'
  | 'documentation';

export interface SubagentConfig {
  id: string;
  role: SubagentRole;
  description: string;
  modelAlias?: string;
  allowedTools: string[];
  systemPrompt: string;
  contextBudgetTokens: number;
  iterationLimit: number;
  outputContract: string;
}

export interface SubagentTaskOptions {
  contextBudget?: number;
  iterationLimit?: number;
  signal?: AbortSignal;
}

export class SubagentManager {
  private orchestrator: ToolOrchestrator;
  private router: ProviderRouter;
  private eventBus?: EventBus;
  private logger: Logger;

  private subagentConfigs: Map<SubagentRole, SubagentConfig> = new Map([
    [
      'explorer',
      {
        id: 'explorer',
        role: 'explorer',
        description: 'Repository topology, symbols, imports, and AST context mapping',
        modelAlias: 'local',
        allowedTools: ['read_file', 'search_files', 'search_text', 'list_directory', 'inspect_project'],
        systemPrompt:
          'You are the Explorer subagent. Your goal is to map the workspace, search for relevant files, symbols, and dependencies without modifying code.',
        contextBudgetTokens: 4000,
        iterationLimit: 5,
        outputContract: 'Structured file paths, symbol signatures, and dependency tree summary.',
      },
    ],
    [
      'architect',
      {
        id: 'architect',
        role: 'architect',
        description: 'System architecture design, component decomposition, and invariant specifications',
        modelAlias: 'reasoning',
        allowedTools: ['read_file', 'search_files', 'list_directory', 'inspect_project', 'git_status'],
        systemPrompt:
          'You are the Architect subagent. Your role is high-level system design, decomposing goals into atomic steps, and enforcing architectural invariants without mutating code.',
        contextBudgetTokens: 8000,
        iterationLimit: 4,
        outputContract: 'Step-by-step implementation plan with explicit verification criteria.',
      },
    ],
    [
      'coder',
      {
        id: 'coder',
        role: 'coder',
        description: 'Surgical, incremental code implementations and type-safe refactorings',
        modelAlias: 'coding',
        allowedTools: ['read_file', 'write_file', 'edit_file', 'diagnostics'],
        systemPrompt:
          'You are the Coder subagent. Your job is to implement surgical code changes and ensure syntactic and type correctness.',
        contextBudgetTokens: 6000,
        iterationLimit: 8,
        outputContract: 'Unified diffs of modified files and diagnostic verification status.',
      },
    ],
    [
      'debugger',
      {
        id: 'debugger',
        role: 'debugger',
        description: 'Root-cause failure diagnosis, stack trace analysis, and minimal fix isolation',
        modelAlias: 'coding',
        allowedTools: ['read_file', 'edit_file', 'test', 'diagnostics', 'run_shell'],
        systemPrompt:
          'You are the Debugger subagent. Your job is to classify failures, diagnose root causes from stack traces and compiler logs, and apply minimal fixes.',
        contextBudgetTokens: 6000,
        iterationLimit: 6,
        outputContract: 'Root-cause diagnosis, minimal reproducing test, and surgical patch.',
      },
    ],
    [
      'tester',
      {
        id: 'tester',
        role: 'tester',
        description: 'Automated test suite execution, regression detection, and behavior validation',
        modelAlias: 'local',
        allowedTools: ['test', 'diagnostics', 'run_shell', 'git_diff'],
        systemPrompt:
          'You are the Tester subagent. Your job is to run unit and integration tests, detect test regressions, and verify behavior.',
        contextBudgetTokens: 4000,
        iterationLimit: 5,
        outputContract: 'Test pass/fail metrics, assertion failure summaries, and execution duration.',
      },
    ],
    [
      'reviewer',
      {
        id: 'reviewer',
        role: 'reviewer',
        description: 'Multi-aspect code review, safety invariants check, and lint adherence',
        modelAlias: 'reasoning',
        allowedTools: ['git_diff', 'read_file', 'git_status'],
        systemPrompt:
          'You are the Reviewer subagent. Your job is to audit diffs, verify invariants, and check for architectural, quality, or security regressions.',
        contextBudgetTokens: 6000,
        iterationLimit: 3,
        outputContract: 'Structured code review with blockers, warnings, and suggestions.',
      },
    ],
    [
      'security',
      {
        id: 'security',
        role: 'security',
        description: 'Secret leak inspection, SSRF checks, workspace jail, and permission auditing',
        modelAlias: 'reasoning',
        allowedTools: ['search_text', 'search_files', 'read_file', 'git_diff', 'inspect_project'],
        systemPrompt:
          'You are the Security subagent. Your job is to inspect code for leaked API keys, tokens, path traversal vulnerabilities, and command injections.',
        contextBudgetTokens: 6000,
        iterationLimit: 4,
        outputContract: 'Vulnerability assessment with severity ratings (CRITICAL/HIGH/MED/LOW) and remediation.',
      },
    ],
    [
      'performance',
      {
        id: 'performance',
        role: 'performance',
        description: 'Latency profiling, memory footprint checks, and token efficiency analysis',
        modelAlias: 'fast',
        allowedTools: ['read_file', 'run_process', 'diagnostics'],
        systemPrompt:
          'You are the Performance subagent. Your job is to measure startup latency, memory footprints, and token consumption bottlenecks.',
        contextBudgetTokens: 4000,
        iterationLimit: 4,
        outputContract: 'Latency breakdown, memory metrics, and performance budget verification.',
      },
    ],
    [
      'documentation',
      {
        id: 'documentation',
        role: 'documentation',
        description: 'Technical documentation sync, README updates, and API reference integrity',
        modelAlias: 'fast',
        allowedTools: ['read_file', 'edit_file', 'write_file', 'search_files', 'list_directory'],
        systemPrompt:
          'You are the Documentation subagent. Your job is to ensure documentation, READMEs, and guides truthfully reflect actual implementations.',
        contextBudgetTokens: 6000,
        iterationLimit: 5,
        outputContract: 'Documentation diffs and verified markdown reference updates.',
      },
    ],
  ]);

  constructor(
    orchestrator: ToolOrchestrator,
    router: ProviderRouter,
    logger: Logger,
    eventBus?: EventBus
  ) {
    this.orchestrator = orchestrator;
    this.router = router;
    this.logger = logger.child('subagents');
    this.eventBus = eventBus;
  }

  public getSubagentConfig(role: SubagentRole | string): SubagentConfig | undefined {
    return this.subagentConfigs.get(role as SubagentRole);
  }

  public listSubagents(): SubagentConfig[] {
    return Array.from(this.subagentConfigs.values());
  }

  public async runSubagentTask(
    role: SubagentRole | string,
    task: string,
    sessionId: string,
    options?: SubagentTaskOptions
  ): Promise<{ success: boolean; result: string }> {
    const config = this.subagentConfigs.get(role as SubagentRole);
    if (!config) {
      throw new Error(`Unknown subagent role: ${role}. Valid roles: ${Array.from(this.subagentConfigs.keys()).join(', ')}`);
    }

    const subagentId = `${role}_${Date.now()}`;
    const start = performance.now();

    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'subagent_started',
      sessionId,
      timestamp: Date.now(),
      subagentId,
      role: config.role,
      task,
    });

    this.logger.info(`Starting subagent [${role}] on task: ${task}`);

    // Subagent uses target model and restricted tools
    const target = this.router.resolveTarget(config.modelAlias || 'coding');
    const filteredTools = this.orchestrator
      .getRegistry()
      .list()
      .filter((t) => config.allowedTools.includes(t.metadata.name));

    const toolsDef = filteredTools.map((t) => ({
      name: t.metadata.name,
      description: t.metadata.description,
      parameters: (t as any).zodToJsonSchema?.(t.schema) || { type: 'object' },
    }));

    try {
      const response = await target.provider.generate(
        [{ role: 'user', content: task }],
        {
          model: target.modelId,
          systemPrompt: `${config.systemPrompt}\n\nOutput Contract: ${config.outputContract}`,
          tools: toolsDef,
          signal: options?.signal,
        }
      );

      // Handle any tool calls made by the subagent
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const tc of response.toolCalls) {
          if (options?.signal?.aborted) break;
          if (config.allowedTools.includes(tc.name)) {
            await this.orchestrator.execute({
              callId: tc.id,
              toolName: tc.name,
              args: typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments,
              sessionId,
              signal: options?.signal,
            });
          }
        }
      }

      const durationMs = Math.round(performance.now() - start);
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'subagent_completed',
        sessionId,
        timestamp: Date.now(),
        subagentId,
        role: config.role,
        result: response.text,
        durationMs,
      });

      return { success: true, result: response.text };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      this.logger.error(`Subagent [${role}] failed: ${err.message}`);
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'subagent_completed',
        sessionId,
        timestamp: Date.now(),
        subagentId,
        role: config.role,
        result: `Subagent error: ${err.message}`,
        durationMs,
      });
      return { success: false, result: err.message };
    }
  }
}
