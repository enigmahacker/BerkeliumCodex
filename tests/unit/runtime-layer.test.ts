import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  HardwareDetector,
  ModelStore,
  ModelManager,
  RuntimeManager,
  type ModelDescriptor,
} from '@berkelium/runtime';

describe('Berkelium Runtime Layer', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-runtime-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best-effort
    }
  });

  describe('HardwareDetector', () => {
    it('should detect hardware architecture and memory budget', () => {
      const detector = new HardwareDetector();
      const hw = detector.detect();

      expect(hw.total_memory_bytes).toBeGreaterThan(0);
      expect(hw.cpu_cores).toBeGreaterThan(0);
      expect(typeof hw.is_apple_silicon).toBe('boolean');

      const budget = detector.calculateBudget();
      expect(budget.total_available_bytes).toBeGreaterThan(0);
      expect(budget.system_reserved_bytes).toBeGreaterThan(0);
      expect(budget.remaining_bytes).toBeGreaterThan(0);
    });

    it('should evaluate model load feasibility against budget', () => {
      const detector = new HardwareDetector();

      const smallModel: ModelDescriptor = {
        id: 'test-small',
        name: 'Test Small',
        runtime: 'mlx',
        source: 'local',
        architecture: 'llama',
        parameters: '3B',
        context_length: 4096,
        capabilities: ['chat'],
        hardware_requirements: {
          min_memory_bytes: 2 * 1024 * 1024 * 1024, // 2 GB
          recommended_memory_bytes: 4 * 1024 * 1024 * 1024,
          gpu_required: false,
          compatible_runtimes: ['mlx', 'gguf'],
        },
      };

      const result = detector.canLoadModel(smallModel);
      // On systems with > 3GB RAM, small model should fit
      if (detector.detect().total_memory_bytes > 4 * 1024 * 1024 * 1024) {
        expect(result).toBeNull();
      }

      const hugeModel: ModelDescriptor = {
        id: 'test-huge',
        name: 'Test Huge',
        runtime: 'mlx',
        source: 'local',
        architecture: 'llama',
        parameters: '1000B',
        context_length: 4096,
        capabilities: ['chat'],
        hardware_requirements: {
          min_memory_bytes: 10 * 1024 * 1024 * 1024 * 1024, // 10 TB
          recommended_memory_bytes: 12 * 1024 * 1024 * 1024 * 1024,
          gpu_required: false,
          compatible_runtimes: ['mlx', 'gguf'],
        },
      };

      const hugeResult = detector.canLoadModel(hugeModel);
      expect(hugeResult).toContain('Insufficient memory');
    });

    it('should format hardware summary string', () => {
      const detector = new HardwareDetector();
      const summary = detector.formatSummary();
      expect(summary).toContain('Memory:');
      expect(summary).toContain('Model Budget:');
    });
  });

  describe('ModelStore', () => {
    it('should store, retrieve, list, and remove models', () => {
      const store = new ModelStore(tmpDir);

      expect(store.list()).toHaveLength(0);
      expect(store.has('qwen3-coder:30b')).toBe(false);

      const fakeModelFile = path.join(tmpDir, 'model.bin');
      fs.writeFileSync(fakeModelFile, 'dummy weight data');

      const desc: ModelDescriptor = {
        id: 'qwen3-coder:30b',
        name: 'Qwen3 Coder',
        runtime: 'mlx',
        source: 'local',
        architecture: 'qwen',
        parameters: '30B',
        context_length: 131072,
        capabilities: ['chat', 'code'],
        file_path: fakeModelFile,
        hardware_requirements: {
          min_memory_bytes: 16 * 1024 * 1024 * 1024,
          recommended_memory_bytes: 32 * 1024 * 1024 * 1024,
          gpu_required: false,
          compatible_runtimes: ['mlx'],
        },
      };

      store.add(desc, 1024);
      expect(store.has('qwen3-coder:30b')).toBe(true);
      expect(store.get('qwen3-coder:30b')?.descriptor.id).toBe('qwen3-coder:30b');

      const listOutput = store.formatList();
      expect(listOutput).toContain('qwen3-coder:30b');
      expect(listOutput).toContain('MLX');

      const showOutput = store.formatShow('qwen3-coder:30b');
      expect(showOutput).toContain('Qwen3 Coder');
      expect(showOutput).toContain('Parameters:     30B');

      const removed = store.remove('qwen3-coder:30b');
      expect(removed).toBe(true);
      expect(store.has('qwen3-coder:30b')).toBe(false);
    });

    it('should track cache stats and storage usage', () => {
      const store = new ModelStore(tmpDir);
      const desc: ModelDescriptor = {
        id: 'test-m1',
        name: 'Test M1',
        runtime: 'gguf',
        source: 'local',
        architecture: 'llama',
        parameters: '7B',
        context_length: 4096,
        capabilities: ['chat'],
        hardware_requirements: {
          min_memory_bytes: 4 * 1024 * 1024 * 1024,
          recommended_memory_bytes: 8 * 1024 * 1024 * 1024,
          gpu_required: false,
          compatible_runtimes: ['gguf'],
        },
      };

      store.add(desc, 5000000);
      const stats = store.getCacheStats();
      expect(stats.modelCount).toBe(1);
      expect(stats.totalSizeBytes).toBe(5000000);
      expect(stats.modelsDir).toBe(tmpDir);
    });
  });

  describe('ModelManager', () => {
    it('should search built-in registry', () => {
      const manager = new ModelManager({ modelsDir: tmpDir });
      const results = manager.search('qwen');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toContain('qwen');

      const deepseek = manager.search('deepseek');
      expect(deepseek.length).toBeGreaterThan(0);
      expect(deepseek[0].id).toContain('deepseek');
    });

    it('should format show output from store', () => {
      const manager = new ModelManager({ modelsDir: tmpDir });
      expect(manager.show('nonexistent')).toBeNull();
    });
  });

  describe('RuntimeManager', () => {
    it('should discover runtimes and report statuses', async () => {
      const manager = new RuntimeManager();
      await manager.initialize();

      const statuses = await manager.getStatuses();
      expect(statuses.length).toBeGreaterThanOrEqual(2);

      const statusIds = statuses.map((s) => s.id);
      expect(statusIds).toContain('cpu');
      expect(statusIds).toContain('gguf');

      const formatted = await manager.formatRuntimeList();
      expect(formatted).toContain('LOCAL RUNTIMES');
    });

    it('should auto-select compatible runtime for model', async () => {
      const manager = new RuntimeManager();
      await manager.initialize();

      const ggufModel: ModelDescriptor = {
        id: 'phi-gguf',
        name: 'Phi GGUF',
        runtime: 'gguf',
        source: 'local',
        architecture: 'phi',
        parameters: '3.8B',
        context_length: 4096,
        capabilities: ['chat'],
        hardware_requirements: {
          min_memory_bytes: 2 * 1024 * 1024 * 1024,
          recommended_memory_bytes: 4 * 1024 * 1024 * 1024,
          gpu_required: false,
          compatible_runtimes: ['gguf'],
        },
      };

      const runtime = manager.selectRuntime(ggufModel);
      expect(runtime).not.toBeNull();
      expect(runtime?.type).toBe('gguf');
    });
  });
});
