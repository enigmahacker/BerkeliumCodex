import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ConfigManager, PromptEngine, PrivacyEngine, CostController, AgentEffort } from '@berkelium/config';
import { ContextEngine } from '@berkelium/context';
import { ToolOrchestrator } from '@berkelium/tools';
import { ProviderRouter, Message, NormalizedResponse, ResponseNormalizer } from '@berkelium/providers';
import { TelemetryTracker } from '@berkelium/telemetry';
import { HookManager } from '@berkelium/plugins';
import { AgentStateMachine, AgentState } from './state-machine.js';
import { SessionManager, SessionData } from './session.js';
import { ProjectMemory } from './memory.js';
import { Verifier } from './verifier.js';
import { SubagentManager } from './subagents.js';
import { AgentMode, AGENT_MODES, isValidAgentMode } from './modes.js';
import { MissionRunner, MissionReport, MissionOptions } from './mission.js';
import { BackgroundTaskManager } from './background-task-manager.js';
import { FailureLedger } from './failure-recovery.js';
import { classifyIntent, isActionableIntent, UserIntent } from './intent.js';
import { sanitizeAssistantResponse, StreamSanitizer } from './sanitizer.js';

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
  private privacyEngine: PrivacyEngine;
  private costController: CostController;
  private memory: ProjectMemory;
  private agentMode: AgentMode = 'build';
  private missionRunner: MissionRunner;
  private failureLedger: FailureLedger;

  private conversationMessages: Message[] = [];
  private activeModelTarget: string;
  private effort: AgentEffort = 'medium';
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
    this.privacyEngine = new PrivacyEngine(this.configManager.getConfig().privacy);
    this.costController = new CostController(this.configManager.getConfig().cost);
    this.memory = new ProjectMemory(this.workspaceRoot);
    this.failureLedger = new FailureLedger();
    this.missionRunner = new MissionRunner(
      this.orchestrator,
      this.router,
      this.verifier,
      this.logger,
      this.eventBus,
      this.workspaceRoot
    );

    const conf = this.configManager.getConfig();
    this.activeModelTarget = conf.defaultModel || conf.default_model;
    this.effort = (conf.effort as AgentEffort) || 'medium';

    // Register all default tools into orchestrator
    this.orchestrator.registerDefaultTools();
  }

  public getEffort(): AgentEffort {
    return this.effort;
  }

  public setEffort(effort: AgentEffort): void {
    this.effort = effort;
    this.configManager.setSessionOverride({ effort });
  }

  public getFailureLedger(): FailureLedger {
    return this.failureLedger;
  }

  public getMemory(): ProjectMemory {
    return this.memory;
  }

  public getPrivacyEngine(): PrivacyEngine {
    return this.privacyEngine;
  }

  public getCostController(): CostController {
    return this.costController;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getState(): AgentState {
    return this.stateMachine.getState();
  }

  public get state(): AgentState {
    return this.stateMachine.getState();
  }

  public getStateMachine(): AgentStateMachine {
    return this.stateMachine;
  }

  public restoreState(targetState?: AgentState): void {
    this.stateMachine.restoreState(targetState);
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

  public getMode(): AgentMode {
    return this.agentMode;
  }

  public setMode(mode: AgentMode): void {
    if (!isValidAgentMode(mode)) {
      throw new Error(`Invalid agent mode: "${mode}". Valid modes: ${Object.keys(AGENT_MODES).join(', ')}`);
    }
    const prev = this.agentMode;
    this.agentMode = mode;
    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: 'mode_changed' as any,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      previousMode: prev,
      newMode: mode,
    });
  }

  public async executeMission(goal: string, options?: MissionOptions): Promise<MissionReport> {
    return this.missionRunner.executeMission(goal, this.activeModelTarget, {
      ...options,
      signal: this.abortController?.signal || options?.signal,
    });
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    BackgroundTaskManager.getInstance().stopAll();
    if (this.stateMachine.canTransition('CANCELLED')) {
      this.stateMachine.transition('CANCELLED', 'Operation cancelled by user');
      setTimeout(() => {
        if (this.stateMachine.canTransition('IDLE')) {
          this.stateMachine.transition('IDLE');
        }
      }, 100);
    }
  }

  /**
   * Compacts context under token pressure, saving interrupted active state and restoring it cleanly.
   */
  public async compactContext(): Promise<void> {
    const interruptedState = this.stateMachine.getState();
    this.stateMachine.transition('COMPACTING_CONTEXT', 'Context compaction triggered by token pressure');
    const compaction = this.contextEngine.compactIfNeeded(this.conversationMessages);
    if (compaction.compacted) {
      this.conversationMessages = compaction.messages;
      const tokensSaved = compaction.tokensSaved ?? (compaction.tokensBefore - compaction.tokensAfter);
      this.telemetry.recordTokensSaved(tokensSaved);

      this.eventBus.emit({
        id: crypto.randomUUID(),
        type: 'context_compacted',
        sessionId: this.sessionId,
        timestamp: Date.now(),
        tokensBefore: compaction.tokensBefore,
        tokensAfter: compaction.tokensAfter,
        reductionPercentage: Math.round(
          (tokensSaved / Math.max(1, compaction.tokensBefore)) * 100
        ),
      });
    }
    this.restoreState(interruptedState);
  }

  public async executeTask(prompt: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('AgentRuntime is already running a task.');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    try {
      // 1. Classify intent before planning or verification
      const classification = classifyIntent(prompt);
      const intent: UserIntent = classification.intent;

      this.stateMachine.transition('THINKING', `Intent classified as ${intent}: "${prompt.slice(0, 50)}..."`);
      await this.hookManager.trigger('session_start', { sessionId: this.sessionId, prompt, intent });

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

      // 2. Fast-path: Pure Conversational Requests (CHAT / QUESTION)
      // Must follow IDLE -> THINKING -> RESPONDING -> IDLE
      if (intent === 'CHAT' || intent === 'QUESTION') {
        this.stateMachine.transition('RESPONDING', 'Responding to conversational request');
        await this.handleConversationalTurn();
        this.stateMachine.transition('IDLE', 'Conversational turn completed');
        return;
      }

      // 3. Actionable Intent Workflow (CODE_TASK, COMMAND, DEBUG, REVIEW, RESEARCH)
      const config = this.configManager.getConfig();
      let maxIterations = config.agent.max_iterations || 40;
      let maxRemediations = 3;
      let compactionThreshold = 0.85;

      switch (this.effort) {
        case 'low':
          maxIterations = Math.min(maxIterations, 15);
          maxRemediations = 1;
          compactionThreshold = 0.70;
          break;
        case 'medium':
          maxIterations = Math.min(maxIterations, 30);
          maxRemediations = 2;
          compactionThreshold = 0.80;
          break;
        case 'high':
          maxIterations = Math.max(maxIterations, 45);
          maxRemediations = 3;
          compactionThreshold = 0.88;
          break;
        case 'max':
          maxIterations = Math.max(maxIterations, 60);
          maxRemediations = 4;
          compactionThreshold = 0.95;
          break;
      }

      let iterations = 0;
      let remediationCount = 0;
      const filesModified = new Set<string>();
      const toolsExecuted: string[] = [];

      // Enter planning if actionable code task or debug or review
      if (['CODE_TASK', 'DEBUG', 'REVIEW'].includes(intent)) {
        this.stateMachine.transition('PLANNING', `Planning ${intent} execution`);
      }

      while (iterations < maxIterations) {
        iterations++;

        if (this.abortController?.signal.aborted) {
          if (this.stateMachine.canTransition('CANCELLED')) {
            this.stateMachine.transition('CANCELLED');
          }
          break;
        }

        // Context Pressure Management:
        // ACTIVE_STATE -> COMPACTING_CONTEXT -> PREVIOUS_ACTIVE_STATE
        if (this.contextEngine.needsCompaction(this.conversationMessages, compactionThreshold)) {
          await this.compactContext();
        }

        // Build Layered System Prompt with Workspace Context & Project Memory
        const promptLayers = PromptEngine.loadCustomPrompts(this.workspaceRoot);
        const repoMap = await this.contextEngine.getRepoMap(800);
        const memPrompt = this.memory.getContextPrompt(400);
        const failurePrompt = this.failureLedger.formatAvoidanceContext();
        const modePrompt = AGENT_MODES[this.agentMode]?.promptInstructions || '';
        promptLayers.workspace = `Active Workspace: ${this.workspaceRoot}\n\n${modePrompt}\n\n${repoMap}${memPrompt ? '\n\n' + memPrompt : ''}${failurePrompt ? '\n\n' + failurePrompt : ''}`;
        const systemPrompt = PromptEngine.compose(promptLayers, this.workspaceRoot);

        // Resolve Active Model Target
        const mode = (config as any).runtime?.mode || 'local';
        let target = this.router.resolveTarget(this.activeModelTarget);

        if (mode === 'hybrid') {
          this.logger.debug(
            'Hybrid execution: Local context prepared → Reasoning target: ' +
              target.providerId +
              '/' +
              target.modelId
          );
        }

        const toolDefinitions = this.orchestrator.getRegistry().getDefinitions();

        // Enforce Privacy & Cost Policies
        const isLocal = ['mlx', 'gguf', 'cpu', 'ollama', 'lmstudio'].includes(target.providerId.toLowerCase());
        const lastUserMessage = this.conversationMessages.slice().reverse().find((m) => m.role === 'user');
        const privacyCheck = this.privacyEngine.evaluate(target.providerId, isLocal, lastUserMessage?.content);
        if (!privacyCheck.allowed) {
          throw new Error(`Privacy policy violation: ${privacyCheck.reason}`);
        }

        const budgetCheck = this.costController.checkBudget();
        if (!budgetCheck.allowed) {
          throw new Error(`Cost budget exceeded: ${budgetCheck.reason}`);
        }

        // Stream LLM Completion
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

        const sanitizer = new StreamSanitizer({
          onToken: (token) => {
            this.eventBus.emit({
              id: crypto.randomUUID(),
              type: 'token_received',
              sessionId: this.sessionId,
              timestamp: Date.now(),
              token,
            });
          },
          onReasoningStart: () => {
            this.eventBus.emit({
              id: crypto.randomUUID(),
              type: 'reasoning_started',
              sessionId: this.sessionId,
              timestamp: Date.now(),
            });
          },
          onReasoningEnd: () => {
            this.eventBus.emit({
              id: crypto.randomUUID(),
              type: 'reasoning_finished',
              sessionId: this.sessionId,
              timestamp: Date.now(),
            });
          },
        });

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
              sanitizer.feed(chunk.text);
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
          sanitizer.flush();
        } catch (streamErr: any) {
          if (this.abortController?.signal.aborted) {
            if (this.stateMachine.canTransition('CANCELLED')) {
              this.stateMachine.transition('CANCELLED');
            }
            break;
          }
          throw streamErr;
        }

        const normalizedResponse = acc.toNormalizedResponse();
        const sanitized = sanitizeAssistantResponse(normalizedResponse.text || '');

        this.telemetry.recordTokenUsage(normalizedResponse.usage);
        this.costController.recordUsage(
          target.providerId,
          target.modelId,
          normalizedResponse.usage.promptTokens,
          normalizedResponse.usage.completionTokens
        );
        await this.hookManager.trigger('after_model', { response: normalizedResponse });

        // Add assistant response to history (clean, never leaking <thought> or prompt internals)
        this.conversationMessages.push({
          role: 'assistant',
          content: sanitized.content || undefined,
          tool_calls: normalizedResponse.toolCalls.length > 0 ? normalizedResponse.toolCalls : undefined,
          reasoning: normalizedResponse.reasoning || sanitized.reasoning,
        });

        // If no tool calls were requested, evaluate verification or complete
        if (!normalizedResponse.toolCalls || normalizedResponse.toolCalls.length === 0) {
          const isActionable = isActionableIntent(intent);
          const hasMutations = filesModified.size > 0;
          const shouldVerify =
            config.agent.verify_changes &&
            isActionable &&
            (hasMutations || intent === 'DEBUG' || intent === 'REVIEW');

          if (shouldVerify) {
            this.stateMachine.transition('VERIFYING', 'Executing automated verification pipeline');
            const verifyReport = await this.verifier.runVerificationPipeline(this.sessionId, {
              intent,
              filesModified: Array.from(filesModified),
              toolsExecuted,
            });

            if (!verifyReport.passed) {
              const canRemediate = verifyReport.isRemediable !== false && remediationCount < maxRemediations;

              if (canRemediate) {
                remediationCount++;
                this.failureLedger.recordFailure('verification_pipeline', verifyReport.summary);
                this.stateMachine.transition(
                  'REMEDIATING',
                  `Remediating verification failure (attempt ${remediationCount}/${maxRemediations}): ${verifyReport.summary}`
                );
                this.conversationMessages.push({
                  role: 'user',
                  content: `Verification check failed:\n${verifyReport.summary}\nPlease fix the errors and re-verify.`,
                });
                continue;
              } else {
                this.stateMachine.transition(
                  'FAILED',
                  `Verification failed and cannot be remediated (max remediation attempts reached): ${verifyReport.summary}`
                );
                break;
              }
            }
          }

          this.stateMachine.transition('COMPLETED', 'Task completed successfully');
          break;
        }

        // Execute Tool Calls
        this.stateMachine.transition('EXECUTING', 'Executing requested tool calls');
        for (const toolCall of normalizedResponse.toolCalls) {
          if (this.abortController?.signal.aborted) break;

          // Non-destructive PLAN mode enforcement
          if (this.agentMode === 'plan') {
            const mutatingTools = ['write_file', 'edit_file', 'patch_file', 'delete_file'];
            if (mutatingTools.includes(toolCall.name)) {
              const blockedMsg = `PLAN mode is strictly non-destructive. Tool "${toolCall.name}" is blocked. Present the architectural plan to the user and switch to /mode build to execute changes.`;
              this.conversationMessages.push({
                role: 'tool',
                content: blockedMsg,
                tool_call_id: toolCall.id,
                name: toolCall.name,
              });
              continue;
            }
          }

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
          toolsExecuted.push(toolCall.name);

          if (!toolRes.success) {
            this.failureLedger.recordFailure(toolCall.name, toolRes.error || toolRes.output, {
              toolName: toolCall.name,
              args: toolCall.arguments,
            });
          }
          await this.hookManager.trigger('after_tool', { toolCall, result: toolRes });

          // Track modified files
          if (typeof toolCall.arguments === 'object' && toolCall.arguments && (toolCall.arguments as any).path) {
            const targetPath = (toolCall.arguments as any).path;
            this.contextEngine.markFileActive(targetPath);
            if (['write_file', 'edit_file', 'patch_file', 'delete_file'].includes(toolCall.name)) {
              filesModified.add(targetPath);
            }
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
      if (this.stateMachine.canTransition('FAILED')) {
        this.stateMachine.transition('FAILED', err.message);
      }
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
      const currentState = this.stateMachine.getState();
      if (currentState !== 'COMPLETED' && currentState !== 'FAILED' && currentState !== 'CANCELLED') {
        if (this.stateMachine.canTransition('IDLE')) {
          this.stateMachine.transition('IDLE');
        }
      }
    }
  }

  private async handleConversationalTurn(): Promise<void> {
    let target = this.router.resolveTarget(this.activeModelTarget);
    const systemPrompt = `You are Berkelium Codex, a helpful, precise, and friendly AI coding assistant. Answer the user's conversational greeting or question concisely and clearly.`;

    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: 'message_started',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      role: 'assistant',
    });

    const acc = ResponseNormalizer.createAccumulator(target.modelId, target.providerId);
    const stream = target.provider.stream(this.conversationMessages, {
      model: target.modelId,
      systemPrompt,
      tools: [], // No tools exposed for pure conversational turns
      signal: this.abortController?.signal,
    });

    const sanitizer = new StreamSanitizer({
      onToken: (token) => {
        this.eventBus.emit({
          id: crypto.randomUUID(),
          type: 'token_received',
          sessionId: this.sessionId,
          timestamp: Date.now(),
          token,
        });
      },
      onReasoningStart: () => {
        this.eventBus.emit({
          id: crypto.randomUUID(),
          type: 'reasoning_started',
          sessionId: this.sessionId,
          timestamp: Date.now(),
        });
      },
      onReasoningEnd: () => {
        this.eventBus.emit({
          id: crypto.randomUUID(),
          type: 'reasoning_finished',
          sessionId: this.sessionId,
          timestamp: Date.now(),
        });
      },
    });

    for await (const chunk of stream) {
      acc.processChunk(chunk);
      if (chunk.type === 'token' && chunk.text) {
        sanitizer.feed(chunk.text);
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
    sanitizer.flush();

    const normalizedResponse = acc.toNormalizedResponse();
    const sanitized = sanitizeAssistantResponse(normalizedResponse.text || '');

    this.telemetry.recordTokenUsage(normalizedResponse.usage);
    this.conversationMessages.push({
      role: 'assistant',
      content: sanitized.content || undefined,
    });
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
