import { BerkeliumConfig, ModelAlias } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderRequestOptions, Message } from './types.js';
import { CapabilityMatrix } from './capability-matrix.js';

export interface ResolvedModelTarget {
  provider: Provider;
  providerId: string;
  modelId: string;
  alias?: string;
  config?: ModelAlias;
  category?: 'cloud' | 'local' | 'custom';
}

export class ProviderRouter {
  private providers: Map<string, Provider> = new Map();
  private config: BerkeliumConfig;
  private logger: Logger;
  private capabilityMatrix = new CapabilityMatrix();

  constructor(config: BerkeliumConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.child('router');
  }

  public getCapabilityMatrix(): CapabilityMatrix {
    return this.capabilityMatrix;
  }

  public registerProvider(provider: Provider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): Provider | undefined {
    return this.providers.get(id);
  }

  public updateConfig(config: BerkeliumConfig): void {
    this.config = config;
  }

  public resolveTarget(input: string): ResolvedModelTarget {
    let trimmed = input.trim();
    let lower = trimmed.toLowerCase();
    let category: 'cloud' | 'local' | 'custom' | undefined;

    // Handle unified category prefixes: cloud/..., local/..., custom/...
    if (lower.startsWith('cloud/') || lower.startsWith('local/') || lower.startsWith('custom/')) {
      const firstSlash = trimmed.indexOf('/');
      category = trimmed.slice(0, firstSlash).toLowerCase() as 'cloud' | 'local' | 'custom';
      trimmed = trimmed.slice(firstSlash + 1).trim();
      lower = trimmed.toLowerCase();
    }

    // 1. Check if it matches a configured model alias (e.g. 'coding', 'local', 'workstation', 'cloud', 'fast', 'reasoning', 'lmstudio', etc.)
    if (this.config.models[trimmed]) {
      const aliasConfig = this.config.models[trimmed];
      const provider = this.providers.get(aliasConfig.provider);
      if (!provider) {
        throw new Error(
          `Provider "${aliasConfig.provider}" for alias "${trimmed}" is not registered or supported.`
        );
      }
      return {
        provider,
        providerId: aliasConfig.provider,
        modelId: aliasConfig.model,
        alias: trimmed,
        config: aliasConfig,
        category,
      };
    }

    // 2. Direct provider identifier lookup (e.g. user selected "/model lmstudio" or "/model ollama" or "/model groq")
    const providerAliases: Record<string, string> = {
      'lm-studio': 'lmstudio',
      'lm_studio': 'lmstudio',
      'hf': 'huggingface',
      'google': 'gemini',
      'googleapi': 'gemini',
      'google-ai': 'gemini',
      'google-genai': 'gemini',
      'gemini-api': 'gemini',
    };

    const normalizedProvId = providerAliases[lower] || lower;
    const directProvider = this.providers.get(normalizedProvId);
    if (directProvider) {
      // Find matching alias in config or first default model
      const matchingAlias = Object.entries(this.config.models).find(
        ([_, conf]) => conf.provider.toLowerCase() === normalizedProvId
      );
      let modelId = matchingAlias ? matchingAlias[1].model : '';
      if (!modelId && typeof (directProvider as any).getDefaultModels === 'function') {
        const defaults = (directProvider as any).getDefaultModels() as ModelInfo[];
        if (defaults && defaults.length > 0) {
          modelId = defaults[0].id;
        }
      }
      return {
        provider: directProvider,
        providerId: directProvider.id,
        modelId: modelId || 'default',
        category,
      };
    }

    // 3. Check if it matches 'provider/model' notation (e.g. 'lmstudio/deepseek-coder-v2', 'ollama/qwen2.5-coder:7b', 'hf/meta-llama/...')
    const slashIdx = trimmed.indexOf('/');
    if (slashIdx !== -1) {
      let providerId = trimmed.slice(0, slashIdx).toLowerCase();
      const modelId = trimmed.slice(slashIdx + 1);
      if (providerAliases[providerId]) {
        providerId = providerAliases[providerId];
      }
      const provider = this.providers.get(providerId);
      if (provider) {
        return {
          provider,
          providerId,
          modelId,
          category,
        };
      }
      throw new Error(`Provider "${providerId}" is not registered or supported.`);
    }

    // 4. Model ID lookup across all registered providers:
    // If the user entered an unqualified model name like 'deepseek-coder-v2', 'qwen2.5-coder:7b', or 'llama-3.3-70b-versatile',
    // check if it matches any provider's known default models
    for (const [provId, prov] of this.providers.entries()) {
      if (typeof (prov as any).getDefaultModels === 'function') {
        const defaults = (prov as any).getDefaultModels() as ModelInfo[];
        if (defaults.some((m) => m.id.toLowerCase() === lower || m.id.toLowerCase().endsWith('/' + lower))) {
          return {
            provider: prov,
            providerId: provId,
            modelId: trimmed,
          };
        }
      }
    }

    // 5. Fallback: try default provider or openrouter
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

  public async *streamWithFallback(
    messages: Message[],
    options: ProviderRequestOptions,
    initialTargetName?: string
  ): AsyncIterable<NormalizedChunk> {
    const targetName = initialTargetName || this.config.default_model;
    const candidates: string[] = [targetName, ...(this.config.routing.fallback || [])];
    let lastError: Error | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      try {
        const target = this.resolveTarget(candidate);
        const streamOptions: ProviderRequestOptions = {
          ...options,
          model: target.modelId,
        };

        this.logger.debug(`Routing stream to ${target.providerId}/${target.modelId}`);
        for await (const chunk of target.provider.stream(messages, streamOptions)) {
          yield chunk;
        }
        return; // Stream succeeded
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Provider candidate "${candidate}" failed: ${err.message}. Attempting fallback...`);
        if (i === candidates.length - 1) {
          throw err;
        }
      }
    }

    if (lastError) throw lastError;
  }

  public async listAllAvailableModels(): Promise<Record<string, ModelInfo[]>> {
    const results: Record<string, ModelInfo[]> = {};
    for (const [id, provider] of this.providers.entries()) {
      try {
        const models = await provider.listModels();
        results[id] = models;
      } catch (err: any) {
        this.logger.debug(`Failed to list models for provider ${id}: ${err.message}`);
        results[id] = [];
      }
    }
    return results;
  }
}
