/**
 * @berkelium/runtime — GGUF Runtime Adapter
 *
 * Provides inference for GGUF-format models via llama.cpp's server.
 * Spawns llama-server as a subprocess with an OpenAI-compatible API.
 *
 * Supports any platform (macOS, Linux, Windows) where llama-server is available.
 */

import { ChildProcess, spawn, execSync } from 'node:child_process';
import type {
  RuntimeAdapter, RuntimeType, ModelDescriptor, GenerateRequest, GenerateResponse,
  StreamChunk, ChatMessage, ChatOptions, TokenizeResult, RuntimeHealth,
  RuntimeMetadata, RuntimeCapabilities, LoadedModel, ModelStatus,
} from '../types.js';

const GGUF_DEFAULT_PORT = 8322;
const GGUF_STARTUP_TIMEOUT_MS = 60000;
const GGUF_HEALTH_CHECK_INTERVAL_MS = 2000;

interface LoadedGGUFModel {
  descriptor: ModelDescriptor;
  status: ModelStatus;
  loaded_at: number;
  process: ChildProcess | null;
  port: number;
  requests_served: number;
}

export class GGUFAdapter implements RuntimeAdapter {
  public readonly id = 'gguf';
  public readonly name = 'GGUF (llama.cpp)';
  public readonly type: RuntimeType = 'gguf';

  private loadedModels: Map<string, LoadedGGUFModel> = new Map();
  private serverPath: string;
  private basePort: number;
  private pendingCancellations: Set<string> = new Set();

  constructor(options?: { serverPath?: string; basePort?: number }) {
    this.serverPath = options?.serverPath || this.findLlamaServer();
    this.basePort = options?.basePort || GGUF_DEFAULT_PORT;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  public async load(model: ModelDescriptor): Promise<void> {
    if (this.loadedModels.has(model.id)) {
      const existing = this.loadedModels.get(model.id)!;
      if (existing.status === 'ready') return;
    }

    if (!model.file_path) {
      throw new Error(`GGUF model ${model.id} has no file_path specified. Run \`berkelium pull ${model.id}\` first.`);
    }

    const port = this.basePort + this.loadedModels.size;

    const entry: LoadedGGUFModel = {
      descriptor: model,
      status: 'loading',
      loaded_at: Date.now(),
      process: null,
      port,
      requests_served: 0,
    };
    this.loadedModels.set(model.id, entry);

    try {
      const args = [
        '-m', model.file_path,
        '--port', String(port),
        '--host', '127.0.0.1',
        '-c', String(Math.min(model.context_length, 32768)), // Cap context for memory
        '-ngl', '999', // Offload all layers to GPU
        '--no-mmap', // More predictable memory usage
      ];

      const proc = spawn(this.serverPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      entry.process = proc;

      proc.on('exit', (code) => {
        const existing = this.loadedModels.get(model.id);
        if (existing) {
          existing.status = code === 0 ? 'unloaded' : 'error';
          existing.process = null;
        }
      });

      proc.on('error', () => {
        const existing = this.loadedModels.get(model.id);
        if (existing) {
          existing.status = 'error';
          existing.process = null;
        }
      });

      await this.waitForServer(port, GGUF_STARTUP_TIMEOUT_MS);
      entry.status = 'ready';
    } catch (err: any) {
      entry.status = 'error';
      if (entry.process) {
        entry.process.kill('SIGTERM');
        entry.process = null;
      }
      throw new Error(`Failed to load model ${model.id} via GGUF: ${err.message}`);
    }
  }

  public async unload(modelId: string): Promise<void> {
    const entry = this.loadedModels.get(modelId);
    if (!entry) return;

    if (entry.process) {
      entry.process.kill('SIGTERM');
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
      model: 'gguf',
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
      throw new Error(`GGUF server error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error('No response body from GGUF server');
    yield* this.parseSSEStream(res.body, entry);
  }

  public async *chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<StreamChunk> {
    const entry = this.getLoadedModelOrThrow();
    const url = `http://127.0.0.1:${entry.port}/v1/chat/completions`;

    const formattedMessages = [...messages];
    if (options.system_prompt) {
      formattedMessages.unshift({ role: 'system', content: options.system_prompt });
    }

    const payload: Record<string, unknown> = {
      model: options.model,
      messages: formattedMessages.map(m => ({
        role: m.role,
        content: m.content || '',
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature ?? 0.2,
      stream: true,
    };

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GGUF chat error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error('No response body from GGUF server');
    yield* this.parseSSEStream(res.body, entry);
  }

  // ── Utility ────────────────────────────────────────────────────────────

  public async embed(_text: string | string[]): Promise<number[][]> {
    throw new Error('Embeddings not yet supported in GGUF adapter.');
  }

  public async tokenize(_text: string): Promise<TokenizeResult> {
    const approxTokens = Math.ceil(_text.length / 4);
    return { tokens: [], count: approxTokens };
  }

  // ── Status ─────────────────────────────────────────────────────────────

  public async health(): Promise<RuntimeHealth> {
    const isInstalled = this.isLlamaServerInstalled();
    const modelsLoaded = this.loadedModels.size;

    return {
      status: !isInstalled ? 'unavailable' : 'ready',
      runtime: 'gguf',
      message: !isInstalled
        ? 'llama-server not found. Install llama.cpp or set BERKELIUM_LLAMA_SERVER_PATH.'
        : undefined,
      models_loaded: modelsLoaded,
    };
  }

  public metadata(): RuntimeMetadata {
    return {
      id: 'gguf',
      name: 'GGUF (llama.cpp)',
      version: this.getLlamaVersion(),
      runtime_type: 'gguf',
      supported_architectures: ['llama', 'qwen', 'mistral', 'gemma', 'phi', 'starcoder', 'deepseek', 'falcon'],
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
      concurrent_models: false,
      hot_swap: false,
    };
  }

  public cancel(_requestId: string): void {
    this.pendingCancellations.add(_requestId);
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

  public isLlamaServerInstalled(): boolean {
    try {
      execSync(`${this.serverPath} --version`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  // ── Private ────────────────────────────────────────────────────────────

  private findLlamaServer(): string {
    // Check env var first
    if (process.env.BERKELIUM_LLAMA_SERVER_PATH) {
      return process.env.BERKELIUM_LLAMA_SERVER_PATH;
    }
    // Check common paths
    const candidates = ['llama-server', 'llama-cpp-server', '/usr/local/bin/llama-server'];
    for (const cmd of candidates) {
      try {
        execSync(`which ${cmd}`, { stdio: 'pipe' });
        return cmd;
      } catch {
        continue;
      }
    }
    return 'llama-server'; // Default, will fail gracefully if not found
  }

  private getLoadedModelOrThrow(): LoadedGGUFModel {
    const readyModels = [...this.loadedModels.values()].filter(m => m.status === 'ready');
    if (readyModels.length === 0) {
      throw new Error('No GGUF model is currently loaded. Run `berkelium run <model>` first.');
    }
    return readyModels[readyModels.length - 1];
  }

  private async waitForServer(port: number, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`);
        if (res.ok) return;
      } catch {
        // Server not ready
      }
      await new Promise(r => setTimeout(r, GGUF_HEALTH_CHECK_INTERVAL_MS));
    }
    throw new Error(`GGUF server failed to start within ${timeoutMs}ms on port ${port}`);
  }

  private async *parseSSEStream(body: ReadableStream<Uint8Array>, entry: LoadedGGUFModel): AsyncIterable<StreamChunk> {
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
              } else if (choice?.text) {
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

  private getLlamaVersion(): string {
    try {
      return execSync(`${this.serverPath} --version`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim().split('\n')[0];
    } catch {
      return 'unknown';
    }
  }
}
