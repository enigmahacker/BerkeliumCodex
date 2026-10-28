import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ConfigManager } from '@berkelium/config';
import {
  fetchWithTimeout,
  OpenRouterProvider,
  Provider,
  ProviderCapabilities,
  ProviderRequestOptions,
  ProviderRouter,
  Message,
  NormalizedChunk,
  NormalizedResponse,
} from '@berkelium/providers';
import { AuthStore } from '@berkelium/auth';
import { Logger } from '@berkelium/logging';

const MESSAGES: Message[] = [{ role: 'user', content: 'hello' }];

class StubProvider implements Provider {
  public streamCalls = 0;
  public lastOptions?: ProviderRequestOptions;

  constructor(
    public readonly id: string,
    private readonly behaviour: {
      local?: boolean;
      healthy?: boolean;
      chunks?: NormalizedChunk[];
      failAfterChunks?: Error;
      failImmediately?: Error;
    } = {}
  ) {}

  public capabilities(): ProviderCapabilities {
    return {
      streaming: true,
      tool_calling: true,
      vision: false,
      reasoning: false,
      structured_output: true,
      embeddings: false,
      model_discovery: true,
    };
  }

  public async isAvailable(): Promise<boolean> {
    return this.behaviour.healthy ?? true;
  }

  public isLocal(): boolean {
    return this.behaviour.local ?? false;
  }

  public async listModels() {
    return [{ id: `${this.id}-model`, name: `${this.id} model`, provider: this.id, context_length: 4096, capabilities: {} }];
  }

  public getDefaultModels() {
    return [{ id: `${this.id}-model`, name: `${this.id} model`, provider: this.id, context_length: 4096, capabilities: {} }];
  }

  public async *stream(
    _messages: Message[],
    options: ProviderRequestOptions
  ): AsyncIterable<NormalizedChunk> {
    this.streamCalls++;
    this.lastOptions = options;
    if (this.behaviour.failImmediately) {
      throw this.behaviour.failImmediately;
    }
    for (const chunk of this.behaviour.chunks ?? []) {
      yield chunk;
    }
    if (this.behaviour.failAfterChunks) {
      throw this.behaviour.failAfterChunks;
    }
  }

  public async generate(): Promise<NormalizedResponse> {
    return {
      text: '',
      toolCalls: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: 'stop',
      model: `${this.id}-model`,
      provider: this.id,
    };
  }
}

function buildRouter(providers: Provider[], routingFallback: string[]): ProviderRouter {
  const manager = new ConfigManager(tempWorkspace);
  manager.setSessionOverride({
    routing: { primary: 'openrouter/coding', fallback: routingFallback },
  } as any);
  const router = new ProviderRouter(manager.getConfig(), new Logger({ subsystem: 'contract-test' }));
  for (const provider of providers) {
    router.registerProvider(provider);
  }
  return router;
}

async function collect(stream: AsyncIterable<NormalizedChunk>): Promise<NormalizedChunk[]> {
  const chunks: NormalizedChunk[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}

let tempWorkspace: string;
let tempGlobalConfig: string;
const originalGlobalConfigDir = process.env.BERKELIUM_GLOBAL_CONFIG_DIR;

beforeEach(() => {
  tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-contracts-workspace-'));
  tempGlobalConfig = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-contracts-global-'));
  process.env.BERKELIUM_GLOBAL_CONFIG_DIR = tempGlobalConfig;
});

afterEach(() => {
  if (originalGlobalConfigDir === undefined) {
    delete process.env.BERKELIUM_GLOBAL_CONFIG_DIR;
  } else {
    process.env.BERKELIUM_GLOBAL_CONFIG_DIR = originalGlobalConfigDir;
  }
  for (const dir of [tempWorkspace, tempGlobalConfig]) {
    if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Configuration contract', () => {
  it('deep-merges partial session overrides instead of replacing whole sections', () => {
    const manager = new ConfigManager(tempWorkspace);
    manager.setSessionOverride({
      providers: { ollama: { base_url: 'http://127.0.0.1:19999' } },
    } as any);

    const config = manager.getConfig();
    expect(config.providers.ollama.base_url).toBe('http://127.0.0.1:19999');
    expect(config.providers.ollama.timeout_ms).toBe(60000);
    expect(config.providers.ollama.enabled).toBe(true);
    expect(config.providers.openrouter.base_url).toBe('https://openrouter.ai/api/v1');
  });

  it('applies CLI overrides above session overrides and project config', () => {
    fs.mkdirSync(path.join(tempWorkspace, '.berkelium'), { recursive: true });
    fs.writeFileSync(
      path.join(tempWorkspace, '.berkelium', 'config.json'),
      JSON.stringify({ effort: 'high' })
    );

    const manager = new ConfigManager(tempWorkspace);
    manager.setSessionOverride({ effort: 'low' });
    expect(manager.getConfig().effort).toBe('low');

    manager.setCliOverrides({ effort: 'max' });
    expect(manager.getConfig().effort).toBe('max');
  });

  it('lets project configuration win over global configuration for the same key', () => {
    fs.writeFileSync(
      path.join(tempGlobalConfig, 'config.json'),
      JSON.stringify({ models: { shared: { provider: 'groq', model: 'global-model' } } })
    );
    fs.mkdirSync(path.join(tempWorkspace, '.berkelium'), { recursive: true });
    fs.writeFileSync(
      path.join(tempWorkspace, '.berkelium', 'config.json'),
      JSON.stringify({ models: { shared: { provider: 'gemini', model: 'project-model' } } })
    );

    const config = new ConfigManager(tempWorkspace).getConfig();
    expect(config.models.shared.provider).toBe('gemini');
    expect(config.models.shared.model).toBe('project-model');
  });

  it('fails closed when a config file is malformed instead of silently ignoring it', () => {
    fs.mkdirSync(path.join(tempWorkspace, '.berkelium'), { recursive: true });
    fs.writeFileSync(path.join(tempWorkspace, '.berkelium', 'config.json'), '{ not json');

    expect(() => new ConfigManager(tempWorkspace)).toThrow(/Failed to parse config file/);
  });

  it('rejects config files whose root is not an object', () => {
    fs.mkdirSync(path.join(tempWorkspace, '.berkelium'), { recursive: true });
    fs.writeFileSync(path.join(tempWorkspace, '.berkelium', 'config.json'), '["unexpected"]');

    expect(() => new ConfigManager(tempWorkspace)).toThrow(/must contain an object/);
  });

  it('persists only changed keys and writes an owner-only file atomically', () => {
    const manager = new ConfigManager(tempWorkspace);
    expect(manager.setEffort('low')).toBe(true);

    const configPath = path.join(tempWorkspace, '.berkelium', 'config.json');
    const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    expect(written).toEqual({ effort: 'low' });
    expect(fs.statSync(configPath).mode & 0o777).toBe(0o600);
    expect(fs.readdirSync(path.join(tempWorkspace, '.berkelium'))).toEqual(['config.json']);
  });

  it('reports persistence failure instead of claiming success', () => {
    const configDir = path.join(tempWorkspace, '.berkelium');
    fs.writeFileSync(configDir, 'this blocks the config directory');

    const manager = new ConfigManager(tempWorkspace);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(manager.setDefaultModel('local')).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist config'),
      expect.anything()
    );
  });
});

describe('Router contract', () => {
  it('rejects empty model identifiers', () => {
    const router = buildRouter([new StubProvider('openrouter')], []);
    expect(() => router.resolveTarget('   ')).toThrow(/cannot be empty/);
  });

  it('rejects a local/ target that resolves to a cloud provider', () => {
    const router = buildRouter([new StubProvider('openrouter', { local: false })], []);
    expect(() => router.resolveTarget('local/openrouter/some-model')).toThrow(/not local/);
  });

  it('rejects a cloud/ target that resolves to a local provider', () => {
    const router = buildRouter([new StubProvider('ollama', { local: true })], []);
    expect(() => router.resolveTarget('cloud/ollama/some-model')).toThrow(/is local/);
  });

  it('keeps custom/ unconstrained', () => {
    const router = buildRouter([new StubProvider('groq', { local: false })], []);
    const target = router.resolveTarget('custom/groq/some-model');
    expect(target.providerId).toBe('groq');
    expect(target.category).toBe('custom');
  });

  it('throws for a provider that exposes no model when no alias is configured', () => {
    const base = new StubProvider('acme');
    const modelLess: Provider = {
      id: 'acme',
      name: 'Acme Inference',
      capabilities: () => base.capabilities(),
      isAvailable: () => base.isAvailable(),
      isLocal: () => false,
      listModels: () => base.listModels(),
      stream: (messages, options) => base.stream(messages, options),
      generate: () => base.generate(),
    };
    const router = buildRouter([modelLess], []);
    expect(() => router.resolveTarget('acme')).toThrow(/no configured model/);
  });

  it('applies alias generation settings while letting explicit request options win', async () => {
    const manager = new ConfigManager(tempWorkspace);
    manager.setSessionOverride({
      models: {
        tuned: {
          provider: 'openrouter',
          model: 'tuned-model',
          temperature: 0.1,
          max_tokens: 1234,
        },
      },
    } as any);
    const router = new ProviderRouter(manager.getConfig(), new Logger({ subsystem: 'contract-test' }));
    const provider = new StubProvider('openrouter');
    router.registerProvider(provider);

    await collect(router.streamWithFallback(MESSAGES, { model: 'ignored' }, 'tuned'));
    expect(provider.lastOptions?.temperature).toBe(0.1);
    expect(provider.lastOptions?.maxTokens).toBe(1234);

    await collect(
      router.streamWithFallback(MESSAGES, { model: 'ignored', temperature: 0.9, maxTokens: 99 }, 'tuned')
    );
    expect(provider.lastOptions?.temperature).toBe(0.9);
    expect(provider.lastOptions?.maxTokens).toBe(99);
  });

  it('authorizes every fallback candidate before streaming and injects the configured timeout', async () => {
    const openrouter = new StubProvider('openrouter', { healthy: false });
    const nvidia = new StubProvider('nvidia', { healthy: false });
    const ollama = new StubProvider('ollama', {
      local: true,
      chunks: [{ type: 'token', text: 'local reply' }],
    });
    const router = buildRouter([openrouter, nvidia, ollama], ['nvidia/coding', 'ollama/local']);

    const authorized: string[] = [];
    const chunks = await collect(
      router.streamWithFallback(
        MESSAGES,
        { model: 'ignored' },
        'openrouter/coding',
        async (target) => {
          authorized.push(target.providerId);
        }
      )
    );

    expect(authorized).toEqual(['openrouter', 'nvidia', 'ollama']);
    expect(chunks).toEqual([{ type: 'token', text: 'local reply' }]);
    expect(ollama.lastOptions?.timeoutMs).toBe(60000);
  });

  it('propagates an authorization denial without falling back', async () => {
    const openrouter = new StubProvider('openrouter');
    const nvidia = new StubProvider('nvidia');
    const router = buildRouter([openrouter, nvidia], ['nvidia/coding']);

    await expect(
      collect(
        router.streamWithFallback(MESSAGES, { model: 'ignored' }, 'openrouter/coding', async () => {
          throw new Error('Cloud escalation denied by user.');
        })
      )
    ).rejects.toThrow(/denied by user/);

    expect(openrouter.streamCalls).toBe(0);
    expect(nvidia.streamCalls).toBe(0);
  });

  it('does not fall back after partial output was already yielded', async () => {
    const openrouter = new StubProvider('openrouter', {
      chunks: [{ type: 'token', text: 'partial' }],
      failAfterChunks: new Error('connection reset'),
    });
    const nvidia = new StubProvider('nvidia');
    const router = buildRouter([openrouter, nvidia], ['nvidia/coding']);

    const received: NormalizedChunk[] = [];
    await expect(
      (async () => {
        for await (const chunk of router.streamWithFallback(
          MESSAGES,
          { model: 'ignored' },
          'openrouter/coding'
        )) {
          received.push(chunk);
        }
      })()
    ).rejects.toThrow(/connection reset/);

    expect(received).toEqual([{ type: 'token', text: 'partial' }]);
    expect(nvidia.streamCalls).toBe(0);
  });

  it('honours caller abort before contacting any provider', async () => {
    const openrouter = new StubProvider('openrouter');
    const router = buildRouter([openrouter], []);
    const controller = new AbortController();
    controller.abort();

    await expect(
      collect(
        router.streamWithFallback(
          MESSAGES,
          { model: 'ignored', signal: controller.signal },
          'openrouter/coding'
        )
      )
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(openrouter.streamCalls).toBe(0);
  });
});

describe('Request timeout contract', () => {
  function hangUntilAborted(): typeof fetch {
    return ((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })) as typeof fetch;
  }

  it('aborts the header phase after the configured timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(hangUntilAborted());

    const pending = fetchWithTimeout('https://api.example.com/v1/chat', {}, 25);
    const assertion = expect(pending).rejects.toThrow(/timed out after 25ms/);
    await vi.advanceTimersByTimeAsync(30);
    await assertion;
  });

  it('propagates a caller abort without misreporting it as a timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(hangUntilAborted());
    const controller = new AbortController();

    const pending = fetchWithTimeout(
      'https://api.example.com/v1/chat',
      { signal: controller.signal },
      60000
    );
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
  });

  it('applies the per-request timeout override inside provider streams', async () => {
    vi.useFakeTimers();
    process.env.OPENROUTER_API_KEY = 'test-key';
    const authStore = new AuthStore({ vaultPath: path.join(tempWorkspace, 'vault.json') });
    vi.spyOn(authStore['keychain'], 'getPassword').mockResolvedValue(null);
    vi.spyOn(globalThis, 'fetch').mockImplementation(hangUntilAborted());

    const provider = new OpenRouterProvider(authStore, undefined, undefined, 60000);
    const iterator = provider
      .stream(MESSAGES, { model: 'openrouter/test-model', timeoutMs: 25 })
      [Symbol.asyncIterator]();
    const next = iterator.next();
    const assertion = expect(next).rejects.toThrow(/timed out after 25ms/);

    await vi.advanceTimersByTimeAsync(30);
    await assertion;
    delete process.env.OPENROUTER_API_KEY;
  });
});
