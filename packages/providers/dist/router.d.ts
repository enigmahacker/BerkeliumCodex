import { BerkeliumConfig, ModelAlias } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { ModelInfo, NormalizedChunk, Provider, ProviderRequestOptions, Message } from './types.js';
import { CapabilityMatrix } from './capability-matrix.js';
export interface ResolvedModelTarget {
    provider: Provider;
    providerId: string;
    modelId: string;
    alias?: string;
    config?: ModelAlias;
    category?: 'cloud' | 'local' | 'custom';
}
export declare class ProviderRouter {
    private providers;
    private config;
    private logger;
    private capabilityMatrix;
    constructor(config: BerkeliumConfig, logger: Logger);
    getCapabilityMatrix(): CapabilityMatrix;
    registerProvider(provider: Provider): void;
    getProvider(id: string): Provider | undefined;
    updateConfig(config: BerkeliumConfig): void;
    resolveTarget(input: string): ResolvedModelTarget;
    streamWithFallback(messages: Message[], options: ProviderRequestOptions, initialTargetName?: string): AsyncIterable<NormalizedChunk>;
    listAllAvailableModels(): Promise<Record<string, ModelInfo[]>>;
}
//# sourceMappingURL=router.d.ts.map