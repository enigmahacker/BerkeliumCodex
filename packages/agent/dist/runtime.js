import { PromptEngine, PrivacyEngine, CostController } from '@berkelium/config';
import { ResponseNormalizer } from '@berkelium/providers';
import { TelemetryTracker } from '@berkelium/telemetry';
import { HookManager } from '@berkelium/plugins';
import { AgentStateMachine } from './state-machine.js';
import { SessionManager } from './session.js';
import { ProjectMemory } from './memory.js';
import { Verifier } from './verifier.js';
import { SubagentManager } from './subagents.js';
export class AgentRuntime {
    sessionId;
    workspaceRoot;
    configManager;
    router;
    orchestrator;
    contextEngine;
    logger;
    eventBus;
    hookManager;
    sessionManager;
    telemetry;
    stateMachine;
    verifier;
    subagents;
    privacyEngine;
    costController;
    memory;
    conversationMessages = [];
    activeModelTarget;
    abortController = null;
    isRunning = false;
    constructor(options) {
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
        this.activeModelTarget = this.configManager.getConfig().default_model;
        // Register all default tools into orchestrator
        this.orchestrator.registerDefaultTools();
    }
    getMemory() {
        return this.memory;
    }
    getPrivacyEngine() {
        return this.privacyEngine;
    }
    getCostController() {
        return this.costController;
    }
    getSessionId() {
        return this.sessionId;
    }
    getState() {
        return this.stateMachine.getState();
    }
    getActiveModel() {
        return this.activeModelTarget;
    }
    setActiveModel(modelOrAlias) {
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
    getTelemetry() {
        return this.telemetry;
    }
    getSessionHistory() {
        return this.conversationMessages;
    }
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.stateMachine.transition('CANCELLED', 'Operation cancelled by user');
        setTimeout(() => {
            this.stateMachine.transition('IDLE');
        }, 100);
    }
    async executeTask(prompt) {
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
                    const tokensSaved = compaction.tokensSaved ?? (compaction.tokensBefore - compaction.tokensAfter);
                    this.telemetry.recordTokensSaved(tokensSaved);
                    this.eventBus.emit({
                        id: crypto.randomUUID(),
                        type: 'context_compacted',
                        sessionId: this.sessionId,
                        timestamp: Date.now(),
                        tokensBefore: compaction.tokensBefore,
                        tokensAfter: compaction.tokensAfter,
                        reductionPercentage: Math.round((tokensSaved / Math.max(1, compaction.tokensBefore)) * 100),
                    });
                }
                // 2. Build Layered System Prompt with Workspace Context & Project Memory
                const promptLayers = PromptEngine.loadCustomPrompts(this.workspaceRoot);
                const repoMap = await this.contextEngine.getRepoMap(800);
                const memPrompt = this.memory.getContextPrompt(400);
                promptLayers.workspace = `Active Workspace: ${this.workspaceRoot}\n\n${repoMap}${memPrompt ? '\n\n' + memPrompt : ''}`;
                const systemPrompt = PromptEngine.compose(promptLayers, this.workspaceRoot);
                // 3. Resolve Active Model Target & Mode Execution
                const mode = config.runtime?.mode || 'local';
                let target = this.router.resolveTarget(this.activeModelTarget);
                if (mode === 'hybrid') {
                    this.logger.debug('Hybrid execution: Local context prepared → Reasoning target: ' +
                        target.providerId +
                        '/' +
                        target.modelId);
                }
                const toolDefinitions = this.orchestrator.getRegistry().getDefinitions();
                // 3b. Enforce Privacy & Cost Policies
                const isLocal = ['mlx', 'gguf', 'cpu', 'ollama', 'lmstudio'].includes(target.providerId.toLowerCase());
                const lastUserMessage = this.conversationMessages.slice().reverse().find(m => m.role === 'user');
                const privacyCheck = this.privacyEngine.evaluate(target.providerId, isLocal, lastUserMessage?.content);
                if (!privacyCheck.allowed) {
                    throw new Error(`Privacy policy violation: ${privacyCheck.reason}`);
                }
                const budgetCheck = this.costController.checkBudget();
                if (!budgetCheck.allowed) {
                    throw new Error(`Cost budget exceeded: ${budgetCheck.reason}`);
                }
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
                        }
                        else if (chunk.type === 'reasoning' && chunk.reasoning) {
                            this.eventBus.emit({
                                id: crypto.randomUUID(),
                                type: 'reasoning_token_received',
                                sessionId: this.sessionId,
                                timestamp: Date.now(),
                                token: chunk.reasoning,
                            });
                        }
                    }
                }
                catch (streamErr) {
                    if (this.abortController?.signal.aborted) {
                        this.stateMachine.transition('CANCELLED');
                        break;
                    }
                    throw streamErr;
                }
                const normalizedResponse = acc.toNormalizedResponse();
                this.telemetry.recordTokenUsage(normalizedResponse.usage);
                this.costController.recordUsage(target.providerId, target.modelId, normalizedResponse.usage.promptTokens, normalizedResponse.usage.completionTokens);
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
                    if (this.abortController?.signal.aborted)
                        break;
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
                    if (typeof toolCall.arguments === 'object' && toolCall.arguments && toolCall.arguments.path) {
                        this.contextEngine.markFileActive(toolCall.arguments.path);
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
        }
        catch (err) {
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
        }
        finally {
            this.isRunning = false;
            this.abortController = null;
            if (this.stateMachine.getState() !== 'COMPLETED' && this.stateMachine.getState() !== 'FAILED') {
                this.stateMachine.transition('IDLE');
            }
        }
    }
    async resumeFromSession(sessionData) {
        this.conversationMessages = sessionData.messages;
        this.activeModelTarget = sessionData.model;
        this.telemetry.recordTokenUsage(sessionData.tokenUsage);
        this.logger.info(`Resumed session ${sessionData.id} with ${sessionData.messages.length} messages.`);
    }
    async saveSessionState() {
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
//# sourceMappingURL=runtime.js.map