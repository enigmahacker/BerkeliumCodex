import { Message, ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderCapabilities, ProviderRequestOptions } from '../types.js';
export declare class OllamaProvider implements Provider {
    readonly id = "ollama";
    readonly name = "Ollama";
    private baseUrl;
    constructor(baseUrl?: string);
    capabilities(): ProviderCapabilities;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<ModelInfo[]>;
    getDefaultModels(): ModelInfo[];
    stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk>;
    generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse>;
    private formatMessages;
    private resolveModelName;
}
//# sourceMappingURL=ollama.d.ts.map