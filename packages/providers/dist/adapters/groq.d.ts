import { AuthStore } from '@berkelium/auth';
import { Message, ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderCapabilities, ProviderRequestOptions } from '../types.js';
export declare class GroqProvider implements Provider {
    readonly id = "groq";
    readonly name = "Groq";
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
//# sourceMappingURL=groq.d.ts.map