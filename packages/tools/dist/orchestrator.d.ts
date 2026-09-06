import { EventBus } from '@berkelium/events';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { Logger } from '@berkelium/logging';
import { ToolRegistry } from './registry.js';
import { ToolExecutionResult } from './types.js';
export interface ToolExecutionRequest {
    callId: string;
    toolName: string;
    args: Record<string, unknown>;
    sessionId: string;
    signal?: AbortSignal;
}
export declare class ToolOrchestrator {
    private registry;
    private permissionEngine;
    private secretRedactor;
    private eventBus?;
    private logger;
    private workspaceRoot;
    constructor(registry: ToolRegistry, permissionEngine: PermissionEngine, secretRedactor: SecretRedactor, logger: Logger, workspaceRoot?: string, eventBus?: EventBus);
    getRegistry(): ToolRegistry;
    getPermissionEngine(): PermissionEngine;
    execute(req: ToolExecutionRequest): Promise<ToolExecutionResult>;
    registerDefaultTools(): void;
}
//# sourceMappingURL=orchestrator.d.ts.map