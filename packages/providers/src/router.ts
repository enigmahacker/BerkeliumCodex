import { BerkeliumConfig, ModelAlias } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderRequestOptions, Message } from './types.js';

export interface ResolvedModelTarget {
  provider: Provider;
  providerId: string;
  modelId: string;
  alias?: string;
  config?: ModelAlias;
}

export class ProviderRouter {
  private providers: Map<string, Provider> = new Map();
  private config: BerkeliumConfig;
  private logger: Logger;

  constructor(config: BerkeliumConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.child('router');
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
    const trimmed = input.trim();

    // 1. Check if it matches a configured model alias (e.g. 'coding', 'local', 'workstation', 'cloud', 'fast', 'reasoning')
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
