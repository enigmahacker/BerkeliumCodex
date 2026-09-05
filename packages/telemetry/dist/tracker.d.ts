import { SessionStats, TokenUsage } from './types.js';
export declare class TelemetryTracker {
    private stats;
    private startupStart;
    constructor(sessionId: string);
    markStartupComplete(): void;
    recordTokenUsage(usage: Partial<TokenUsage>): void;
    recordTokensSaved(tokensSaved: number): void;
    recordFirstTokenLatency(latencyMs: number): void;
    recordToolCall(toolName: string, latencyMs: number, success: boolean): void;
    recordRenderLatency(latencyMs: number): void;
    updateSystemMetrics(): void;
    getStats(): SessionStats;
}
//# sourceMappingURL=tracker.d.ts.map