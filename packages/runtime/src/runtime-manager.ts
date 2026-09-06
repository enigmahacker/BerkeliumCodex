/**
 * @berkelium/runtime — Runtime Manager
 *
 * Discovers available local runtimes, manages their lifecycle,
 * and routes inference requests to the appropriate adapter.
 */

import { execSync } from 'node:child_process';
import type {
  RuntimeAdapter, RuntimeType, RuntimeHealth, ModelDescriptor, LoadedModel,
} from './types.js';
import { MLXAdapter } from './adapters/mlx-adapter.js';
import { GGUFAdapter } from './adapters/gguf-adapter.js';
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

export class RuntimeManager {
  private adapters: Map<string, RuntimeAdapter> = new Map();
  private hardware: HardwareDetector;
  private initialized = false;

  constructor(private options: RuntimeManagerOptions = {}) {
    this.hardware = new HardwareDetector();
  }

  /**
   * Discover and register available local runtimes.
   * Called lazily on first use — never blocks CLI startup.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const hw = this.hardware.detect();

    // MLX: Only available on Apple Silicon
    if (hw.is_apple_silicon) {
      const mlx = new MLXAdapter({
        pythonPath: this.options.mlxPythonPath,
        basePort: this.options.mlxPort,
      });
      this.adapters.set('mlx', mlx);
    }

    // GGUF: Available on any platform
    const gguf = new GGUFAdapter({
      serverPath: this.options.ggufServerPath,
      basePort: this.options.ggufPort,
    });
    this.adapters.set('gguf', gguf);

    this.initialized = true;
  }

  /**
   * Get a specific runtime adapter.
   */
  public getAdapter(type: RuntimeType): RuntimeAdapter | undefined {
    return this.adapters.get(type);
  }

  /**
   * Select the best runtime for a model based on hardware and model metadata.
   */
  public selectRuntime(model: ModelDescriptor): RuntimeAdapter | null {
    // If model specifies a runtime, use it
    if (model.runtime !== 'cloud') {
      const adapter = this.adapters.get(model.runtime);
      if (adapter) return adapter;
    }

    // Auto-select: prefer MLX on Apple Silicon, fallback to GGUF
    const hw = this.hardware.detect();
    if (hw.is_apple_silicon && this.adapters.has('mlx')) {
      return this.adapters.get('mlx')!;
    }
    if (this.adapters.has('gguf')) {
      return this.adapters.get('gguf')!;
    }

    return null;
  }

  /**
   * Get status of all registered runtimes.
   */
  public async getStatuses(): Promise<RuntimeStatus[]> {
    await this.initialize();
    const statuses: RuntimeStatus[] = [];

    for (const [id, adapter] of this.adapters.entries()) {
      const health = await adapter.health();
      const meta = adapter.metadata();
      statuses.push({
        id,
        name: adapter.name,
        type: adapter.type,
        available: health.status !== 'unavailable',
        version: meta.version,
        models_loaded: health.models_loaded,
      });
    }

    // Add CPU as always available
    statuses.push({
      id: 'cpu',
      name: 'CPU Fallback',
      type: 'cpu',
      available: true,
      version: process.version,
      models_loaded: 0,
    });

    return statuses;
  }

  /**
   * Get all currently loaded models across all runtimes.
   */
  public getAllLoadedModels(): LoadedModel[] {
    const models: LoadedModel[] = [];
    for (const adapter of this.adapters.values()) {
      models.push(...adapter.listLoaded());
    }
    return models;
  }

  /**
   * Unload all models and shut down all runtimes.
   */
  public async shutdown(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      const loaded = adapter.listLoaded();
      for (const model of loaded) {
        await adapter.unload(model.descriptor.id);
      }
    }
  }

  /**
   * Get the hardware detector instance.
   */
  public getHardware(): HardwareDetector {
    return this.hardware;
  }

  /**
   * Format runtime status for CLI display (berkelium runtime list).
   */
  public async formatRuntimeList(): Promise<string> {
    const statuses = await this.getStatuses();
    const lines = ['LOCAL RUNTIMES'];
    for (const s of statuses) {
      const indicator = s.available ? '●' : '○';
      const statusText = s.available ? 'READY' : 'UNAVAILABLE';
      const modelsText = s.models_loaded > 0 ? ` (${s.models_loaded} loaded)` : '';
      lines.push(`${s.name.padEnd(14)}${indicator} ${statusText}${modelsText}`);
    }
    return lines.join('\n');
  }
}
