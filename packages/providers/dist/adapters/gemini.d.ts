import { AuthStore } from '@berkelium/auth';
import { Message, ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderCapabilities, ProviderRequestOptions } from '../types.js';
export declare class GeminiProvider implements Provider {
    readonly id = "gemini";
    readonly name = "Google Gemini";
    private baseUrl;
    private authStore;
    constructor(authStore: AuthStore, baseUrl?: string);
    capabilities(): ProviderCapabilities;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<ModelInfo[]>;
    getDefaultModels(): ModelInfo[];
    stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk>;
    generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse>;
    private getApiKey;
    private formatMessages;
}
//# sourceMappingURL=gemini.d.ts.map