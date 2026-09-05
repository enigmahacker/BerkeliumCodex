export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens?: number;
    cachedTokens?: number;
}
export interface PerformanceMetrics {
    startupMs: number;
    firstTokenMs: number;
    totalDurationMs: number;
    tokensPerSecond: number;
    toolLatencyMs: Record<string, number[]>;
    filesystemLatencyMs: number[];
    gitLatencyMs: number[];
    memoryMb: number;
    cpuPercent?: number;
    renderLatencyMs: number[];
}
export interface SessionStats {
    sessionId: string;
    startTime: number;
    endTime?: number;
    tokenUsage: TokenUsage;
    toolCallsCount: number;
    toolFailuresCount: number;
    modelRequestsCount: number;
    latencies: PerformanceMetrics;
}
//# sourceMappingURL=types.d.ts.map