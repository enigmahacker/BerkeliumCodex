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
export class PrivacyEngine {
    config;
    constructor(config) {
        this.config = { ...config };
    }
    getMode() {
        return this.config.mode;
    }
    setMode(mode) {
        this.config.mode = mode;
    }
    getConfig() {
        return { ...this.config };
    }
    /**
     * Check whether a model invocation to a target provider is allowed under
     * the current privacy policy.
     *
     * @param providerId Provider ID (e.g., 'mlx', 'gguf', 'gemini', 'openrouter')
     * @param isLocal Whether the inference target runs strictly on localhost
     * @param content Optional prompt or message content to scan for sensitive patterns
     */
    evaluate(providerId, isLocal, content) {
        const mode = this.config.mode;
        // Scan for sensitive patterns if content is provided
        const violations = [];
        if (content && this.config.sensitive_patterns.length > 0) {
            for (const pattern of this.config.sensitive_patterns) {
                try {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(content)) {
                        violations.push(`Matches sensitive pattern: "${pattern}"`);
                    }
                }
                catch {
                    if (content.toLowerCase().includes(pattern.toLowerCase())) {
                        violations.push(`Contains sensitive substring: "${pattern}"`);
                    }
                }
            }
        }
        // Local-only mode: strictly forbid any non-local destination
        if (mode === 'local') {
            if (!isLocal) {
                return {
                    allowed: false,
                    requiresConfirmation: false,
                    reason: `Privacy mode is set to "local". Outbound transmission to cloud provider "${providerId}" is strictly prohibited.`,
                    violations,
                };
            }
            return { allowed: true, requiresConfirmation: false, violations };
        }
        // If sensitive patterns matched and destination is external
        if (!isLocal && violations.length > 0) {
            return {
                allowed: false,
                requiresConfirmation: false,
                reason: `Data contains patterns marked sensitive that cannot be sent to cloud provider "${providerId}".`,
                violations,
            };
        }
        // Balanced mode: local preferred, prompt on cloud escalation if enabled
        if (mode === 'balanced') {
            if (!isLocal && this.config.cloud_escalation_prompt) {
                return {
                    allowed: true,
                    requiresConfirmation: true,
                    reason: `Privacy mode is "balanced": escalation to cloud provider "${providerId}" requires confirmation.`,
                    violations,
                };
            }
            return { allowed: true, requiresConfirmation: false, violations };
        }
        // Hybrid mode: allow external if explicitly permitted or for reasoning
        if (mode === 'hybrid') {
            return { allowed: true, requiresConfirmation: false, violations };
        }
        // Cloud mode: cloud-first
        return { allowed: true, requiresConfirmation: false, violations };
    }
    /**
     * Format summary for display in CLI status and banners.
     */
    formatSummary() {
        const modeDesc = {
            local: 'STRICT LOCAL (Zero data leaves device; air-gapped safe)',
            balanced: 'BALANCED (Local preferred; confirms before cloud transmission)',
            hybrid: 'HYBRID (Local context indexing + selective cloud reasoning)',
            cloud: 'CLOUD-FIRST (Full cloud provider acceleration enabled)',
        };
        return `Mode: ${this.config.mode.toUpperCase()} — ${modeDesc[this.config.mode]}`;
    }
}
//# sourceMappingURL=privacy.js.map