/**
 * @berkelium/config — Privacy Engine
 *
 * Enforces privacy policies regarding which models and providers can receive
 * data. Controls whether prompts, codebase context, or secrets may leave
 * the local machine.
 *
 * Privacy Modes:
 * - local: Zero external inference. Only localhost (MLX, GGUF, local Ollama/LM Studio).
 * - balanced: Prefer local; prompt before routing to cloud if configured.
 * - hybrid: Local for context indexing & preparation, cloud for complex reasoning.
 * - cloud: Cloud-first inference allowed.
 */
import type { PrivacyConfig, PrivacyMode } from './schema.js';
export interface PrivacyCheckResult {
    allowed: boolean;
    requiresConfirmation: boolean;
    reason?: string;
    violations?: string[];
}
export declare class PrivacyEngine {
    private config;
    constructor(config: PrivacyConfig);
    getMode(): PrivacyMode;
    setMode(mode: PrivacyMode): void;
    getConfig(): PrivacyConfig;
    /**
     * Check whether a model invocation to a target provider is allowed under
     * the current privacy policy.
     *
     * @param providerId Provider ID (e.g., 'mlx', 'gguf', 'gemini', 'openrouter')
     * @param isLocal Whether the inference target runs strictly on localhost
     * @param content Optional prompt or message content to scan for sensitive patterns
     */
    evaluate(providerId: string, isLocal: boolean, content?: string): PrivacyCheckResult;
    /**
     * Format summary for display in CLI status and banners.
     */
    formatSummary(): string;
}
//# sourceMappingURL=privacy.d.ts.map