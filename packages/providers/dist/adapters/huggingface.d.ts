import { AuthStore } from '@berkelium/auth';
import { Message, ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderCapabilities, ProviderRequestOptions } from '../types.js';
export declare class HuggingFaceProvider implements Provider {
    readonly id = "huggingface";
    readonly name = "Hugging Face";
    private baseUrl;
    private authStore;
    constructor(authStore: AuthStore, baseUrl?: string);
    capabilities(): ProviderCapabilities;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<ModelInfo[]>;
    getDefaultModels(): ModelInfo[];
    stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk>;
    generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse>;
    private formatMessages;
}
//# sourceMappingURL=huggingface.d.ts.map