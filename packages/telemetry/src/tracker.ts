import { PerformanceMetrics, SessionStats, TokenUsage } from './types.js';

export class TelemetryTracker {
  private stats: SessionStats;
  private startupStart: number;

  constructor(sessionId: string) {
    this.startupStart = performance.now();
    this.stats = {
      sessionId,
      startTime: Date.now(),
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        reasoningTokens: 0,
        cachedTokens: 0,
      },
      toolCallsCount: 0,
      toolFailuresCount: 0,
      modelRequestsCount: 0,
      latencies: {
        startupMs: 0,
        firstTokenMs: 0,
        totalDurationMs: 0,
        tokensPerSecond: 0,
        toolLatencyMs: {},
        filesystemLatencyMs: [],
        gitLatencyMs: [],
        memoryMb: 0,
        renderLatencyMs: [],
      },
    };
  }

  public markStartupComplete(): void {
    this.stats.latencies.startupMs = Math.round(performance.now() - this.startupStart);
  }

  public recordTokenUsage(usage: Partial<TokenUsage>): void {
    if (usage.promptTokens) this.stats.tokenUsage.promptTokens += usage.promptTokens;
    if (usage.completionTokens) this.stats.tokenUsage.completionTokens += usage.completionTokens;
    if (usage.reasoningTokens) this.stats.tokenUsage.reasoningTokens = (this.stats.tokenUsage.reasoningTokens || 0) + usage.reasoningTokens;
    if (usage.cachedTokens) this.stats.tokenUsage.cachedTokens = (this.stats.tokenUsage.cachedTokens || 0) + usage.cachedTokens;
    
    this.stats.tokenUsage.totalTokens =
      this.stats.tokenUsage.promptTokens + this.stats.tokenUsage.completionTokens;
  }

  public recordFirstTokenLatency(latencyMs: number): void {
    this.stats.latencies.firstTokenMs = Math.round(latencyMs);
  }

  public recordToolCall(toolName: string, latencyMs: number, success: boolean): void {
    this.stats.toolCallsCount++;
    if (!success) {
      this.stats.toolFailuresCount++;
    }

    if (!this.stats.latencies.toolLatencyMs[toolName]) {
      this.stats.latencies.toolLatencyMs[toolName] = [];
    }
    this.stats.latencies.toolLatencyMs[toolName].push(Math.round(latencyMs));

    if (toolName.startsWith('file_') || toolName.includes('read_') || toolName.includes('write_')) {
      this.stats.latencies.filesystemLatencyMs.push(Math.round(latencyMs));
    }
    if (toolName.startsWith('git_')) {
      this.stats.latencies.gitLatencyMs.push(Math.round(latencyMs));
    }
  }

  public recordRenderLatency(latencyMs: number): void {
    this.stats.latencies.renderLatencyMs.push(Math.round(latencyMs));
    if (this.stats.latencies.renderLatencyMs.length > 100) {
      this.stats.latencies.renderLatencyMs.shift();
    }
  }

  public updateSystemMetrics(): void {
    const mem = process.memoryUsage();
    this.stats.latencies.memoryMb = Math.round((mem.rss / (1024 * 1024)) * 10) / 10;
  }

  public getStats(): SessionStats {
    this.updateSystemMetrics();
    this.stats.latencies.totalDurationMs = Date.now() - this.stats.startTime;
    const durationSeconds = this.stats.latencies.totalDurationMs / 1000;
    if (durationSeconds > 0 && this.stats.tokenUsage.completionTokens > 0) {
      this.stats.latencies.tokensPerSecond =
        Math.round((this.stats.tokenUsage.completionTokens / durationSeconds) * 10) / 10;
    }
    return { ...this.stats };
  }
}
