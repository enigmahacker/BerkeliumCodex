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

import { ChildProcess, spawn, execSync } from 'node:child_process';
import type {
  RuntimeAdapter, RuntimeType, ModelDescriptor, GenerateRequest, GenerateResponse,
  StreamChunk, ChatMessage, ChatOptions, TokenizeResult, RuntimeHealth,
  RuntimeMetadata, RuntimeCapabilities, LoadedModel, ModelStatus,
} from '../types.js';

const MLX_DEFAULT_PORT = 8321;
const MLX_STARTUP_TIMEOUT_MS = 30000;
const MLX_HEALTH_CHECK_INTERVAL_MS = 1000;

interface LoadedMLXModel {
  descriptor: ModelDescriptor;
  status: ModelStatus;
  loaded_at: number;
  process: ChildProcess | null;
  port: number;
  requests_served: number;
}

export class MLXAdapter implements RuntimeAdapter {
  public readonly id = 'mlx';
  public readonly name = 'Apple MLX';
  public readonly type: RuntimeType = 'mlx';

  private loadedModels: Map<string, LoadedMLXModel> = new Map();
  private pythonPath: string;
  private basePort: number;
  private pendingCancellations: Set<string> = new Set();

  constructor(options?: { pythonPath?: string; basePort?: number }) {
    this.pythonPath = options?.pythonPath || 'python3';
    this.basePort = options?.basePort || MLX_DEFAULT_PORT;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  public async load(model: ModelDescriptor): Promise<void> {
    if (this.loadedModels.has(model.id)) {
      const existing = this.loadedModels.get(model.id)!;
      if (existing.status === 'ready') return;
    }

    const port = this.basePort + this.loadedModels.size;

    const entry: LoadedMLXModel = {
      descriptor: model,
      status: 'loading',
      loaded_at: Date.now(),
      process: null,
      port,
      requests_served: 0,
    };
    this.loadedModels.set(model.id, entry);

    try {
      // Spawn mlx_lm.server
      const modelPath = model.file_path || model.id;
      const proc = spawn(this.pythonPath, [
        '-m', 'mlx_lm.server',
        '--model', modelPath,
        '--port', String(port),
        '--host', '127.0.0.1',
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      });

      entry.process = proc;

      // Handle process exit
      proc.on('exit', (code) => {
        const existing = this.loadedModels.get(model.id);
        if (existing) {
          existing.status = code === 0 ? 'unloaded' : 'error';
          existing.process = null;
        }
      });

      proc.on('error', (err) => {
        const existing = this.loadedModels.get(model.id);
        if (existing) {
          existing.status = 'error';
          existing.process = null;
        }
      });

      // Wait for server to be ready
      await this.waitForServer(port, MLX_STARTUP_TIMEOUT_MS);
      entry.status = 'ready';
    } catch (err: any) {
      entry.status = 'error';
      if (entry.process) {
        entry.process.kill('SIGTERM');
        entry.process = null;
      }
      throw new Error(`Failed to load model ${model.id} via MLX: ${err.message}`);
    }
  }

  public async unload(modelId: string): Promise<void> {
    const entry = this.loadedModels.get(modelId);
    if (!entry) return;

    if (entry.process) {
      entry.process.kill('SIGTERM');
      // Give it a moment to clean up
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (entry.process) entry.process.kill('SIGKILL');
          resolve();
        }, 5000);

        entry.process!.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.loadedModels.delete(modelId);
  }

  // ── Inference ──────────────────────────────────────────────────────────

  public async generate(request: GenerateRequest): Promise<GenerateResponse> {
    let fullText = '';
    let tokenCount = 0;
    const start = performance.now();

    for await (const chunk of this.stream(request)) {
      if (chunk.type === 'token' && chunk.text) {
        fullText += chunk.text;
        tokenCount++;
      }
    }

    return {
      text: fullText,
      tokens_generated: tokenCount,
      tokens_prompt: 0,
      duration_ms: Math.round(performance.now() - start),
      model: 'mlx',
    };
  }

  public async *stream(request: GenerateRequest): AsyncIterable<StreamChunk> {
    const entry = this.getLoadedModelOrThrow();
    const url = `http://127.0.0.1:${entry.port}/v1/completions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        max_tokens: request.max_tokens || 2048,
        temperature: request.temperature ?? 0.2,
        stream: true,
        stop: request.stop,
      }),
      signal: request.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`MLX server error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error('No response body from MLX server');

    yield* this.parseSSEStream(res.body, entry);
  }

  public async *chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<StreamChunk> {
    const entry = this.getLoadedModelOrThrow();
    const url = `http://127.0.0.1:${entry.port}/v1/chat/completions`;

    const payload: Record<string, unknown> = {
      model: options.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content || '',
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature ?? 0.2,
      stream: true,
    };

    if (options.system_prompt) {
      (payload.messages as any[]).unshift({ role: 'system', content: options.system_prompt });
    }

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      payload.tool_choice = 'auto';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`MLX chat error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error('No response body from MLX server');

    yield* this.parseSSEStream(res.body, entry);
  }

  // ── Utility ────────────────────────────────────────────────────────────

  public async embed(_text: string | string[]): Promise<number[][]> {
    throw new Error('Embeddings not yet supported in MLX adapter. Use a dedicated embedding model.');
  }

  public async tokenize(_text: string): Promise<TokenizeResult> {
    // MLX doesn't expose a tokenize endpoint by default
    // Use a rough approximation (4 chars per token)
    const approxTokens = Math.ceil(_text.length / 4);
    return { tokens: [], count: approxTokens };
  }

  // ── Status ─────────────────────────────────────────────────────────────

  public async health(): Promise<RuntimeHealth> {
    const isInstalled = this.isMLXInstalled();
    const modelsLoaded = this.loadedModels.size;
    const readyModels = [...this.loadedModels.values()].filter(m => m.status === 'ready').length;

    return {
      status: !isInstalled ? 'unavailable' : readyModels > 0 ? 'ready' : 'ready',
      runtime: 'mlx',
      message: !isInstalled ? 'mlx-lm not found. Install with: pip install mlx-lm' : undefined,
      models_loaded: modelsLoaded,
    };
  }

  public metadata(): RuntimeMetadata {
    return {
      id: 'mlx',
      name: 'Apple MLX',
      version: this.getMLXVersion(),
      runtime_type: 'mlx',
      supported_architectures: ['llama', 'qwen', 'mistral', 'gemma', 'phi', 'starcoder', 'deepseek'],
      supports_streaming: true,
      supports_tool_calling: true,
      supports_vision: false,
    };
  }

  public capabilities(): RuntimeCapabilities {
    return {
      streaming: true,
      tool_calling: true,
      vision: false,
      reasoning: true,
      embeddings: false,
      structured_output: true,
      concurrent_models: true,
      hot_swap: true,
    };
  }

  public cancel(requestId: string): void {
    this.pendingCancellations.add(requestId);
  }

  public listLoaded(): LoadedModel[] {
    return [...this.loadedModels.values()].map(entry => ({
      descriptor: entry.descriptor,
      status: entry.status,
      loaded_at: entry.loaded_at,
      memory_used_bytes: entry.descriptor.hardware_requirements.min_memory_bytes,
      requests_served: entry.requests_served,
      process_pid: entry.process?.pid,
    }));
  }

  // ── Detection ──────────────────────────────────────────────────────────

  private static mlxCheckDone = false;
  private static mlxInstalled = false;
  private static mlxVersion = 'not installed';

  private checkMLX(): void {
    if (MLXAdapter.mlxCheckDone) return;
    MLXAdapter.mlxCheckDone = true;
    try {
      const ver = execSync(
        `${this.pythonPath} -c "import mlx_lm; print(mlx_lm.__version__)"`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 4000 }
      ).trim();
      MLXAdapter.mlxInstalled = true;
      MLXAdapter.mlxVersion = ver || 'installed';
    } catch {
      MLXAdapter.mlxInstalled = false;
      MLXAdapter.mlxVersion = 'not installed';
    }
  }

  public isMLXInstalled(): boolean {
    this.checkMLX();
    return MLXAdapter.mlxInstalled;
  }

  private getMLXVersion(): string {
    this.checkMLX();
    return MLXAdapter.mlxVersion;
  }

  // ── Private Methods ────────────────────────────────────────────────────

  private getLoadedModelOrThrow(): LoadedMLXModel {
    const readyModels = [...this.loadedModels.values()].filter(m => m.status === 'ready');
    if (readyModels.length === 0) {
      throw new Error('No MLX model is currently loaded. Run `berkelium run <model>` first.');
    }
    return readyModels[readyModels.length - 1]; // Most recently loaded
  }

  private async waitForServer(port: number, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/v1/models`);
        if (res.ok) return;
      } catch {
        // Server not ready yet
      }
      await new Promise(r => setTimeout(r, MLX_HEALTH_CHECK_INTERVAL_MS));
    }
    throw new Error(`MLX server failed to start within ${timeoutMs}ms on port ${port}`);
  }

  private async *parseSSEStream(body: ReadableStream<Uint8Array>, entry: LoadedMLXModel): AsyncIterable<StreamChunk> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            entry.requests_served++;
            yield { type: 'finish', finish_reason: 'stop' };
            return;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const choice = parsed.choices?.[0];
              if (choice?.delta?.content) {
                yield { type: 'token', text: choice.delta.content };
              } else if (choice?.delta?.tool_calls) {
                for (const tc of choice.delta.tool_calls) {
                  yield {
                    type: 'tool_call',
                    tool_call: {
                      id: tc.id,
                      name: tc.function?.name,
                      arguments_delta: tc.function?.arguments,
                    },
                  };
                }
              } else if (choice?.text) {
                // Completions endpoint format
                yield { type: 'token', text: choice.text };
              }
              if (parsed.usage) {
                yield {
                  type: 'usage',
                  usage: {
                    prompt_tokens: parsed.usage.prompt_tokens || 0,
                    completion_tokens: parsed.usage.completion_tokens || 0,
                    total_tokens: parsed.usage.total_tokens || 0,
                  },
                };
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
