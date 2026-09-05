import { BerkeliumConfig, ModelAlias } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { ModelInfo, NormalizedChunk, Provider, ProviderRequestOptions, Message } from './types.js';
export interface ResolvedModelTarget {
    provider: Provider;
    providerId: string;
    modelId: string;
    alias?: string;
    config?: ModelAlias;
}
export declare class ProviderRouter {
    private providers;
    private config;
    private logger;
    constructor(config: BerkeliumConfig, logger: Logger);
    registerProvider(provider: Provider): void;
    getProvider(id: string): Provider | undefined;
    updateConfig(config: BerkeliumConfig): void;
    resolveTarget(input: string): ResolvedModelTarget;
    streamWithFallback(messages: Message[], options: ProviderRequestOptions, initialTargetName?: string): AsyncIterable<NormalizedChunk>;
    listAllAvailableModels(): Promise<Record<string, ModelInfo[]>>;
}
//# sourceMappingURL=router.d.ts.map