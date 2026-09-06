/**
 * @berkelium/runtime — Model Store
 *
 * Manages the local model storage directory (~/.berkelium/models/),
 * model metadata index, and storage accounting.
 */
import type { ModelDescriptor } from './types.js';
export interface StoredModel {
    descriptor: ModelDescriptor;
    installed_at: number;
    last_used?: number;
    disk_size_bytes: number;
}
export declare class ModelStore {
    private modelsDir;
    private indexPath;
    private models;
    constructor(modelsDir?: string);
    /** List all locally stored models */
    list(): StoredModel[];
    /** Get a specific model by ID */
    get(modelId: string): StoredModel | undefined;
    /** Check if a model is installed locally */
    has(modelId: string): boolean;
    /** Register a newly downloaded model */
    add(descriptor: ModelDescriptor, diskSizeBytes: number): void;
    /** Remove a model from the store */
    remove(modelId: string): boolean;
    /** Mark a model as recently used */
    touch(modelId: string): void;
    /** Get total storage used by all models */
    getStorageUsed(): number;
    /** Get the model storage directory path */
    getModelsDir(): string;
    /** Get model file path for a given model ID */
    getModelPath(modelId: string): string;
    /** Verify model file integrity (checksum check) */
    verify(modelId: string): Promise<{
        valid: boolean;
        message: string;
    }>;
    /** Get cache statistics */
    getCacheStats(): {
        modelCount: number;
        totalSizeBytes: number;
        modelsDir: string;
    };
    /** Remove unused models (not used in the last N days) */
    prune(maxAgeDays?: number): string[];
    /** Format model list for CLI display */
    formatList(): string;
    /** Format detailed model info */
    formatShow(modelId: string): string | null;
    private ensureDir;
    private loadIndex;
    private saveIndex;
}
//# sourceMappingURL=model-store.d.ts.map