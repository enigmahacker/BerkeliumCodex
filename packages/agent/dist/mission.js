import { ResponseNormalizer } from '@berkelium/providers';
export class MissionRunner {
    orchestrator;
    router;
    verifier;
    logger;
    eventBus;
    workspaceRoot;
    constructor(orchestrator, router, verifier, logger, eventBus, workspaceRoot) {
        this.orchestrator = orchestrator;
        this.router = router;
        this.verifier = verifier;
        this.logger = logger.child('mission');
        this.eventBus = eventBus;
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Decompose a goal into structured tasks.
     */
    decomposeGoal(goal) {
        const clean = goal.trim();
        // If goal mentions multiple steps or "and", or specific known workflows
        const subTasks = [];
        if (clean.toLowerCase().includes('fix all failing tests') || clean.toLowerCase().includes('fix tests')) {
            subTasks.push('Run workspace test suite and capture all failing tests');
            subTasks.push('Analyze failures and trace root causes across affected files');
            subTasks.push('Apply surgical fixes to resolve test failures');
            subTasks.push('Run test suite verification to confirm zero regressions');
        }
        else if (clean.toLowerCase().includes('refactor') || clean.toLowerCase().includes('clean up')) {
            subTasks.push('Inspect target architecture and identify structural dependencies');
            subTasks.push('Create safe checkpoint of current working tree');
            subTasks.push('Apply incremental refactoring without altering external behavior');
            subTasks.push('Verify changes with test suite and typecheck');
        }
        else if (clean.includes(';') || clean.includes('\n')) {
            const parts = clean.split(/[;\n]+/).map((s) => s.trim()).filter(Boolean);
            subTasks.push(...parts);
        }
        else if (clean.toLowerCase().includes(' and ')) {
            const parts = clean.split(/\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
            subTasks.push(...parts);
        }
        else {
            subTasks.push(`Understand and inspect requirements for: ${clean}`);
            subTasks.push(`Execute implementation: ${clean}`);
            subTasks.push(`Verify results and run automated checks`);
        }
        return subTasks.map((obj, idx) => ({
            id: `task_${idx + 1}`,
            objective: obj,
            status: 'pending',
            toolsUsed: [],
            filesModified: [],
            retries: 0,
        }));
    }
    /**
     * Execute autonomous mission with bounded iterations and retry controls.
     */
    async executeMission(goal, activeModel, options = {}) {
        const missionId = `mis_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const startTime = performance.now();
        const tasks = this.decomposeGoal(goal);
        const maxIterations = options.maxIterations ?? 10;
        const maxToolCalls = options.maxToolCalls ?? 30;
        const maxExecutionTimeMs = options.maxExecutionTimeMs ?? 180000;
        const maxRetries = options.maxRetries ?? 3;
        this.logger.info(`Starting autonomous mission [${missionId}]: "${goal}" (${tasks.length} subtasks)`);
        this.eventBus.emit({
            id: crypto.randomUUID(),
            type: 'mission_started',
            sessionId: missionId,
            timestamp: Date.now(),
            goal,
            taskCount: tasks.length,
        });
        let overallStatus = 'completed';
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (options.signal?.aborted) {
                task.status = 'skipped';
                overallStatus = 'cancelled';
                continue;
            }
            task.status = 'in_progress';
            this.logger.info(`[${missionId}] Executing Task ${i + 1}/${tasks.length}: "${task.objective}"`);
            this.eventBus.emit({
                id: crypto.randomUUID(),
                type: 'mission_task_started',
                sessionId: missionId,
                timestamp: Date.now(),
                taskId: task.id,
                objective: task.objective,
            });
            const taskStartTime = performance.now();
            let taskSuccess = false;
            let toolCallCount = 0;
            while (task.retries <= maxRetries && !taskSuccess) {
                if (options.signal?.aborted) {
                    task.status = 'skipped';
                    overallStatus = 'cancelled';
                    break;
                }
                if (performance.now() - startTime > maxExecutionTimeMs) {
                    task.status = 'failed';
                    task.error = `Mission exceeded maximum execution time limit (${maxExecutionTimeMs}ms)`;
                    overallStatus = 'failed';
                    break;
                }
                try {
                    // Resolve provider target
                    const target = this.router.resolveTarget(activeModel);
                    const prompt = `You are executing Task ${i + 1}/${tasks.length} of an autonomous mission.
Mission Goal: ${goal}
Current Task Objective: ${task.objective}
Workspace: ${this.workspaceRoot}
Previous Tasks Completed: ${tasks.slice(0, i).filter(t => t.status === 'completed').map(t => t.objective).join('; ') || 'None'}

Complete this objective using appropriate tools. Once the objective is met, provide a concise result summary.`;
                    const messages = [{ role: 'user', content: prompt }];
                    const toolDefs = this.orchestrator.getRegistry().getDefinitions();
                    let iterations = 0;
                    while (iterations < maxIterations && toolCallCount < maxToolCalls) {
                        iterations++;
                        if (options.signal?.aborted)
                            break;
                        const acc = ResponseNormalizer.createAccumulator(target.modelId, target.providerId);
                        const stream = target.provider.stream(messages, {
                            model: target.modelId,
                            tools: toolDefs,
                            signal: options.signal,
                        });
                        for await (const chunk of stream) {
                            acc.processChunk(chunk);
                        }
                        const response = acc.toNormalizedResponse();
                        messages.push({
                            role: 'assistant',
                            content: response.text || undefined,
                            tool_calls: response.toolCalls.length > 0 ? response.toolCalls : undefined,
                        });
                        if (!response.toolCalls || response.toolCalls.length === 0) {
                            task.result = response.text || 'Task completed';
                            taskSuccess = true;
                            break;
                        }
                        // Execute tools
                        for (const tc of response.toolCalls) {
                            toolCallCount++;
                            if (!task.toolsUsed.includes(tc.name)) {
                                task.toolsUsed.push(tc.name);
                            }
                            const args = typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments;
                            if (args?.path && typeof args.path === 'string') {
                                if (!task.filesModified.includes(args.path) && ['write_file', 'edit_file', 'patch_file'].includes(tc.name)) {
                                    task.filesModified.push(args.path);
                                }
                            }
                            const res = await this.orchestrator.execute({
                                callId: tc.id,
                                toolName: tc.name,
                                args,
                                sessionId: missionId,
                                signal: options.signal,
                            });
                            messages.push({
                                role: 'tool',
                                content: res.output,
                                tool_call_id: tc.id,
                                name: tc.name,
                            });
                        }
                    }
                    if (taskSuccess) {
                        task.status = 'completed';
                        break;
                    }
                    else {
                        task.retries++;
                        if (task.retries > maxRetries) {
                            task.status = 'failed';
                            task.error = `Task exceeded max retries (${maxRetries})`;
                            overallStatus = 'failed';
                        }
                    }
                }
                catch (taskErr) {
                    task.retries++;
                    if (task.retries > maxRetries) {
                        task.status = 'failed';
                        task.error = taskErr.message;
                        overallStatus = 'failed';
                        break;
                    }
                }
            }
            // If files were modified, run verification check
            if (task.filesModified.length > 0) {
                try {
                    const verifyReport = await this.verifier.runVerificationPipeline(missionId);
                    task.verification = verifyReport.passed ? 'PASS' : `FAIL: ${verifyReport.summary}`;
                }
                catch {
                    task.verification = 'VERIFICATION_SKIPPED';
                }
            }
            this.eventBus.emit({
                id: crypto.randomUUID(),
                type: 'mission_task_completed',
                sessionId: missionId,
                timestamp: Date.now(),
                taskId: task.id,
                status: task.status,
                result: task.result,
            });
        }
        const durationMs = Math.round(performance.now() - startTime);
        const completedCount = tasks.filter((t) => t.status === 'completed').length;
        const failedCount = tasks.filter((t) => t.status === 'failed').length;
        const report = {
            id: missionId,
            goal,
            status: overallStatus,
            tasks,
            totalTasks: tasks.length,
            completedTasks: completedCount,
            failedTasks: failedCount,
            totalDurationMs: durationMs,
            summary: `Mission "${goal}" finished with status ${overallStatus.toUpperCase()} (${completedCount}/${tasks.length} tasks completed in ${(durationMs / 1000).toFixed(1)}s)`,
        };
        this.eventBus.emit({
            id: crypto.randomUUID(),
            type: 'mission_completed',
            sessionId: missionId,
            timestamp: Date.now(),
            report,
        });
        return report;
    }
}
//# sourceMappingURL=mission.js.map