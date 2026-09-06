import { ReadFileTool } from './filesystem/read-file.js';
import { WriteFileTool } from './filesystem/write-file.js';
import { EditFileTool } from './filesystem/edit-file.js';
import { DeleteFileTool } from './filesystem/delete-file.js';
import { ListDirectoryTool } from './filesystem/list-directory.js';
import { SearchFilesTool } from './filesystem/search-files.js';
import { SearchTextTool } from './filesystem/search-text.js';
import { RunShellTool } from './shell/run-shell.js';
import { RunProcessTool } from './shell/run-process.js';
import { GitStatusTool } from './git/git-status.js';
import { GitDiffTool } from './git/git-diff.js';
import { GitLogTool } from './git/git-log.js';
import { GitBranchTool } from './git/git-branch.js';
import { GitCommitTool } from './git/git-commit.js';
import { InspectProjectTool } from './diagnostics/inspect-project.js';
import { DiagnosticsTool } from './diagnostics/diagnostics.js';
import { TestTool } from './diagnostics/test.js';
import { LintTool } from './diagnostics/lint.js';
import { BuildTool } from './diagnostics/build.js';
import { FetchUrlTool } from './web/fetch-url.js';
import { WebSearchTool } from './web/web-search.js';
import { NetworkController } from './network-controller.js';
export class ToolOrchestrator {
    registry;
    permissionEngine;
    secretRedactor;
    eventBus;
    logger;
    workspaceRoot;
    constructor(registry, permissionEngine, secretRedactor, logger, workspaceRoot = process.cwd(), eventBus) {
        this.registry = registry;
        this.permissionEngine = permissionEngine;
        this.secretRedactor = secretRedactor;
        this.logger = logger.child('orchestrator');
        this.workspaceRoot = workspaceRoot;
        this.eventBus = eventBus;
    }
    getRegistry() {
        return this.registry;
    }
    getPermissionEngine() {
        return this.permissionEngine;
    }
    async execute(req) {
        const startTime = performance.now();
        const tool = this.registry.get(req.toolName);
        // 1. Emit tool requested
        this.eventBus?.emit({
            id: crypto.randomUUID(),
            type: 'tool_requested',
            sessionId: req.sessionId,
            timestamp: Date.now(),
            callId: req.callId,
            toolName: req.toolName,
            args: req.args,
        });
        if (!tool) {
            const errorMsg = `Tool "${req.toolName}" is not registered.`;
            this.logger.error(errorMsg);
            this.eventBus?.emit({
                id: crypto.randomUUID(),
                type: 'tool_failed',
                sessionId: req.sessionId,
                timestamp: Date.now(),
                callId: req.callId,
                toolName: req.toolName,
                error: errorMsg,
                durationMs: 0,
            });
            return { success: false, output: errorMsg, error: 'TOOL_NOT_FOUND' };
        }
        // 2. Schema Validation
        let parsedArgs = req.args;
        try {
            parsedArgs = tool.schema.parse(req.args);
        }
        catch (validationErr) {
            const msg = `Invalid arguments for tool "${req.toolName}": ${validationErr.message}`;
            this.logger.warn(msg);
            this.eventBus?.emit({
                id: crypto.randomUUID(),
                type: 'tool_failed',
                sessionId: req.sessionId,
                timestamp: Date.now(),
                callId: req.callId,
                toolName: req.toolName,
                error: msg,
                durationMs: Math.round(performance.now() - startTime),
            });
            return { success: false, output: msg, error: 'INVALID_ARGUMENTS' };
        }
        // 2b. Tool-Layer Network Enforcement
        if ((tool.metadata.category === 'web' || tool.metadata.network) &&
            !NetworkController.getInstance().isNetworkAllowed()) {
            const blockedMsg = 'NETWORK: BLOCKED. Outbound network access is disabled by policy.';
            this.logger.warn(blockedMsg);
            return { success: false, output: blockedMsg, error: 'NETWORK_BLOCKED' };
        }
        // 3. Permission Check
        const targetDesc = String(parsedArgs.path || parsedArgs.command || parsedArgs.url || parsedArgs.message || req.toolName);
        const hasPermission = await this.permissionEngine.evaluate({
            id: req.callId,
            category: tool.metadata.category,
            action: tool.metadata.name,
            target: targetDesc,
            risk: tool.metadata.risk,
            description: `Execute tool ${tool.metadata.name} on ${targetDesc}`,
            metadata: parsedArgs,
        });
        if (!hasPermission) {
            const deniedMsg = `Permission denied for tool "${req.toolName}" on target "${targetDesc}".`;
            this.logger.warn(deniedMsg);
            this.eventBus?.emit({
                id: crypto.randomUUID(),
                type: 'tool_failed',
                sessionId: req.sessionId,
                timestamp: Date.now(),
                callId: req.callId,
                toolName: req.toolName,
                error: deniedMsg,
                durationMs: Math.round(performance.now() - startTime),
            });
            return { success: false, output: deniedMsg, error: 'PERMISSION_DENIED' };
        }
        // 4. Emit tool started
        this.eventBus?.emit({
            id: crypto.randomUUID(),
            type: 'tool_started',
            sessionId: req.sessionId,
            timestamp: Date.now(),
            callId: req.callId,
            toolName: req.toolName,
            args: parsedArgs,
        });
        // 5. Execution
        const context = {
            workspaceRoot: this.workspaceRoot,
            sessionId: req.sessionId,
            signal: req.signal,
            onOutput: (chunk) => {
                const redacted = this.secretRedactor.redact(chunk).redacted;
                this.eventBus?.emit({
                    id: crypto.randomUUID(),
                    type: 'tool_output',
                    sessionId: req.sessionId,
                    timestamp: Date.now(),
                    callId: req.callId,
                    toolName: req.toolName,
                    output: redacted,
                    stream: true,
                });
            },
        };
        try {
            const result = await tool.execute(parsedArgs, context);
            const durationMs = Math.round(performance.now() - startTime);
            // 6. Secret Redaction on final output
            const { redacted } = this.secretRedactor.redact(result.output || '');
            const sanitizedResult = {
                ...result,
                output: redacted,
            };
            if (result.success) {
                this.eventBus?.emit({
                    id: crypto.randomUUID(),
                    type: 'tool_completed',
                    sessionId: req.sessionId,
                    timestamp: Date.now(),
                    callId: req.callId,
                    toolName: req.toolName,
                    result: sanitizedResult.data || sanitizedResult.output,
                    durationMs,
                });
            }
            else {
                this.eventBus?.emit({
                    id: crypto.randomUUID(),
                    type: 'tool_failed',
                    sessionId: req.sessionId,
                    timestamp: Date.now(),
                    callId: req.callId,
                    toolName: req.toolName,
                    error: result.error || result.output,
                    durationMs,
                });
            }
            return sanitizedResult;
        }
        catch (execErr) {
            const durationMs = Math.round(performance.now() - startTime);
            const errorMsg = `Tool execution threw exception: ${execErr.message}`;
            this.logger.error(errorMsg, execErr);
            this.eventBus?.emit({
                id: crypto.randomUUID(),
                type: 'tool_failed',
                sessionId: req.sessionId,
                timestamp: Date.now(),
                callId: req.callId,
                toolName: req.toolName,
                error: errorMsg,
                durationMs,
            });
            return {
                success: false,
                output: errorMsg,
                error: execErr.message,
            };
        }
    }
    registerDefaultTools() {
        this.registry.registerMany([
            new ReadFileTool(),
            new WriteFileTool(),
            new EditFileTool(),
            new DeleteFileTool(),
            new ListDirectoryTool(),
            new SearchFilesTool(),
            new SearchTextTool(),
            new RunShellTool(),
            new RunProcessTool(),
            new GitStatusTool(),
            new GitDiffTool(),
            new GitLogTool(),
            new GitBranchTool(),
            new GitCommitTool(),
            new InspectProjectTool(),
            new DiagnosticsTool(),
            new TestTool(),
            new LintTool(),
            new BuildTool(),
            new FetchUrlTool(),
            new WebSearchTool(),
        ]);
    }
}
//# sourceMappingURL=orchestrator.js.map