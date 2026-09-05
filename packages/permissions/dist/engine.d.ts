import { EventBus } from '@berkelium/events';
import { PermissionPolicy } from '@berkelium/config';
import { PermissionRequest, PermissionCheckResult, PermissionPromptHandler } from './types.js';
export declare class PermissionEngine {
    private workspaceRoot;
    private policy;
    private eventBus?;
    private promptHandler?;
    private sessionApprovals;
    private safeShellCommands;
    private dangerousShellPatterns;
    private sensitiveFilePatterns;
    constructor(workspaceRoot: string, policy: PermissionPolicy, eventBus?: EventBus, promptHandler?: PermissionPromptHandler);
    setPromptHandler(handler: PermissionPromptHandler): void;
    setPolicy(policy: PermissionPolicy): void;
    getWorkspaceRoot(): string;
    isWithinWorkspace(targetPath: string): boolean;
    isSensitivePath(targetPath: string): {
        isSensitive: boolean;
        reason?: string;
    };
    evaluate(request: PermissionRequest): Promise<boolean>;
    checkPolicy(request: PermissionRequest): PermissionCheckResult;
    private checkFilesystem;
    private checkShell;
    private checkGit;
    private checkNetwork;
    private checkMcp;
}
//# sourceMappingURL=engine.d.ts.map