/**
 * @berkelium/runtime — GGUF Runtime Adapter
 *
 * Provides inference for GGUF-format models via llama.cpp's server.
 * Spawns llama-server as a subprocess with an OpenAI-compatible API.
 *
 * Supports any platform (macOS, Linux, Windows) where llama-server is available.
 */
import type { RuntimeAdapter, RuntimeType, ModelDescriptor, GenerateRequest, GenerateResponse, StreamChunk, ChatMessage, ChatOptions, TokenizeResult, RuntimeHealth, RuntimeMetadata, RuntimeCapabilities, LoadedModel } from './types.js';
export declare class GGUFAdapter implements RuntimeAdapter {
    readonly id = "gguf";
    readonly name = "GGUF (llama.cpp)";
    readonly type: RuntimeType;
    private loadedModels;
    private serverPath;
    private basePort;
    private pendingCancellations;
    constructor(options?: {
        serverPath?: string;
        basePort?: number;
    });
    load(model: ModelDescriptor): Promise<void>;
    unload(modelId: string): Promise<void>;
    generate(request: GenerateRequest): Promise<GenerateResponse>;
    stream(request: GenerateRequest): AsyncIterable<StreamChunk>;
    chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<StreamChunk>;
    embed(_text: string | string[]): Promise<number[][]>;
    tokenize(_text: string): Promise<TokenizeResult>;
    health(): Promise<RuntimeHealth>;
    metadata(): RuntimeMetadata;
    capabilities(): RuntimeCapabilities;
    cancel(_requestId: string): void;
    listLoaded(): LoadedModel[];
    isLlamaServerInstalled(): boolean;
    private findLlamaServer;
    private getLoadedModelOrThrow;
    private waitForServer;
    private parseSSEStream;
    private getLlamaVersion;
}
//# sourceMappingURL=gguf-adapter.d.ts.map