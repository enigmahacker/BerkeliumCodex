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
import * as fs from 'node:fs';
import { ModelStore } from './model-store.js';
import { RuntimeManager } from './runtime-manager.js';
import { HardwareDetector } from './hardware.js';
// ── Built-in Model Registry ──────────────────────────────────────────────
// These are the "official" models that Berkelium knows how to pull.
// Users can also pull arbitrary HuggingFace models by full path.
const BUILTIN_REGISTRY = [
    {
        id: 'qwen3-coder',
        name: 'Qwen3 Coder',
        description: 'Alibaba Qwen3 optimized for software engineering',
        architecture: 'qwen',
        parameters: '30B',
        quantizations: ['4bit', 'fp16'],
        context_length: 131072,
        capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'streaming'],
        license: 'Apache 2.0',
        source_url: 'https://huggingface.co/mlx-community/Qwen3-Coder-30B-A3B-4bit',
        versions: [
            {
                version: '1.0',
                checksum: '',
                file_size_bytes: 17_000_000_000,
                quantization: '4bit',
                runtime_compatibility: ['mlx'],
            },
        ],
    },
    {
        id: 'deepseek-v3',
        name: 'DeepSeek V3',
        description: 'DeepSeek V3 frontier MoE model',
        architecture: 'deepseek',
        parameters: '671B',
        quantizations: ['4bit'],
        context_length: 131072,
        capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'streaming'],
        license: 'MIT',
        source_url: 'https://huggingface.co/mlx-community/DeepSeek-V3-4bit',
        versions: [
            {
                version: '1.0',
                checksum: '',
                file_size_bytes: 350_000_000_000,
                quantization: '4bit',
                runtime_compatibility: ['mlx'],
            },
        ],
    },
    {
        id: 'llama-4-scout',
        name: 'Llama 4 Scout',
        description: 'Meta Llama 4 Scout — efficient MoE model',
        architecture: 'llama',
        parameters: '17B',
        quantizations: ['4bit', 'fp16'],
        context_length: 131072,
        capabilities: ['chat', 'code', 'vision', 'tool_calling', 'streaming'],
        license: 'Llama 4 License',
        source_url: 'https://huggingface.co/mlx-community/Llama-4-Scout-17B-16E-Instruct-4bit',
        versions: [
            {
                version: '1.0',
                checksum: '',
                file_size_bytes: 10_000_000_000,
                quantization: '4bit',
                runtime_compatibility: ['mlx'],
            },
        ],
    },
    {
        id: 'phi-4-mini',
        name: 'Phi 4 Mini',
        description: 'Microsoft Phi-4 Mini — compact, fast, strong coding',
        architecture: 'phi',
        parameters: '3.8B',
        quantizations: ['4bit', 'fp16'],
        context_length: 131072,
        capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
        license: 'MIT',
        source_url: 'https://huggingface.co/mlx-community/Phi-4-mini-instruct-4bit',
        versions: [
            {
                version: '1.0',
                checksum: '',
                file_size_bytes: 2_500_000_000,
                quantization: '4bit',
                runtime_compatibility: ['mlx', 'gguf'],
            },
        ],
    },
    {
        id: 'gemma-3',
        name: 'Gemma 3',
        description: 'Google Gemma 3 — efficient open model',
        architecture: 'gemma',
        parameters: '12B',
        quantizations: ['4bit', 'fp16'],
        context_length: 131072,
        capabilities: ['chat', 'code', 'reasoning', 'streaming'],
        license: 'Apache 2.0',
        source_url: 'https://huggingface.co/mlx-community/gemma-3-12b-it-4bit',
        versions: [
            {
                version: '1.0',
                checksum: '',
                file_size_bytes: 7_000_000_000,
                quantization: '4bit',
                runtime_compatibility: ['mlx', 'gguf'],
            },
        ],
    },
];
export class ModelManager {
    store;
    runtimeManager;
    hardware;
    registry = new Map();
    constructor(options = {}) {
        this.store = new ModelStore(options.modelsDir);
        this.runtimeManager = options.runtimeManager || new RuntimeManager();
        this.hardware = new HardwareDetector();
        // Load built-in registry
        for (const entry of BUILTIN_REGISTRY) {
            this.registry.set(entry.id, entry);
        }
    }
    // ── Model Operations ───────────────────────────────────────────────────
    /**
     * Pull (download) a model to local storage.
     *
     * Security invariant: Never execute downloaded model files as arbitrary code.
     * Models are binary weight files, not executable scripts.
     */
    async pull(modelId, onProgress) {
        // 1. Check if already installed
        const existing = this.store.get(modelId);
        if (existing) {
            onProgress?.({
                model_id: modelId,
                status: 'complete',
                bytes_downloaded: existing.disk_size_bytes,
                bytes_total: existing.disk_size_bytes,
                percent: 100,
                speed_bps: 0,
                eta_seconds: 0,
                message: 'Model already installed.',
            });
            return existing.descriptor;
        }
        // 2. Resolve from registry
        const registryEntry = this.registry.get(modelId);
        if (!registryEntry) {
            throw new Error(`Model "${modelId}" not found in registry.\n` +
                `Available: ${[...this.registry.keys()].join(', ')}\n` +
                `Or specify a full HuggingFace path: berkelium pull mlx-community/model-name`);
        }
        // 3. Select best version for hardware
        const hw = this.hardware.detect();
        const version = registryEntry.versions.find(v => v.runtime_compatibility.includes(hw.is_apple_silicon ? 'mlx' : 'gguf')) || registryEntry.versions[0];
        // 4. Pre-flight memory check
        const descriptor = this.registryToDescriptor(registryEntry, version);
        const memCheck = this.hardware.canLoadModel(descriptor, this.getCurrentMemoryUsage());
        if (memCheck) {
            // Warn but don't block download — user might want it for later
            onProgress?.({
                model_id: modelId,
                status: 'resolving',
                bytes_downloaded: 0,
                bytes_total: version.file_size_bytes,
                percent: 0,
                speed_bps: 0,
                eta_seconds: 0,
                message: `⚠ Warning: ${memCheck}`,
            });
        }
        // 5. Download using HuggingFace hub
        onProgress?.({
            model_id: modelId,
            status: 'downloading',
            bytes_downloaded: 0,
            bytes_total: version.file_size_bytes,
            percent: 0,
            speed_bps: 0,
            eta_seconds: 0,
            message: `Downloading ${registryEntry.name} (${formatSize(version.file_size_bytes)})...`,
        });
        const modelDir = this.store.getModelPath(modelId);
        await this.downloadFromHuggingFace(registryEntry.source_url, modelDir, version.file_size_bytes, onProgress);
        // 6. Update descriptor with local path
        descriptor.file_path = modelDir;
        descriptor.source = 'local';
        // 7. Register in store
        this.store.add(descriptor, version.file_size_bytes);
        onProgress?.({
            model_id: modelId,
            status: 'complete',
            bytes_downloaded: version.file_size_bytes,
            bytes_total: version.file_size_bytes,
            percent: 100,
            speed_bps: 0,
            eta_seconds: 0,
            message: `✓ ${registryEntry.name} installed.`,
        });
        return descriptor;
    }
    /**
     * Run a local model — load into runtime and prepare for inference.
     */
    async run(modelId) {
        // Ensure runtime is initialized
        await this.runtimeManager.initialize();
        // Get model from store
        const stored = this.store.get(modelId);
        if (!stored) {
            throw new Error(`Model "${modelId}" not found locally. Run \`berkelium pull ${modelId}\` first.`);
        }
        // Pre-flight hardware check
        const memCheck = this.hardware.canLoadModel(stored.descriptor, this.getCurrentMemoryUsage());
        if (memCheck) {
            throw new Error(memCheck);
        }
        // Select runtime
        const runtime = this.runtimeManager.selectRuntime(stored.descriptor);
        if (!runtime) {
            throw new Error(`No compatible runtime found for ${modelId}.\n` +
                'Install mlx-lm (Apple Silicon) or llama.cpp.');
        }
        // Load model
        await runtime.load(stored.descriptor);
        this.store.touch(modelId);
    }
    /**
     * Stop a running model.
     */
    async stop(modelId) {
        for (const adapter of [this.runtimeManager.getAdapter('mlx'), this.runtimeManager.getAdapter('gguf')]) {
            if (adapter) {
                const loaded = adapter.listLoaded().find(m => m.descriptor.id === modelId);
                if (loaded) {
                    await adapter.unload(modelId);
                    return;
                }
            }
        }
        throw new Error(`Model "${modelId}" is not currently running.`);
    }
    /**
     * Remove a model from local storage.
     */
    remove(modelId) {
        return this.store.remove(modelId);
    }
    /**
     * List all locally installed models.
     */
    list() {
        return this.store.list().map(m => ({
            descriptor: m.descriptor,
            disk_size_bytes: m.disk_size_bytes,
            installed_at: m.installed_at,
        }));
    }
    /**
     * Show detailed info for a model.
     */
    show(modelId) {
        return this.store.formatShow(modelId);
    }
    /**
     * Search the model registry.
     */
    search(query) {
        const q = query.toLowerCase();
        return [...this.registry.values()].filter(entry => entry.id.includes(q) ||
            entry.name.toLowerCase().includes(q) ||
            entry.architecture.includes(q) ||
            entry.description?.toLowerCase().includes(q));
    }
    /**
     * Get model store reference.
     */
    getStore() {
        return this.store;
    }
    /**
     * Get runtime manager reference.
     */
    getRuntimeManager() {
        return this.runtimeManager;
    }
    // ── Private Helpers ─────────────────────────────────────────────────────
    registryToDescriptor(entry, version) {
        const hw = this.hardware.detect();
        const runtimeType = hw.is_apple_silicon ? 'mlx' : 'gguf';
        return {
            id: entry.id,
            name: entry.name,
            runtime: runtimeType,
            source: 'registry',
            architecture: entry.architecture,
            parameters: entry.parameters,
            quantization: version.quantization,
            context_length: entry.context_length,
            capabilities: entry.capabilities,
            hardware_requirements: {
                min_memory_bytes: Math.floor(version.file_size_bytes * 1.5),
                recommended_memory_bytes: version.file_size_bytes * 2,
                gpu_required: false,
                compatible_runtimes: version.runtime_compatibility,
            },
            file_size_bytes: version.file_size_bytes,
            checksum: version.checksum || undefined,
            version: version.version,
            license: entry.license,
        };
    }
    getCurrentMemoryUsage() {
        return this.runtimeManager.getAllLoadedModels().reduce((sum, m) => sum + m.memory_used_bytes, 0);
    }
    async downloadFromHuggingFace(url, destDir, totalBytes, onProgress) {
        // Use huggingface_hub Python CLI for robust downloading
        // This handles auth, resuming, and large file downloads
        const { execSync } = await import('node:child_process');
        fs.mkdirSync(destDir, { recursive: true });
        // Extract repo ID from URL
        const repoMatch = url.match(/huggingface\.co\/(.+?)$/);
        if (!repoMatch) {
            throw new Error(`Invalid HuggingFace URL: ${url}`);
        }
        const repoId = repoMatch[1];
        try {
            // Try huggingface-cli download first (robust, handles auth)
            execSync(`python3 -c "from huggingface_hub import snapshot_download; snapshot_download('${repoId}', local_dir='${destDir}')"`, {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 3600000, // 1 hour timeout
                maxBuffer: 50 * 1024 * 1024,
            });
        }
        catch {
            // Fallback: try git clone (slower but more widely available)
            try {
                execSync(`git clone --depth 1 ${url} "${destDir}"`, { stdio: 'pipe', timeout: 3600000 });
            }
            catch (err) {
                throw new Error(`Failed to download model from ${url}.\n` +
                    `Install: pip install huggingface_hub\n` +
                    `Error: ${err.message}`);
            }
        }
    }
}
function formatSize(bytes) {
    if (bytes < 1024 ** 3)
        return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
//# sourceMappingURL=model-manager.js.map