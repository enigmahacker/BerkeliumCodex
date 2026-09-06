/**
 * @berkelium/runtime — Model Store
 *
 * Manages the local model storage directory (~/.berkelium/models/),
 * model metadata index, and storage accounting.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ModelDescriptor, ModelStoreMeta, ModelStatus } from './types.js';

const DEFAULT_MODELS_DIR = path.join(os.homedir(), '.berkelium', 'models');
const INDEX_FILE = 'index.json';

export interface StoredModel {
  descriptor: ModelDescriptor;
  installed_at: number;
  last_used?: number;
  disk_size_bytes: number;
}

export class ModelStore {
  private modelsDir: string;
  private indexPath: string;
  private models: Map<string, StoredModel> = new Map();

  constructor(modelsDir?: string) {
    this.modelsDir = modelsDir || process.env.BERKELIUM_MODELS_DIR || DEFAULT_MODELS_DIR;
    this.indexPath = path.join(this.modelsDir, INDEX_FILE);
    this.ensureDir();
    this.loadIndex();
  }

  /** List all locally stored models */
  public list(): StoredModel[] {
    return [...this.models.values()];
  }

  /** Get a specific model by ID */
  public get(modelId: string): StoredModel | undefined {
    return this.models.get(modelId);
  }

  /** Check if a model is installed locally */
  public has(modelId: string): boolean {
    return this.models.has(modelId);
  }

  /** Register a newly downloaded model */
  public add(descriptor: ModelDescriptor, diskSizeBytes: number): void {
    this.models.set(descriptor.id, {
      descriptor,
      installed_at: Date.now(),
      disk_size_bytes: diskSizeBytes,
    });
    this.saveIndex();
  }

  /** Remove a model from the store */
  public remove(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    // Delete model files
    if (model.descriptor.file_path) {
      const modelPath = model.descriptor.file_path;
      try {
        if (fs.existsSync(modelPath)) {
          const stat = fs.statSync(modelPath);
          if (stat.isDirectory()) {
            fs.rmSync(modelPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(modelPath);
          }
        }
      } catch {
        // Best-effort deletion
      }
    }

    this.models.delete(modelId);
    this.saveIndex();
    return true;
  }

  /** Mark a model as recently used */
  public touch(modelId: string): void {
    const model = this.models.get(modelId);
    if (model) {
      model.last_used = Date.now();
      this.saveIndex();
    }
  }

  /** Get total storage used by all models */
  public getStorageUsed(): number {
    let total = 0;
    for (const model of this.models.values()) {
      total += model.disk_size_bytes;
    }
    return total;
  }

  /** Get the model storage directory path */
  public getModelsDir(): string {
    return this.modelsDir;
  }

  /** Get model file path for a given model ID */
  public getModelPath(modelId: string): string {
    return path.join(this.modelsDir, modelId.replace(/[:/]/g, '_'));
  }

  /** Verify model file integrity (checksum check) */
  public async verify(modelId: string): Promise<{ valid: boolean; message: string }> {
    const model = this.models.get(modelId);
    if (!model) {
      return { valid: false, message: `Model ${modelId} is not installed.` };
    }

    if (!model.descriptor.file_path || !fs.existsSync(model.descriptor.file_path)) {
      return { valid: false, message: `Model files not found at ${model.descriptor.file_path}` };
    }

    // If we have a checksum, verify it
    if (model.descriptor.checksum) {
      const { createHash } = await import('node:crypto');
      const hash = createHash('sha256');
      const fileContent = fs.readFileSync(model.descriptor.file_path);
      hash.update(fileContent);
      const computed = hash.digest('hex');
      if (computed !== model.descriptor.checksum) {
        return {
          valid: false,
          message: `Checksum mismatch for ${modelId}.\nExpected: ${model.descriptor.checksum}\nGot:      ${computed}`,
        };
      }
    }

    return { valid: true, message: `Model ${modelId} integrity verified.` };
  }

  /** Get cache statistics */
  public getCacheStats(): { modelCount: number; totalSizeBytes: number; modelsDir: string } {
    return {
      modelCount: this.models.size,
      totalSizeBytes: this.getStorageUsed(),
      modelsDir: this.modelsDir,
    };
  }

  /** Remove unused models (not used in the last N days) */
  public prune(maxAgeDays: number = 30): string[] {
    const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    const pruned: string[] = [];

    for (const [id, model] of this.models.entries()) {
      const lastAccess = model.last_used || model.installed_at;
      if (lastAccess < cutoff) {
        this.remove(id);
        pruned.push(id);
      }
    }

    return pruned;
  }

  /** Format model list for CLI display */
  public formatList(): string {
    if (this.models.size === 0) {
      return 'No local models installed.\nRun `berkelium pull <model>` to download a model.';
    }

    const header = 'NAME'.padEnd(30) + 'SIZE'.padEnd(12) + 'RUNTIME'.padEnd(12) +
      'CONTEXT'.padEnd(12) + 'STATUS';
    const separator = '─'.repeat(78);
    const lines = [header, separator];

    for (const model of this.models.values()) {
      const d = model.descriptor;
      const name = d.id.padEnd(30);
      const size = formatSize(model.disk_size_bytes).padEnd(12);
      const runtime = d.runtime.toUpperCase().padEnd(12);
      const context = formatContext(d.context_length).padEnd(12);
      const status = 'READY';
      lines.push(`${name}${size}${runtime}${context}${status}`);
    }

    return lines.join('\n');
  }

  /** Format detailed model info */
  public formatShow(modelId: string): string | null {
    const model = this.models.get(modelId);
    if (!model) return null;

    const d = model.descriptor;
    const lines = [
      `Model:          ${d.id}`,
      `Name:           ${d.name}`,
      `Architecture:   ${d.architecture}`,
      `Parameters:     ${d.parameters}`,
      `Quantization:   ${d.quantization || 'N/A'}`,
      `Runtime:        ${d.runtime.toUpperCase()}`,
      `Context:        ${formatContext(d.context_length)}`,
      `Size:           ${formatSize(model.disk_size_bytes)}`,
      `Capabilities:   ${d.capabilities.join(', ')}`,
      `License:        ${d.license || 'N/A'}`,
      `Installed:      ${new Date(model.installed_at).toLocaleDateString()}`,
      `Last Used:      ${model.last_used ? new Date(model.last_used).toLocaleDateString() : 'Never'}`,
      `Path:           ${d.file_path || 'N/A'}`,
      `Checksum:       ${d.checksum ? d.checksum.slice(0, 16) + '...' : 'N/A'}`,
    ];

    return lines.join('\n');
  }

  // ── Private ────────────────────────────────────────────────────────────

  private ensureDir(): void {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true, mode: 0o755 });
    }
  }

  private loadIndex(): void {
    try {
      if (fs.existsSync(this.indexPath)) {
        const data = JSON.parse(fs.readFileSync(this.indexPath, 'utf-8')) as ModelStoreMeta;
        for (const desc of data.models) {
          this.models.set(desc.id, {
            descriptor: desc,
            installed_at: (desc.metadata?.installed_at as number) || Date.now(),
            last_used: (desc.metadata?.last_used as number) || undefined,
            disk_size_bytes: desc.file_size_bytes || 0,
          });
        }
      }
    } catch {
      // Start with empty index if corrupted
      this.models.clear();
    }
  }

  private saveIndex(): void {
    const meta: ModelStoreMeta = {
      models: [...this.models.values()].map(m => ({
        ...m.descriptor,
        metadata: {
          ...m.descriptor.metadata,
          installed_at: m.installed_at,
          last_used: m.last_used,
        },
      })),
      last_updated: Date.now(),
      storage_used_bytes: this.getStorageUsed(),
    };

    try {
      fs.writeFileSync(this.indexPath, JSON.stringify(meta, null, 2), { mode: 0o644 });
    } catch {
      // Silent failure for index writes
    }
  }
}

// ── Formatters ───────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatContext(tokens: number): string {
  if (tokens >= 1048576) return `${Math.round(tokens / 1048576)}M`;
  if (tokens >= 1024) return `${Math.round(tokens / 1024)}K`;
  return String(tokens);
}
