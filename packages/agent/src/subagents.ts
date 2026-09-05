import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ToolOrchestrator } from '@berkelium/tools';
import { ProviderRouter } from '@berkelium/providers';

export interface SubagentConfig {
  id: string;
  role: 'explorer' | 'coder' | 'tester' | 'reviewer' | string;
  modelAlias?: string;
  allowedTools: string[];
  systemPrompt: string;
}

export class SubagentManager {
  private orchestrator: ToolOrchestrator;
  private router: ProviderRouter;
  private eventBus?: EventBus;
  private logger: Logger;

  private subagentConfigs: Map<string, SubagentConfig> = new Map([
    [
      'explorer',
      {
        id: 'explorer',
        role: 'explorer',
        modelAlias: 'local',
        allowedTools: ['read_file', 'search_files', 'search_text', 'list_directory', 'inspect_project'],
        systemPrompt: 'You are the Explorer subagent. Your goal is to map the workspace, search for relevant files, symbols, and dependencies without modifying code.',
      },
    ],
    [
      'coder',
      {
        id: 'coder',
        role: 'coder',
        modelAlias: 'coding',
        allowedTools: ['read_file', 'write_file', 'edit_file', 'diagnostics'],
        systemPrompt: 'You are the Coder subagent. Your job is to implement surgical code changes and ensure syntactic and type correctness.',
      },
    ],
    [
      'tester',
      {
        id: 'tester',
        role: 'tester',
        modelAlias: 'local',
        allowedTools: ['test', 'diagnostics', 'run_shell', 'git_diff'],
        systemPrompt: 'You are the Tester subagent. Your job is to run unit tests, detect test regressions, and verify behavior.',
      },
    ],
    [
      'reviewer',
      {
        id: 'reviewer',
        role: 'reviewer',
        modelAlias: 'reasoning',
        allowedTools: ['git_diff', 'read_file', 'git_status'],
        systemPrompt: 'You are the Reviewer subagent. Your job is to audit diffs, verify invariants, and check for architectural or security flaws.',
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

  public getSubagentConfig(role: string): SubagentConfig | undefined {
    return this.subagentConfigs.get(role);
  }

  public async runSubagentTask(
    role: string,
    task: string,
    sessionId: string
  ): Promise<{ success: boolean; result: string }> {
    const config = this.subagentConfigs.get(role);
    if (!config) {
      throw new Error(`Unknown subagent role: ${role}`);
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
          systemPrompt: config.systemPrompt,
          tools: toolsDef,
        }
      );

      // Handle any tool calls made by the subagent
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const tc of response.toolCalls) {
          if (config.allowedTools.includes(tc.name)) {
            await this.orchestrator.execute({
              callId: tc.id,
              toolName: tc.name,
              args: typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments,
              sessionId,
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
