import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ToolOrchestrator } from '@berkelium/tools';
import { ProviderRouter } from '@berkelium/providers';
import { Verifier } from './verifier.js';
export interface MissionTask {
    id: string;
    objective: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    toolsUsed: string[];
    filesModified: string[];
    verification?: string;
    result?: string;
    error?: string;
    retries: number;
}
export interface MissionReport {
    id: string;
    goal: string;
    status: 'completed' | 'failed' | 'cancelled';
    tasks: MissionTask[];
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalDurationMs: number;
    summary: string;
}
export interface MissionOptions {
    maxIterations?: number;
    maxToolCalls?: number;
    maxExecutionTimeMs?: number;
    maxRetries?: number;
    signal?: AbortSignal;
}
export declare class MissionRunner {
    private orchestrator;
    private router;
    private verifier;
    private logger;
    private eventBus;
    private workspaceRoot;
    constructor(orchestrator: ToolOrchestrator, router: ProviderRouter, verifier: Verifier, logger: Logger, eventBus: EventBus, workspaceRoot: string);
    /**
     * Decompose a goal into structured tasks.
     */
    decomposeGoal(goal: string): MissionTask[];
    /**
     * Execute autonomous mission with bounded iterations and retry controls.
     */
    executeMission(goal: string, activeModel: string, options?: MissionOptions): Promise<MissionReport>;
}
//# sourceMappingURL=mission.d.ts.map