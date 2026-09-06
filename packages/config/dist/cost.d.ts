/**
 * @berkelium/config — Cost Controller
 *
 * Tracks token usage and estimates expenditure across cloud inference providers.
 * Enforces per-session, daily, or monthly spending caps with warnings and hard stops.
 */
import type { CostControlConfig } from './schema.js';
export declare class CostController {
    private config;
    private sessionPromptTokens;
    private sessionCompletionTokens;
    private sessionCostUsd;
    private requestCount;
    constructor(config: CostControlConfig);
    updateConfig(config: CostControlConfig): void;
    /**
     * Check if a new request is permitted under the configured budgets.
     */
    checkBudget(estimatedTokens?: number): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Record usage from a completed request and calculate cost.
     */
    recordUsage(providerId: string, modelId: string, promptTokens: number, completionTokens: number): {
        costUsd: number;
        totalCostUsd: number;
        warning?: string;
    };
    getUsage(): {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        costUsd: number;
        requestCount: number;
        budgetUsd?: number;
    };
    resetSession(): void;
    formatSummary(): string;
}
//# sourceMappingURL=cost.d.ts.map