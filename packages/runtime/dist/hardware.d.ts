/**
 * @berkelium/runtime — Apple Silicon Hardware Detection
 *
 * Detects hardware capabilities on macOS (Apple Silicon or Intel),
 * calculates memory budgets for model loading, and provides
 * pre-flight checks before attempting to load a model.
 *
 * Uses macOS sysctl/system_profiler where available, with safe
 * fallbacks for non-macOS or sandboxed environments.
 */
import type { HardwareInfo, MemoryBudget, ModelDescriptor } from './types.js';
export declare class HardwareDetector {
    private cachedInfo;
    /**
     * Detect full hardware profile. Results are cached after first call.
     */
    detect(): HardwareInfo;
    /**
     * Calculate memory budget for model loading.
     * Returns how much memory is available for models after system and agent reservations.
     */
    calculateBudget(currentlyLoadedBytes?: number): MemoryBudget;
    /**
     * Pre-flight check: Can the given model be loaded with current hardware?
     * Returns null if OK, or an error message explaining why not.
     */
    canLoadModel(model: ModelDescriptor, currentlyLoadedBytes?: number): string | null;
    /**
     * Format hardware info for display (berkelium doctor / berkelium status).
     */
    formatSummary(): string;
    private detectAppleChip;
    private detectGPUCores;
    private detectCoreTopology;
    private getAvailableMemory;
    private getMacOSVersion;
}
//# sourceMappingURL=hardware.d.ts.map