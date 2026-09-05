import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ToolOrchestrator } from '@berkelium/tools';
import { ProviderRouter } from '@berkelium/providers';
export interface SubagentConfig {
    id: string;
    role: 'explorer' | 'coder' | 'tester' | 'reviewer' | string;
    modelAlias?: string;
    allowedTools: string[];
    systemPrompt: string;
}
export declare class SubagentManager {
    private orchestrator;
    private router;
    private eventBus?;
    private logger;
    private subagentConfigs;
    constructor(orchestrator: ToolOrchestrator, router: ProviderRouter, logger: Logger, eventBus?: EventBus);
    getSubagentConfig(role: string): SubagentConfig | undefined;
    runSubagentTask(role: string, task: string, sessionId: string): Promise<{
        success: boolean;
        result: string;
    }>;
}
//# sourceMappingURL=subagents.d.ts.map