import { NormalizedChunk, NormalizedResponse } from './types.js';
export declare class ResponseNormalizer {
    static createAccumulator(model: string, provider: string): {
        processChunk(chunk: NormalizedChunk): void;
        toNormalizedResponse(): NormalizedResponse;
    };
    static normalizeOpenAIChunk(raw: any): NormalizedChunk[];
}
//# sourceMappingURL=normalizer.d.ts.map