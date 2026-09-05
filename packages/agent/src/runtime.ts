import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ConfigManager, PromptEngine } from '@berkelium/config';
import { ContextEngine } from '@berkelium/context';
import { ToolOrchestrator } from '@berkelium/tools';
import { ProviderRouter, Message, NormalizedResponse, ResponseNormalizer } from '@berkelium/providers';
import { TelemetryTracker } from '@berkelium/telemetry';
import { HookManager } from '@berkelium/plugins';
import { AgentStateMachine, AgentState } from './state-machine.js';
import { SessionManager, SessionData } from './session.js';
import { Verifier } from './verifier.js';
import { SubagentManager } from './subagents.js';

export interface RuntimeInitOptions {
  workspaceRoot?: string;
  configManager: ConfigManager;
  router: ProviderRouter;
  orchestrator: ToolOrchestrator;
  contextEngine: ContextEngine;
  logger: Logger;
  eventBus: EventBus;
  hookManager?: HookManager;
  sessionManager?: SessionManager;
}

export class AgentRuntime {
  public readonly sessionId: string;
  private workspaceRoot: string;
  private configManager: ConfigManager;
  private router: ProviderRouter;
  private orchestrator: ToolOrchestrator;
  private contextEngine: ContextEngine;
  private logger: Logger;
  private eventBus: EventBus;
  private hookManager: HookManager;
  private sessionManager: SessionManager;
  private telemetry: TelemetryTracker;
  private stateMachine: AgentStateMachine;
  private verifier: Verifier;
  private subagents: SubagentManager;

  private conversationMessages: Message[] = [];
  private activeModelTarget: string;
  private abortController: AbortController | null = null;
  private isRunning = false;

  constructor(options: RuntimeInitOptions) {
    this.sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.configManager = options.configManager;
    this.router = options.router;
    this.orchestrator = options.orchestrator;
    this.contextEngine = options.contextEngine;
    this.logger = options.logger.child('runtime');
    this.eventBus = options.eventBus;
    this.hookManager = options.hookManager || new HookManager();
    this.sessionManager = options.sessionManager || new SessionManager();
    this.telemetry = new TelemetryTracker(this.sessionId);
    this.stateMachine = new AgentStateMachine(this.sessionId, this.eventBus);
    this.verifier = new Verifier(this.orchestrator, this.eventBus);
    this.subagents = new SubagentManager(this.orchestrator, this.router, this.logger, this.eventBus);

    this.activeModelTarget = this.configManager.getConfig().default_model;

    // Register all default tools into orchestrator
    this.orchestrator.registerDefaultTools();
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getState(): AgentState {
    return this.stateMachine.getState();
  }

  public getActiveModel(): string {
    return this.activeModelTarget;
  }

  public setActiveModel(modelOrAlias: string): void {
    const prev = this.activeModelTarget;
    this.activeModelTarget = modelOrAlias;
    const target = this.router.resolveTarget(modelOrAlias);

    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: 'model_changed',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      previousModel: prev,
      newModel: target.modelId,
      provider: target.providerId,
    });
  }

  public getTelemetry(): TelemetryTracker {
    return this.telemetry;
  }

  public getSessionHistory(): Message[] {
    return this.conversationMessages;
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.stateMachine.transition('CANCELLED', 'Operation cancelled by user');
    setTimeout(() => {
      this.stateMachine.transition('IDLE');
    }, 100);
  }

  public async executeTask(prompt: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('AgentRuntime is already running a task.');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      this.stateMachine.transition('THINKING', `Analyzing request: "${prompt.slice(0, 50)}..."`);
      await this.hookManager.trigger('session_start', { sessionId: this.sessionId, prompt });

      // Add user message
      this.conversationMessages.push({ role: 'user', content: prompt });
      this.eventBus.emit({
        id: crypto.randomUUID(),
        type: 'message_started',
        sessionId: this.sessionId,
        timestamp: Date.now(),
        role: 'user',
        content: prompt,
      });

      const config = this.configManager.getConfig();
      const maxIterations = config.agent.max_iterations || 40;
      let iterations = 0;

      while (iterations < maxIterations) {
        iterations++;

        if (this.abortController?.signal.aborted) {
          this.stateMachine.transition('CANCELLED');
          break;
        }

        // 1. Context Assembly & Compaction
        this.stateMachine.transition('COMPACTING_CONTEXT');
        const compaction = this.contextEngine.compactIfNeeded(this.conversationMessages);
        if (compaction.compacted) {
          this.conversationMessages = compaction.messages;
          this.eventBus.emit({
            id: crypto.randomUUID(),
            type: 'context_compacted',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            tokensBefore: compaction.tokensBefore,
            tokensAfter: compaction.tokensAfter,
            reductionPercentage: Math.round(
              ((compaction.tokensBefore - compaction.tokensAfter) / compaction.tokensBefore) * 100
            ),
          });
        }

        // 2. Build Layered System Prompt with Workspace Context
        const promptLayers = PromptEngine.loadCustomPrompts(this.workspaceRoot);
        const repoMap = await this.contextEngine.getRepoMap(1500);
        promptLayers.workspace = `Active Workspace: ${this.workspaceRoot}\n\n${repoMap}`;
        const systemPrompt = PromptEngine.compose(promptLayers, this.workspaceRoot);

        // 3. Resolve Active Model Target
        const target = this.router.resolveTarget(this.activeModelTarget);
        const toolDefinitions = this.orchestrator.getRegistry().getDefinitions();

        // 4. Stream LLM Completion
        this.stateMachine.transition('WAITING_FOR_MODEL');
        await this.hookManager.trigger('before_model', {
          messages: this.conversationMessages,
          target,
        });

        this.eventBus.emit({
          id: crypto.randomUUID(),
          type: 'message_started',
          sessionId: this.sessionId,
          timestamp: Date.now(),
          role: 'assistant',
        });

        const acc = ResponseNormalizer.createAccumulator(target.modelId, target.providerId);
        let firstTokenReceived = false;
        const streamStart = performance.now();

        try {
          const stream = target.provider.stream(this.conversationMessages, {
            model: target.modelId,
            systemPrompt,
            tools: toolDefinitions,
            signal: this.abortController.signal,
          });

          for await (const chunk of stream) {
            if (!firstTokenReceived && (chunk.text || chunk.reasoning)) {
              firstTokenReceived = true;
              this.telemetry.recordFirstTokenLatency(performance.now() - streamStart);
            }

            acc.processChunk(chunk);

            if (chunk.type === 'token' && chunk.text) {
              this.eventBus.emit({
                id: crypto.randomUUID(),
                type: 'token_received',
                sessionId: this.sessionId,
                timestamp: Date.now(),
                token: chunk.text,
              });
            } else if (chunk.type === 'reasoning' && chunk.reasoning) {
              this.eventBus.emit({
                id: crypto.randomUUID(),
                type: 'reasoning_token_received',
                sessionId: this.sessionId,
                timestamp: Date.now(),
                token: chunk.reasoning,
              });
            }
          }
        } catch (streamErr: any) {
          if (this.abortController?.signal.aborted) {
            this.stateMachine.transition('CANCELLED');
            break;
          }
          throw streamErr;
        }

        const normalizedResponse = acc.toNormalizedResponse();
        this.telemetry.recordTokenUsage(normalizedResponse.usage);
        await this.hookManager.trigger('after_model', { response: normalizedResponse });

        // Add assistant response to history
        this.conversationMessages.push({
          role: 'assistant',
          content: normalizedResponse.text || undefined,
          tool_calls: normalizedResponse.toolCalls.length > 0 ? normalizedResponse.toolCalls : undefined,
          reasoning: normalizedResponse.reasoning,
        });

        // 5. If no tool calls, autonomous iteration completes
        if (!normalizedResponse.toolCalls || normalizedResponse.toolCalls.length === 0) {
          // 6. Verification Phase if code was modified
          if (config.agent.verify_changes) {
            this.stateMachine.transition('VERIFYING', 'Executing automated verification checks');
            const verifyReport = await this.verifier.runVerificationPipeline(this.sessionId);
            if (!verifyReport.passed) {
              // Feed verification failure back into conversation loop for automated self-healing
              this.conversationMessages.push({
                role: 'user',
                content: `Verification check failed:\n${verifyReport.summary}\nPlease fix the errors and re-verify.`,
              });
              continue;
            }
          }

          this.stateMachine.transition('COMPLETED', 'Task completed successfully');
          break;
        }

        // 7. Execute Tool Calls
        this.stateMachine.transition('EXECUTING_TOOL');
        for (const toolCall of normalizedResponse.toolCalls) {
          if (this.abortController?.signal.aborted) break;

          await this.hookManager.trigger('before_tool', { toolCall });
          const toolStart = performance.now();

          const toolRes = await this.orchestrator.execute({
            callId: toolCall.id,
            toolName: toolCall.name,
            args: typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments,
            sessionId: this.sessionId,
            signal: this.abortController?.signal,
          });

          const toolDuration = performance.now() - toolStart;
          this.telemetry.recordToolCall(toolCall.name, toolDuration, toolRes.success);
          await this.hookManager.trigger('after_tool', { toolCall, result: toolRes });

          // Mark active file in context if filesystem tool
          if (typeof toolCall.arguments === 'object' && toolCall.arguments && (toolCall.arguments as any).path) {
            this.contextEngine.markFileActive((toolCall.arguments as any).path);
          }

          // Feed tool result back to conversation
          this.conversationMessages.push({
            role: 'tool',
            content: toolRes.output,
            tool_call_id: toolCall.id,
            name: toolCall.name,
          });
        }
      }

      // Save session state
      await this.saveSessionState();
      await this.hookManager.trigger('session_end', { sessionId: this.sessionId });
    } catch (err: any) {
      this.logger.error(`Error in agent loop: ${err.message}`, err);
      this.stateMachine.transition('FAILED', err.message);
      this.eventBus.emit({
        id: crypto.randomUUID(),
        type: 'error',
        sessionId: this.sessionId,
        timestamp: Date.now(),
        message: err.message,
        recoverable: false,
        stack: err.stack,
      });
    } finally {
      this.isRunning = false;
      this.abortController = null;
      if (this.stateMachine.getState() !== 'COMPLETED' && this.stateMachine.getState() !== 'FAILED') {
        this.stateMachine.transition('IDLE');
      }
    }
  }

  public async resumeFromSession(sessionData: SessionData): Promise<void> {
    this.conversationMessages = sessionData.messages;
    this.activeModelTarget = sessionData.model;
    this.telemetry.recordTokenUsage(sessionData.tokenUsage);
    this.logger.info(`Resumed session ${sessionData.id} with ${sessionData.messages.length} messages.`);
  }

  private async saveSessionState(): Promise<void> {
    const stats = this.telemetry.getStats();
    await this.sessionManager.saveSession({
      id: this.sessionId,
      createdAt: stats.startTime,
      updatedAt: Date.now(),
      model: this.activeModelTarget,
      provider: this.router.resolveTarget(this.activeModelTarget).providerId,
      workspaceRoot: this.workspaceRoot,
      messages: this.conversationMessages,
      tokenUsage: stats.tokenUsage,
      toolsExecutedCount: stats.toolCallsCount,
    });
  }
}
