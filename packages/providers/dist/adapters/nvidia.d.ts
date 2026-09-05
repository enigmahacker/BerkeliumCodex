import { AuthStore } from '@berkelium/auth';
import { Message, ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderCapabilities, ProviderRequestOptions } from '../types.js';
export declare class NVIDIAProvider implements Provider {
    readonly id = "nvidia";
    readonly name = "NVIDIA NIM";
    private baseUrl;
    private authStore;
    constructor(authStore: AuthStore, baseUrl?: string);
    capabilities(): ProviderCapabilities;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<ModelInfo[]>;
    private getDefaultModels;
    stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk>;
    generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse>;
    private formatMessages;
}
//# sourceMappingURL=nvidia.d.ts.map