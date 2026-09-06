/**
 * @berkelium/runtime — MLX Runtime Adapter
 *
 * Provides Apple Silicon-optimized inference via the mlx-lm Python package.
 * Spawns mlx_lm.server as a subprocess and communicates via HTTP.
 *
 * Architecture decision: Subprocess isolation rather than FFI because:
 * 1. Decouples Python/MLX versioning from Node.js process
 * 2. Crash isolation — model crashes don't bring down the CLI
 * 3. Memory cleanup is reliable (kill process)
 * 4. MLX upgrades don't require Berkelium rebuilds
 */
import type { RuntimeAdapter, RuntimeType, ModelDescriptor, GenerateRequest, GenerateResponse, StreamChunk, ChatMessage, ChatOptions, TokenizeResult, RuntimeHealth, RuntimeMetadata, RuntimeCapabilities, LoadedModel } from './types.js';
export declare class MLXAdapter implements RuntimeAdapter {
    readonly id = "mlx";
    readonly name = "Apple MLX";
    readonly type: RuntimeType;
    private loadedModels;
    private pythonPath;
    private basePort;
    private pendingCancellations;
    constructor(options?: {
        pythonPath?: string;
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
    cancel(requestId: string): void;
    listLoaded(): LoadedModel[];
    isMLXInstalled(): boolean;
    private getLoadedModelOrThrow;
    private waitForServer;
    private parseSSEStream;
    private getMLXVersion;
}
//# sourceMappingURL=mlx-adapter.d.ts.map