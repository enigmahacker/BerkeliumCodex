import { EventBus } from '@berkelium/events';
import { PermissionPolicy } from '@berkelium/config';
import { PermissionRequest, PermissionCheckResult, PermissionPromptHandler, PermissionLevel, GranularCapability, GranularGrant } from './types.js';
export declare class PermissionEngine {
    private workspaceRoot;
    private policy;
    private permissionLevel;
    private eventBus?;
    private promptHandler?;
    private sessionApprovals;
    private sessionDenials;
    private granularGrants;
    private safeShellCommands;
    private dangerousShellPatterns;
    private sensitiveFilePatterns;
    constructor(workspaceRoot: string, policy: PermissionPolicy, eventBus?: EventBus, promptHandler?: PermissionPromptHandler);
    setPromptHandler(handler: PermissionPromptHandler): void;
    setPolicy(policy: PermissionPolicy): void;
    getPolicy(): PermissionPolicy;
    setPermissionLevel(level: PermissionLevel): void;
    getPermissionLevel(): PermissionLevel;
    setWorkspaceRoot(newRoot: string): void;
    getWorkspaceRoot(): string;
    isWithinWorkspace(targetPath: string): boolean;
    isSensitivePath(targetPath: string): {
        isSensitive: boolean;
        reason?: string;
    };
    isProtectedCommand(command: string): {
        isProtected: boolean;
        reason?: string;
    };
    grantCapability(grant: GranularGrant): void;
    revokeCapability(id: string): boolean;
    listGrants(): GranularGrant[];
    getGranularGrants(): GranularGrant[];
    hasGrant(capability: GranularCapability, target?: string): boolean;
    mapActionToCapability(category: string, action: string): GranularCapability;
    evaluate(request: PermissionRequest): Promise<boolean>;
    checkPolicy(request: PermissionRequest): PermissionCheckResult;
    private checkFilesystem;
    private checkShell;
    private checkGit;
    private checkNetwork;
    private checkMcp;
    private emitBlockedEvents;
    private loadPersistentGrants;
    private saveProjectGrant;
    private savePermanentGrant;
    private persistAllGrants;
}
//# sourceMappingURL=engine.d.ts.map