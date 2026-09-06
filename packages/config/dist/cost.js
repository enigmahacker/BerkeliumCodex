/**
 * @berkelium/config — Cost Controller
 *
 * Tracks token usage and estimates expenditure across cloud inference providers.
 * Enforces per-session, daily, or monthly spending caps with warnings and hard stops.
 */
const DEFAULT_PRICING = {
    gemini: { inputUsdPerMillion: 0.10, outputUsdPerMillion: 0.40 },
    openrouter: { inputUsdPerMillion: 0.20, outputUsdPerMillion: 0.80 },
    groq: { inputUsdPerMillion: 0.59, outputUsdPerMillion: 0.79 },
    nvidia: { inputUsdPerMillion: 0.70, outputUsdPerMillion: 0.90 },
    huggingface: { inputUsdPerMillion: 0.50, outputUsdPerMillion: 0.80 },
    mlx: { inputUsdPerMillion: 0.0, outputUsdPerMillion: 0.0 },
    gguf: { inputUsdPerMillion: 0.0, outputUsdPerMillion: 0.0 },
    ollama: { inputUsdPerMillion: 0.0, outputUsdPerMillion: 0.0 },
    lmstudio: { inputUsdPerMillion: 0.0, outputUsdPerMillion: 0.0 },
    cpu: { inputUsdPerMillion: 0.0, outputUsdPerMillion: 0.0 },
};
export class CostController {
    config;
    sessionPromptTokens = 0;
    sessionCompletionTokens = 0;
    sessionCostUsd = 0;
    requestCount = 0;
    constructor(config) {
        this.config = { ...config };
    }
    updateConfig(config) {
        this.config = { ...config };
    }
    /**
     * Check if a new request is permitted under the configured budgets.
     */
    checkBudget(estimatedTokens = 0) {
        if (!this.config.enabled) {
            return { allowed: true };
        }
        if (this.config.max_tokens_per_request &&
            estimatedTokens > this.config.max_tokens_per_request) {
            return {
                allowed: false,
                reason: `Estimated token count (${estimatedTokens}) exceeds max_tokens_per_request limit (${this.config.max_tokens_per_request}).`,
            };
        }
        if (this.config.session_budget_usd) {
            if (this.sessionCostUsd >= this.config.session_budget_usd) {
                return {
                    allowed: false,
                    reason: `Session budget limit reached: $${this.sessionCostUsd.toFixed(4)} of $${this.config.session_budget_usd.toFixed(2)}.`,
                };
            }
        }
        return { allowed: true };
    }
    /**
     * Record usage from a completed request and calculate cost.
     */
    recordUsage(providerId, modelId, promptTokens, completionTokens) {
        this.sessionPromptTokens += promptTokens;
        this.sessionCompletionTokens += completionTokens;
        this.requestCount++;
        const pricing = DEFAULT_PRICING[providerId.toLowerCase()] || {
            inputUsdPerMillion: 0.50,
            outputUsdPerMillion: 1.50,
        };
        const costUsd = (promptTokens / 1_000_000) * pricing.inputUsdPerMillion +
            (completionTokens / 1_000_000) * pricing.outputUsdPerMillion;
        this.sessionCostUsd += costUsd;
        let warning;
        if (this.config.enabled && this.config.session_budget_usd) {
            const pct = (this.sessionCostUsd / this.config.session_budget_usd) * 100;
            if (pct >= this.config.warn_threshold_percent && pct < 100) {
                warning = `Warning: Session cost ($${this.sessionCostUsd.toFixed(4)}) has reached ${pct.toFixed(0)}% of the $${this.config.session_budget_usd.toFixed(2)} budget.`;
            }
        }
        return {
            costUsd,
            totalCostUsd: this.sessionCostUsd,
            warning,
        };
    }
    getUsage() {
        return {
            promptTokens: this.sessionPromptTokens,
            completionTokens: this.sessionCompletionTokens,
            totalTokens: this.sessionPromptTokens + this.sessionCompletionTokens,
            costUsd: this.sessionCostUsd,
            requestCount: this.requestCount,
            budgetUsd: this.config.session_budget_usd,
        };
    }
    resetSession() {
        this.sessionPromptTokens = 0;
        this.sessionCompletionTokens = 0;
        this.sessionCostUsd = 0;
        this.requestCount = 0;
    }
    formatSummary() {
        const totalTokens = this.sessionPromptTokens + this.sessionCompletionTokens;
        const cost = `$${this.sessionCostUsd.toFixed(4)}`;
        const budget = this.config.session_budget_usd
            ? ` / $${this.config.session_budget_usd.toFixed(2)}`
            : '';
        return `Tokens: ${totalTokens.toLocaleString()} (${this.sessionPromptTokens} in / ${this.sessionCompletionTokens} out) | Cost: ${cost}${budget}`;
    }
}
//# sourceMappingURL=cost.js.map