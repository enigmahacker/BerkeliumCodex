export interface CheckpointRecord {
    id: string;
    name: string;
    timestamp: number;
    commit: string;
    hasDiff: boolean;
    modifiedFiles: string[];
    untrackedFiles: string[];
    patchPath?: string;
}
export declare class CheckpointManager {
    private workspaceRoot;
    private checkpointsDir;
    constructor(workspaceRoot: string);
    createCheckpoint(name?: string): CheckpointRecord;
    listCheckpoints(): CheckpointRecord[];
    restoreCheckpoint(id: string): {
        success: boolean;
        message: string;
    };
    undo(): {
        success: boolean;
        message: string;
    };
    formatCheckpoints(): string;
}
//# sourceMappingURL=checkpoint-manager.d.ts.map