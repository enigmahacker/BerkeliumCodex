export class ProviderRouter {
    providers = new Map();
    config;
    logger;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger.child('router');
    }
    registerProvider(provider) {
        this.providers.set(provider.id, provider);
    }
    getProvider(id) {
        return this.providers.get(id);
    }
    updateConfig(config) {
        this.config = config;
    }
    resolveTarget(input) {
        const trimmed = input.trim();
        // 1. Check if it matches a configured model alias (e.g. 'coding', 'local', 'workstation', 'cloud', 'fast', 'reasoning')
        if (this.config.models[trimmed]) {
            const aliasConfig = this.config.models[trimmed];
            const provider = this.providers.get(aliasConfig.provider);
            if (!provider) {
                throw new Error(`Provider "${aliasConfig.provider}" for alias "${trimmed}" is not registered or supported.`);
            }
            return {
                provider,
                providerId: aliasConfig.provider,
                modelId: aliasConfig.model,
                alias: trimmed,
                config: aliasConfig,
            };
        }
        // 2. Check if it matches 'provider/model' notation (e.g. 'openrouter/anthropic/claude-3.7-sonnet', 'ollama/qwen2.5-coder:7b')
        const slashIdx = trimmed.indexOf('/');
        if (slashIdx !== -1) {
            const providerId = trimmed.slice(0, slashIdx);
            const modelId = trimmed.slice(slashIdx + 1);
            const provider = this.providers.get(providerId);
            if (provider) {
                return {
                    provider,
                    providerId,
                    modelId,
                };
            }
        }
        // 3. Fallback: try default provider or openrouter
        const defaultAlias = this.config.default_model;
        if (this.config.models[defaultAlias]) {
            const def = this.config.models[defaultAlias];
            const prov = this.providers.get(def.provider);
            if (prov) {
                return {
                    provider: prov,
                    providerId: def.provider,
                    modelId: trimmed,
                };
            }
        }
        const openrouter = this.providers.get('openrouter');
        if (openrouter) {
            return {
                provider: openrouter,
                providerId: 'openrouter',
                modelId: trimmed,
            };
        }
        throw new Error(`Could not resolve model or provider for: "${input}"`);
    }
    async *streamWithFallback(messages, options, initialTargetName) {
        const targetName = initialTargetName || this.config.default_model;
        const candidates = [targetName, ...(this.config.routing.fallback || [])];
        let lastError = null;
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            try {
                const target = this.resolveTarget(candidate);
                const streamOptions = {
                    ...options,
                    model: target.modelId,
                };
                this.logger.debug(`Routing stream to ${target.providerId}/${target.modelId}`);
                for await (const chunk of target.provider.stream(messages, streamOptions)) {
                    yield chunk;
                }
                return; // Stream succeeded
            }
            catch (err) {
                lastError = err;
                this.logger.warn(`Provider candidate "${candidate}" failed: ${err.message}. Attempting fallback...`);
                if (i === candidates.length - 1) {
                    throw err;
                }
            }
        }
        if (lastError)
            throw lastError;
    }
    async listAllAvailableModels() {
        const results = {};
        for (const [id, provider] of this.providers.entries()) {
            try {
                const models = await provider.listModels();
                results[id] = models;
            }
            catch (err) {
                this.logger.debug(`Failed to list models for provider ${id}: ${err.message}`);
                results[id] = [];
            }
        }
        return results;
    }
}
//# sourceMappingURL=router.js.map