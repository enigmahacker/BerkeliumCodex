/**
 * @berkelium/runtime — Runtime Manager
 *
 * Discovers available local runtimes, manages their lifecycle,
 * and routes inference requests to the appropriate adapter.
 */
import type { RuntimeAdapter, RuntimeType, ModelDescriptor, LoadedModel } from './types.js';
import { HardwareDetector } from './hardware.js';
export interface RuntimeManagerOptions {
    mlxPythonPath?: string;
    mlxPort?: number;
    ggufServerPath?: string;
    ggufPort?: number;
}
export interface RuntimeStatus {
    id: string;
    name: string;
    type: RuntimeType;
    available: boolean;
    version: string;
    models_loaded: number;
}
export declare class RuntimeManager {
    private options;
    private adapters;
    private hardware;
    private initialized;
    constructor(options?: RuntimeManagerOptions);
    /**
     * Discover and register available local runtimes.
     * Called lazily on first use — never blocks CLI startup.
     */
    initialize(): Promise<void>;
    /**
     * Get a specific runtime adapter.
     */
    getAdapter(type: RuntimeType): RuntimeAdapter | undefined;
    /**
     * Select the best runtime for a model based on hardware and model metadata.
     */
    selectRuntime(model: ModelDescriptor): RuntimeAdapter | null;
    /**
     * Get status of all registered runtimes.
     */
    getStatuses(): Promise<RuntimeStatus[]>;
    /**
     * Get all currently loaded models across all runtimes.
     */
    getAllLoadedModels(): LoadedModel[];
    /**
     * Unload all models and shut down all runtimes.
     */
    shutdown(): Promise<void>;
    /**
     * Get the hardware detector instance.
     */
    getHardware(): HardwareDetector;
    /**
     * Format runtime status for CLI display (berkelium runtime list).
     */
    formatRuntimeList(): Promise<string>;
}
//# sourceMappingURL=runtime-manager.d.ts.map