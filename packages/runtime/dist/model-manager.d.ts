/**
 * @berkelium/runtime — Model Manager
 *
 * Coordinates model lifecycle: pull, run, stop, remove, list, show.
 * Acts as the high-level API consumed by CLI commands.
 *
 * Responsibilities:
 * - Model resolution (name → descriptor → registry lookup)
 * - Download orchestration with progress
 * - Pre-flight hardware checks before loading
 * - Runtime adapter selection
 * - Model lifecycle management (load/unload)
 */
import type { ModelDescriptor, PullProgressCallback, ModelRegistryEntry } from './types.js';
import { ModelStore } from './model-store.js';
import { RuntimeManager } from './runtime-manager.js';
export interface ModelManagerOptions {
    modelsDir?: string;
    runtimeManager?: RuntimeManager;
}
export declare class ModelManager {
    private store;
    private runtimeManager;
    private hardware;
    private registry;
    constructor(options?: ModelManagerOptions);
    /**
     * Pull (download) a model to local storage.
     *
     * Security invariant: Never execute downloaded model files as arbitrary code.
     * Models are binary weight files, not executable scripts.
     */
    pull(modelId: string, onProgress?: PullProgressCallback): Promise<ModelDescriptor>;
    /**
     * Run a local model — load into runtime and prepare for inference.
     */
    run(modelId: string): Promise<void>;
    /**
     * Stop a running model.
     */
    stop(modelId: string): Promise<void>;
    /**
     * Remove a model from local storage.
     */
    remove(modelId: string): boolean;
    /**
     * List all locally installed models.
     */
    list(): {
        descriptor: ModelDescriptor;
        disk_size_bytes: number;
        installed_at: number;
    }[];
    /**
     * Show detailed info for a model.
     */
    show(modelId: string): string | null;
    /**
     * Search the model registry.
     */
    search(query: string): ModelRegistryEntry[];
    /**
     * Get model store reference.
     */
    getStore(): ModelStore;
    /**
     * Get runtime manager reference.
     */
    getRuntimeManager(): RuntimeManager;
    private registryToDescriptor;
    private getCurrentMemoryUsage;
    private downloadFromHuggingFace;
}
//# sourceMappingURL=model-manager.d.ts.map