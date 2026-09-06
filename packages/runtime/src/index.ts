/**
 * @berkelium/runtime — Public API
 *
 * The runtime package provides:
 * - Hardware detection (Apple Silicon, memory budgeting)
 * - Runtime adapters (MLX, GGUF)
 * - Runtime manager (adapter discovery, selection)
 * - Model store (local model storage)
 * - Model manager (lifecycle: pull, run, stop, remove)
 */

// Types
export * from './types.js';

// Core modules
export { HardwareDetector } from './hardware.js';
export { RuntimeManager } from './runtime-manager.js';
export type { RuntimeManagerOptions, RuntimeStatus } from './runtime-manager.js';
export { ModelStore } from './model-store.js';
export type { StoredModel } from './model-store.js';
export { ModelManager } from './model-manager.js';
export type { ModelManagerOptions } from './model-manager.js';

// Adapters
export { MLXAdapter } from './adapters/mlx-adapter.js';
export { GGUFAdapter } from './adapters/gguf-adapter.js';
