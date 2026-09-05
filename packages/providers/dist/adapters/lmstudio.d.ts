import { Message, ModelInfo, NormalizedChunk, NormalizedResponse, Provider, ProviderCapabilities, ProviderRequestOptions } from '../types.js';
export declare class LMStudioProvider implements Provider {
    readonly id = "lmstudio";
    readonly name = "LM Studio";
    private baseUrl;
    constructor(baseUrl?: string);
    capabilities(): ProviderCapabilities;
    isAvailable(): Promise<boolean>;
    listModels(): Promise<ModelInfo[]>;
    getDefaultModels(): ModelInfo[];
    stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk>;
    generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse>;
    private formatMessages;
}
//# sourceMappingURL=lmstudio.d.ts.map