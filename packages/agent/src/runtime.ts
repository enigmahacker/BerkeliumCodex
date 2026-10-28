import { EventBus, TaskOutcomeStatus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import {
  ConfigManager,
  PromptEngine,
  PrivacyEngine,
  CostController,
  AgentEffort,
  CloudEscalationHandler,
} from '@berkelium/config';
import { ContextEngine, REPO_MAP_TOKEN_BUDGET, Tokenizer, ContextBreakdown, CompactionResult } from '@berkelium/context';
import { ToolOrchestrator, CheckpointManager } from '@berkelium/tools';
import {
  ProviderRouter,
  Message,
  NormalizedResponse,
  ResponseNormalizer,
  ResolvedModelTarget,
} from '@berkelium/providers';
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

const MUTATING_TOOL_NAMES = new Set([
  'write_file',
  'edit_file',
  'delete_file',
]);

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
  cloudEscalationHandler?: CloudEscalationHandler;
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
  private cloudEscalationHandler?: CloudEscalationHandler;
  private cloudEscalationApprovals = new Set<string>();
  private costController: CostController;
  private memory: ProjectMemory;
  private agentMode: AgentMode = 'build';
  private missionRunner: MissionRunner;
  private failureLedger: FailureLedger;

  private conversationMessages: Message[] = [];
  private relevantFilesContext = '';
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
    this.cloudEscalationHandler = options.cloudEscalationHandler;
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

  private async authorizeModelRequest(target: ResolvedModelTarget): Promise<void> {
    const fallbackLocalProviders = ['mlx', 'gguf', 'cpu', 'ollama', 'lmstudio'];
    const isLocal =
      target.provider.isLocal?.() ??
      fallbackLocalProviders.includes(target.providerId.toLowerCase());
    const lastUserMessage = this.conversationMessages
      .slice()
      .reverse()
      .find((message) => message.role === 'user');
    const privacyCheck = this.privacyEngine.evaluate(
      target.providerId,
      isLocal,
      lastUserMessage?.content
    );

    if (!privacyCheck.allowed) {
      throw new Error(`Privacy policy violation: ${privacyCheck.reason}`);
    }
    if (!privacyCheck.requiresConfirmation) {
      return;
    }

    const approvalKey = `${target.providerId}:${target.modelId}`;
    if (this.cloudEscalationApprovals.has(approvalKey)) {
      return;
    }

    const reason = privacyCheck.reason || 'Cloud escalation requires confirmation.';
    if (!this.cloudEscalationHandler) {
      throw new Error(
        `Privacy confirmation required but no confirmation handler is available. ${reason}`
      );
    }

    const approved = await this.cloudEscalationHandler({
      providerId: target.providerId,
      modelId: target.modelId,
      reason,
      message: `Privacy policy requires approval before sending this request to "${target.providerId}" (${target.modelId}). Approve cloud escalation for this session?`,
    });

    if (!approved) {
      throw new Error(`Privacy confirmation denied: ${reason}`);
    }
    this.cloudEscalationApprovals.add(approvalKey);
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
    this.orchestrator.setNonDestructiveMode(!AGENT_MODES[mode].isDestructiveAllowed);
    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: 'mode_changed',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      previousMode: prev,
      newMode: mode,
    });
  }

  private isToolAllowedInCurrentMode(toolName: string): boolean {
    return AGENT_MODES[this.agentMode].isDestructiveAllowed ||
      this.orchestrator.isToolAllowedInNonDestructiveMode(toolName);
  }

  private describeToolAction(toolName: string, args: any): string {
    const target = args?.path ?? args?.command ?? args?.url ?? args?.message;
    return target ? `${toolName}(${String(target).slice(0, 80)})` : toolName;
  }

  private emitTaskOutcome(params: {
    status: TaskOutcomeStatus;
    applied: string[];
    failed: string[];
    denied: string[];
    verified: boolean | null;
    skippedVerification?: boolean;
    checkpointId?: string;
  }): string {
    const {
      status,
      applied,
      failed,
      denied,
      verified,
      skippedVerification = false,
      checkpointId,
    } = params;
    const unresolved = [
      failed.length > 0 ? `${failed.length} failed` : '',
      denied.length > 0 ? `${denied.length} denied` : '',
    ]
      .filter(Boolean)
      .join(', ');

    let summary: string;
    switch (status) {
      case 'completed':
        summary =
          applied.length > 0
            ? `✓ Task completed: ${applied.length} action(s) applied${
                verified
                  ? skippedVerification
                    ? '; verification passed with skipped checks'
                    : '; verification passed'
                  : ''
              }.`
            : '✓ Task completed without tool actions.';
        break;
      case 'partial':
        summary = `⚠ Task partially completed: ${applied.length} action(s) applied; unresolved: ${unresolved}.`;
        break;
      case 'blocked':
        summary = `✗ Task blocked without applying changes: ${unresolved}.`;
        break;
      case 'failed':
        summary = '✗ Task failed.';
        break;
    }

    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: 'task_outcome',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      status,
      applied,
      failed,
      denied,
      verified,
      checkpointId,
      summary,
    });
    return summary;
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

  public resetConversation(): void {
    this.cancel();
    this.conversationMessages = [];
    this.relevantFilesContext = '';
    this.failureLedger.clear();
    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: 'status_updated',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      status: 'Conversation context reset',
    });
  }

  /**
   * Compacts context under token pressure, saving interrupted active state and restoring it cleanly.
   * Pass `force` to compact on demand (e.g. the /compact command) regardless of the current threshold.
   */
  public async compactContext(force = false): Promise<CompactionResult> {
    const interruptedState = this.stateMachine.getState();
    this.stateMachine.transition('COMPACTING_CONTEXT', 'Context compaction triggered by token pressure');
    const compaction = this.contextEngine.compactIfNeeded(this.conversationMessages, force ? 0 : 0.75);
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
    return compaction;
  }

  /**
   * Assembles the same layered system prompt used for model calls, for accurate
   * context accounting in /context and /tokens.
   */
  public async getContextBreakdown(): Promise<ContextBreakdown> {
    const systemPrompt = await this.buildSystemPrompt();
    const toolsText = JSON.stringify(this.orchestrator.getRegistry().getDefinitions());
    return this.contextEngine.getBreakdown(systemPrompt, this.conversationMessages, toolsText);
  }

  private async buildSystemPrompt(): Promise<string> {
    const promptLayers = PromptEngine.loadCustomPrompts(this.workspaceRoot);
    const repoMap = await this.contextEngine.getRepoMap(REPO_MAP_TOKEN_BUDGET);
    const memPrompt = this.memory.getContextPrompt(400);
    const failurePrompt = this.failureLedger.formatAvoidanceContext();
    const modePrompt = AGENT_MODES[this.agentMode]?.promptInstructions || '';

    const workspaceSections = [
      `Active Workspace: ${this.workspaceRoot}`,
      modePrompt,
      repoMap,
      this.relevantFilesContext,
      memPrompt,
      failurePrompt,
    ].filter((section) => section.length > 0);

    promptLayers.workspace = workspaceSections.join('\n\n');
    return PromptEngine.compose(promptLayers, this.workspaceRoot);
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
      const taskTimeoutSeconds = config.agent.timeout_seconds || 300;
      const taskDeadline = Date.now() + taskTimeoutSeconds * 1000;
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
      const appliedActions: string[] = [];
      const failedActions: string[] = [];
      const deniedActions: string[] = [];
      let recoveryCheckpointId: string | undefined;
      let checkpointAttempted = false;

      // Enter planning if actionable code task or debug or review
      if (['CODE_TASK', 'DEBUG', 'REVIEW'].includes(intent)) {
        this.stateMachine.transition('PLANNING', `Planning ${intent} execution`);
      }

      // Rank workspace files once per task; injected into every turn's workspace layer.
      this.relevantFilesContext = await this.contextEngine.getRelevantFilesContext(prompt);

      while (iterations < maxIterations) {
        iterations++;

        if (this.abortController?.signal.aborted) {
          if (this.stateMachine.canTransition('CANCELLED')) {
            this.stateMachine.transition('CANCELLED');
          }
          break;
        }

        if (Date.now() > taskDeadline) {
          throw new Error(
            `Task exceeded agent.timeout_seconds (${taskTimeoutSeconds}s) after ${iterations} iteration(s).`
          );
        }

        // Resolve Active Model Target before budgeting so compaction respects
        // the active model's context window, not the default 128k.
        const mode = (config as any).runtime?.mode || 'local';
        let target = this.router.resolveTarget(this.activeModelTarget);
        if (target.config?.context_length) {
          this.contextEngine.setMaxContextLimit(target.config.context_length);
        }

        // Build the exact prompt that will be sent so token pressure includes
        // system prompt and tool schemas, not just conversation messages.
        const systemPrompt = await this.buildSystemPrompt();
        const toolDefinitions = this.orchestrator.getRegistry().getDefinitions();
        const promptOverheadTokens =
          Tokenizer.countTokens(systemPrompt) +
          Tokenizer.countTokens(JSON.stringify(toolDefinitions));

        // Context Pressure Management:
        // ACTIVE_STATE -> COMPACTING_CONTEXT -> PREVIOUS_ACTIVE_STATE
        if (this.contextEngine.needsCompaction(this.conversationMessages, compactionThreshold, promptOverheadTokens)) {
          await this.compactContext();
        }

        if (mode === 'hybrid') {
          this.logger.debug(
            'Hybrid execution: Local context prepared → Reasoning target: ' +
              target.providerId +
              '/' +
              target.modelId
          );
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

        let selectedTarget = target;
        let acc = ResponseNormalizer.createAccumulator(target.modelId, target.providerId);
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
          const stream = this.router.streamWithFallback(
            this.conversationMessages,
            {
              model: target.modelId,
              systemPrompt,
              tools: toolDefinitions,
              signal: this.abortController.signal,
            },
            this.activeModelTarget,
            (candidate) => this.authorizeModelRequest(candidate),
            (candidate) => {
              selectedTarget = candidate;
              acc = ResponseNormalizer.createAccumulator(candidate.modelId, candidate.providerId);
              if (candidate.config?.context_length) {
                this.contextEngine.setMaxContextLimit(candidate.config.context_length);
              }
            }
          );

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
          selectedTarget.providerId,
          selectedTarget.modelId,
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
            AGENT_MODES[this.agentMode].isDestructiveAllowed &&
            isActionable &&
            (hasMutations || intent === 'DEBUG' || intent === 'REVIEW');

          let verified: boolean | null = null;
          let skippedVerification = false;
          if (shouldVerify) {
            this.stateMachine.transition('VERIFYING', 'Executing automated verification pipeline');
            const verifyReport = await this.verifier.runVerificationPipeline(this.sessionId, {
              intent,
              filesModified: Array.from(filesModified),
              toolsExecuted,
            });
            verified = verifyReport.passed;
            skippedVerification = verifyReport.results.some((result) => result.status === 'skipped');

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
                this.emitTaskOutcome({
                  status: 'failed',
                  applied: appliedActions,
                  failed: failedActions,
                  denied: deniedActions,
                  verified: false,
                  checkpointId: recoveryCheckpointId,
                });
                this.stateMachine.transition(
                  'FAILED',
                  `Verification failed and cannot be remediated (max remediation attempts reached): ${verifyReport.summary}`
                );
                break;
              }
            }
          }

          const hasUnresolved = failedActions.length > 0 || deniedActions.length > 0;
          const outcomeStatus: TaskOutcomeStatus = hasUnresolved
            ? appliedActions.length > 0
              ? 'partial'
              : 'blocked'
            : 'completed';
          const summary = this.emitTaskOutcome({
            status: outcomeStatus,
            applied: appliedActions,
            failed: failedActions,
            denied: deniedActions,
            verified,
            skippedVerification,
            checkpointId: recoveryCheckpointId,
          });
          this.stateMachine.transition('COMPLETED', summary);
          break;
        }

        // Execute Tool Calls
        this.stateMachine.transition('EXECUTING', 'Executing requested tool calls');
        for (const toolCall of normalizedResponse.toolCalls) {
          if (this.abortController?.signal.aborted) break;

          if (!this.isToolAllowedInCurrentMode(toolCall.name)) {
            const blockedMsg = `${this.agentMode.toUpperCase()} mode is strictly non-destructive. Tool "${toolCall.name}" is blocked. Present the analysis to the user and switch to /mode build to execute changes.`;
            deniedActions.push(this.describeToolAction(toolCall.name, toolCall.arguments));
            this.conversationMessages.push({
              role: 'tool',
              content: blockedMsg,
              tool_call_id: toolCall.id,
              name: toolCall.name,
            });
            continue;
          }

          await this.hookManager.trigger('before_tool', { toolCall });
          const toolStart = performance.now();

          if (
            !checkpointAttempted &&
            config.agent.auto_checkpoint &&
            MUTATING_TOOL_NAMES.has(toolCall.name)
          ) {
            checkpointAttempted = true;
            try {
              const checkpointManager = new CheckpointManager(this.workspaceRoot);
              if (checkpointManager.isGitRepository()) {
                const checkpoint = checkpointManager.createCheckpoint('auto_before_task');
                if (checkpoint.restorable) {
                  recoveryCheckpointId = checkpoint.id;
                  this.logger.debug(
                    `Created recovery checkpoint ${checkpoint.id} before "${toolCall.name}".`
                  );
                }
              }
            } catch (checkpointErr: any) {
              this.logger.debug(`Automatic recovery checkpoint failed: ${checkpointErr.message}`);
            }
          }

          const parsedToolArgs =
            typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments;
          const actionLabel = this.describeToolAction(toolCall.name, parsedToolArgs);

          const toolRes = await this.orchestrator.execute({
            callId: toolCall.id,
            toolName: toolCall.name,
            args: parsedToolArgs,
            sessionId: this.sessionId,
            signal: this.abortController?.signal,
          });

          const toolDuration = performance.now() - toolStart;
          this.telemetry.recordToolCall(toolCall.name, toolDuration, toolRes.success);
          toolsExecuted.push(toolCall.name);

          if (toolRes.success) {
            appliedActions.push(actionLabel);
          } else {
            const deniedCodes = ['PERMISSION_DENIED', 'NON_DESTRUCTIVE_MODE', 'NETWORK_BLOCKED'];
            if (deniedCodes.includes(toolRes.error || '')) {
              deniedActions.push(actionLabel);
            } else {
              failedActions.push(actionLabel);
            }
            this.failureLedger.recordFailure(toolCall.name, toolRes.error || toolRes.output, {
              toolName: toolCall.name,
              args: toolCall.arguments,
            });
          }
          await this.hookManager.trigger('after_tool', { toolCall, result: toolRes });

          // Track modified files only when the mutation actually succeeded
          if (typeof parsedToolArgs === 'object' && parsedToolArgs && (parsedToolArgs as any).path) {
            const targetPath = (parsedToolArgs as any).path;
            this.contextEngine.markFileActive(targetPath);
            if (
              toolRes.success &&
              ['write_file', 'edit_file', 'delete_file'].includes(toolCall.name)
            ) {
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
    const target = this.router.resolveTarget(this.activeModelTarget);
    const systemPrompt = `You are Berkelium Codex, a helpful, precise, and friendly AI coding assistant. Answer the user's conversational greeting or question concisely and clearly.`;

    this.eventBus.emit({
      id: crypto.randomUUID(),
      type: 'message_started',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      role: 'assistant',
    });

    let acc = ResponseNormalizer.createAccumulator(target.modelId, target.providerId);
    const stream = this.router.streamWithFallback(
      this.conversationMessages,
      {
        model: target.modelId,
        systemPrompt,
        tools: [], // No tools exposed for pure conversational turns
        signal: this.abortController?.signal,
      },
      this.activeModelTarget,
      (candidate) => this.authorizeModelRequest(candidate),
      (candidate) => {
        acc = ResponseNormalizer.createAccumulator(candidate.modelId, candidate.providerId);
        if (candidate.config?.context_length) {
          this.contextEngine.setMaxContextLimit(candidate.config.context_length);
        }
      }
    );

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
