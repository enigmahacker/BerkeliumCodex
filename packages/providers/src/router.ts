import { BerkeliumConfig, ModelAlias } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderRequestOptions, Message } from './types.js';
import { CapabilityMatrix } from './capability-matrix.js';
import { EndpointTrustError } from './endpoint-trust.js';

const LOCAL_PROVIDER_IDS = new Set(['mlx', 'gguf', 'cpu', 'ollama', 'lmstudio']);

function createAbortError(): Error {
  const error = new Error('Request aborted by caller.');
  error.name = 'AbortError';
  return error;
}

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

  private isLocalProvider(provider: Provider, providerId: string): boolean {
    return provider.isLocal?.() ?? LOCAL_PROVIDER_IDS.has(providerId.toLowerCase());
  }

  private applyCategory(
    target: ResolvedModelTarget,
    category: 'cloud' | 'local' | 'custom' | undefined
  ): ResolvedModelTarget {
    if (category === 'local' && !this.isLocalProvider(target.provider, target.providerId)) {
      throw new Error(
        `Model target "${target.providerId}/${target.modelId}" is not local, but the "local/" prefix requires a local provider.`
      );
    }
    if (category === 'cloud' && this.isLocalProvider(target.provider, target.providerId)) {
      throw new Error(
        `Model target "${target.providerId}/${target.modelId}" is local, but the "cloud/" prefix requires a cloud provider.`
      );
    }
    return category ? { ...target, category } : target;
  }

  public resolveTarget(input: string): ResolvedModelTarget {
    let trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Model identifier cannot be empty.');
    }
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
      return this.applyCategory({
        provider,
        providerId: aliasConfig.provider,
        modelId: aliasConfig.model,
        alias: trimmed,
        config: aliasConfig,
        category,
      }, category);
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
      if (!modelId && directProvider.getDefaultModels) {
        const defaults = directProvider.getDefaultModels();
        if (defaults && defaults.length > 0) {
          modelId = defaults[0].id;
        }
      }
      if (!modelId) {
        throw new Error(
          `Provider "${normalizedProvId}" has no configured model and exposes no default models.`
        );
      }
      return this.applyCategory({
        provider: directProvider,
        providerId: directProvider.id,
        modelId,
        category,
      }, category);
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
        return this.applyCategory({
          provider,
          providerId,
          modelId,
          category,
        }, category);
      }
      throw new Error(`Provider "${providerId}" is not registered or supported.`);
    }

    // 4. Model ID lookup across all registered providers:
    // If the user entered an unqualified model name like 'deepseek-coder-v2', 'qwen2.5-coder:7b', or 'llama-3.3-70b-versatile',
    // check if it matches any provider's known default models
    for (const [provId, prov] of this.providers.entries()) {
      if (prov.getDefaultModels) {
        const defaults = prov.getDefaultModels();
        if (defaults.some((m) => m.id.toLowerCase() === lower || m.id.toLowerCase().endsWith('/' + lower))) {
          return this.applyCategory({
            provider: prov,
            providerId: provId,
            modelId: trimmed,
          }, category);
        }
      }
    }

    // 5. Fallback: try default provider or openrouter
    const defaultAlias = this.config.default_model;
    if (this.config.models[defaultAlias]) {
      const def = this.config.models[defaultAlias];
      const prov = this.providers.get(def.provider);
      if (prov) {
        return this.applyCategory({
          provider: prov,
          providerId: def.provider,
          modelId: trimmed,
        }, category);
      }
    }

    const openrouter = this.providers.get('openrouter');
    if (openrouter) {
      return this.applyCategory({
        provider: openrouter,
        providerId: 'openrouter',
        modelId: trimmed,
      }, category);
    }

    throw new Error(`Could not resolve model or provider for: "${input}"`);
  }

  public async checkProviderHealth(providerId: string): Promise<{ isHealthy: boolean; latency: number; lastCheck: number; error?: string }> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      return {
        isHealthy: false,
        latency: 0,
        lastCheck: Date.now(),
        error: `Provider "${providerId}" is not registered.`,
      };
    }

    return this.checkTargetHealth(provider);
  }

  private async checkTargetHealth(
    provider: Provider
  ): Promise<{ isHealthy: boolean; latency: number; lastCheck: number; error?: string }> {
    const start = performance.now();
    const lastCheck = Date.now();

    try {
      if (provider.checkHealth) {
        return await provider.checkHealth();
      }

      const isHealthy = await provider.isAvailable();
      return {
        isHealthy,
        latency: Math.round(performance.now() - start),
        lastCheck,
        error: isHealthy ? undefined : 'Provider is unavailable.',
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        latency: Math.round(performance.now() - start),
        lastCheck,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public async *streamWithFallback(
    messages: Message[],
    options: ProviderRequestOptions,
    initialTargetName?: string,
    authorizeTarget?: (target: ResolvedModelTarget) => Promise<void>,
    onTargetSelected?: (target: ResolvedModelTarget) => void
  ): AsyncIterable<NormalizedChunk> {
    const targetName = initialTargetName || this.config.default_model;
    const configuredCandidates = [targetName, ...(this.config.routing.fallback || [])];
    const candidates = [...new Set(configuredCandidates)];
    let lastError: Error | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (options.signal?.aborted) {
        throw createAbortError();
      }

      let target: ResolvedModelTarget;
      try {
        target = this.resolveTarget(candidate);
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Provider candidate "${candidate}" could not be resolved: ${lastError.message}`);
        if (i === candidates.length - 1) {
          throw lastError;
        }
        continue;
      }

      // Consent and endpoint-trust decisions apply to every candidate and are
      // never downgraded into a silent fallback.
      if (authorizeTarget) {
        await authorizeTarget(target);
      }

      let yieldedAny = false;
      try {
        const health = await this.checkTargetHealth(target.provider);
        if (!health.isHealthy) {
          throw new Error(
            `Provider ${target.providerId} is unhealthy${health.error ? `: ${health.error}` : '.'}`
          );
        }

        onTargetSelected?.(target);

        const providerConfig = (this.config.providers as Record<string, { timeout_ms?: number }>)[
          target.providerId
        ];
        const streamOptions: ProviderRequestOptions = {
          ...options,
          model: target.modelId,
          temperature: options.temperature ?? target.config?.temperature,
          maxTokens: options.maxTokens ?? target.config?.max_tokens,
          timeoutMs: options.timeoutMs ?? providerConfig?.timeout_ms,
        };

        this.logger.debug(
          `Routing stream to ${target.providerId}/${target.modelId} after ${health.latency}ms health check`
        );
        for await (const chunk of target.provider.stream(messages, streamOptions)) {
          yieldedAny = true;
          yield chunk;
        }
        return;
      } catch (err: any) {
        if (options.signal?.aborted) {
          throw createAbortError();
        }
        lastError = err instanceof Error ? err : new Error(String(err));

        if (err instanceof EndpointTrustError) {
          throw err;
        }

        // Retrying after partial output would duplicate tokens for the caller.
        if (yieldedAny) {
          throw lastError;
        }

        this.logger.warn(
          `Provider candidate "${candidate}" failed: ${lastError.message}. Attempting fallback...`
        );
        if (i === candidates.length - 1) {
          throw lastError;
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
