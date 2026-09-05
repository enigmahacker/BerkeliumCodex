import { CommandMatcher } from './matcher.js';
export class CompletionEngine {
    static cachedModels = null;
    static lastModelFetch = 0;
    /**
     * Resolve dynamic argument completion options for a given command and argument index.
     */
    static async getArgumentSuggestions(context, command, argIndex, query) {
        const argDef = command.arguments?.[argIndex];
        if (!argDef)
            return [];
        let options = [];
        // 1. Check static options
        if (argDef.staticOptions && argDef.staticOptions.length > 0) {
            options = argDef.staticOptions.map((opt) => ({
                value: opt,
                description: `Option for ${argDef.name}`,
            }));
        }
        // 2. Check dynamic provider
        if (argDef.dynamicProvider) {
            switch (argDef.dynamicProvider) {
                case 'model': {
                    options = await this.getModelOptions(context);
                    break;
                }
                case 'provider': {
                    options = [
                        { value: 'openrouter', description: 'Universal cloud model gateway' },
                        { value: 'nvidia', description: 'NVIDIA NIM high-performance cloud inference' },
                        { value: 'ollama', description: 'Local Ollama runtime (no API key required)' },
                        { value: 'lmstudio', description: 'Local LM Studio server (no API key required)' },
                        { value: 'openai', description: 'OpenAI official API' },
                        { value: 'anthropic', description: 'Anthropic official API' },
                    ];
                    break;
                }
                case 'theme': {
                    const themes = context.themeManager.listThemes();
                    options = themes.map((t) => ({
                        value: t.name,
                        description: t.description || `Theme: ${t.name}`,
                    }));
                    break;
                }
                case 'agent': {
                    options = [
                        { value: 'explorer', description: 'Repository exploration & architecture discovery' },
                        { value: 'coder', description: 'Autonomous code editing and implementation' },
                        { value: 'tester', description: 'Test execution and failure verification' },
                        { value: 'reviewer', description: 'Code review, git diff inspection & safety check' },
                    ];
                    break;
                }
                case 'tool': {
                    const tools = context.orchestrator.getRegistry().list();
                    options = tools.map((t) => ({
                        value: t.metadata.name,
                        description: `[${t.metadata.category}] ${t.metadata.description}`,
                    }));
                    break;
                }
                case 'session': {
                    options = [
                        { value: 'list', description: 'List all persisted sessions' },
                        { value: 'save', description: 'Persist current session state' },
                        { value: 'resume', description: 'Resume a past session' },
                        { value: 'clear', description: 'Clear session history' },
                    ];
                    break;
                }
                case 'system-layer': {
                    options = [
                        { value: 'identity', description: 'Core agent identity & persona instructions' },
                        { value: 'behavior', description: 'Operational boundaries & safety behavior' },
                        { value: 'coding', description: 'Code quality, style, and engineering invariants' },
                        { value: 'safety', description: 'Sandboxing and credential safety rules' },
                        { value: 'tools', description: 'Tool calling discipline and guidelines' },
                        { value: 'custom', description: 'Workspace AGENTS.md custom rules' },
                    ];
                    break;
                }
            }
        }
        return CommandMatcher.matchArguments(options, query);
    }
    static async getModelOptions(context) {
        const now = Date.now();
        // Cache dynamic discovery for 10 seconds to keep keypresses snappy (<1ms)
        if (this.cachedModels && now - this.lastModelFetch < 10000) {
            return this.cachedModels;
        }
        const options = [];
        const config = context.configManager.getConfig();
        // 1. Configured Aliases first
        if (config.models) {
            for (const [alias, def] of Object.entries(config.models)) {
                options.push({
                    value: alias,
                    description: `Alias → ${def.provider}/${def.model}`,
                });
            }
        }
        // 2. Discovered live models
        try {
            const discovered = await context.router.listAllAvailableModels();
            for (const [provider, models] of Object.entries(discovered)) {
                for (const m of models.slice(0, 15)) {
                    const qualified = `${provider}/${m.id}`;
                    if (!options.some((o) => o.value === qualified)) {
                        options.push({
                            value: qualified,
                            description: `${provider.toUpperCase()} model (${m.context_length ? Math.round(m.context_length / 1000) + 'k ctx' : 'active'})`,
                        });
                    }
                }
            }
        }
        catch {
            // Fallback to static common names if discovery is slow
        }
        this.cachedModels = options;
        this.lastModelFetch = now;
        return options;
    }
}
//# sourceMappingURL=completion.js.map