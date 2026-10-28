import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { AgentRuntime } from '@berkelium/agent';
import { AuthStore } from '@berkelium/auth';
import { ConfigManager, CloudEscalationRequest } from '@berkelium/config';
import { ContextEngine } from '@berkelium/context';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import {
  Message,
  ModelInfo,
  NormalizedChunk,
  NormalizedResponse,
  OpenRouterProvider,
  OllamaProvider,
  Provider,
  ProviderRequestOptions,
  ProviderRouter,
} from '@berkelium/providers';
import { SessionManager } from '@berkelium/agent';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';

class CloudMockProvider implements Provider {
  public readonly id = 'cloudmock';
  public readonly name = 'Cloud Mock';
  public streamCalls = 0;

  capabilities() {
    return {
      streaming: true,
      tool_calling: true,
      vision: false,
      reasoning: false,
      structured_output: false,
      embeddings: false,
      model_discovery: false,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  isLocal(): boolean {
    return false;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [];
  }

  async *stream(
    _messages: Message[],
    _options: ProviderRequestOptions
  ): AsyncIterable<NormalizedChunk> {
    this.streamCalls++;
    yield { type: 'token', text: 'approved response' };
    yield {
      type: 'usage',
      usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
    };
    yield { type: 'finish', finishReason: 'stop' };
  }

  async generate(
    _messages: Message[],
    options: ProviderRequestOptions
  ): Promise<NormalizedResponse> {
    return {
      text: 'approved response',
      toolCalls: [],
      usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
      finishReason: 'stop',
      model: options.model,
      provider: this.id,
    };
  }
}

describe('Privacy confirmation and provider endpoint trust', () => {
  const tempDirs: string[] = [];
  const originalGlobalConfigDir = process.env.BERKELIUM_GLOBAL_CONFIG_DIR;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalGlobalConfigDir === undefined) {
      delete process.env.BERKELIUM_GLOBAL_CONFIG_DIR;
    } else {
      process.env.BERKELIUM_GLOBAL_CONFIG_DIR = originalGlobalConfigDir;
    }
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function makeRuntime(
    options: {
      prompt?: string;
      cloudEscalationHandler?: (request: CloudEscalationRequest) => Promise<boolean>;
      sensitivePatterns?: string[];
    } = {}
  ) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-privacy-test-'));
    tempDirs.push(tempDir);
    process.env.BERKELIUM_GLOBAL_CONFIG_DIR = path.join(tempDir, 'global-config');

    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    const current = configManager.getConfig();
    configManager.setSessionOverride({
      privacy: {
        mode: 'balanced',
        cloud_escalation_prompt: true,
        sensitive_patterns: options.sensitivePatterns || [],
      },
      agent: { ...current.agent, max_iterations: 2, verify_changes: false },
    });

    const router = new ProviderRouter(configManager.getConfig(), logger);
    const provider = new CloudMockProvider();
    router.registerProvider(provider);

    const permissionEngine = new PermissionEngine(
      tempDir,
      configManager.getConfig().permissions,
      eventBus
    );
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      tempDir,
      eventBus
    );
    const contextEngine = new ContextEngine(tempDir, logger);
    const errors: string[] = [];
    eventBus.on('error', (event) => errors.push(event.message));

    const runtime = new AgentRuntime({
      workspaceRoot: tempDir,
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
      sessionManager: new SessionManager(path.join(tempDir, 'sessions')),
      cloudEscalationHandler: options.cloudEscalationHandler,
    });
    runtime.setActiveModel('cloudmock/test-model');

    return { runtime, provider, errors, tempDir };
  }

  it('blocks conversational requests when cloud escalation is denied', async () => {
    const handler = vi.fn().mockResolvedValue(false);
    const { runtime, provider, errors } = makeRuntime({ cloudEscalationHandler: handler });

    await runtime.executeTask('Hello');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(provider.streamCalls).toBe(0);
    expect(errors.join('\n')).toContain('Privacy confirmation denied');
  });

  it('blocks actionable requests before any model stream when escalation is denied', async () => {
    const handler = vi.fn().mockResolvedValue(false);
    const { runtime, provider, errors } = makeRuntime({ cloudEscalationHandler: handler });

    await runtime.executeTask('Create test.txt');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(provider.streamCalls).toBe(0);
    expect(errors.join('\n')).toContain('Privacy confirmation denied');
  });

  it('fails closed when no cloud escalation handler exists', async () => {
    const { runtime, provider, errors } = makeRuntime();

    await runtime.executeTask('Hello');

    expect(provider.streamCalls).toBe(0);
    expect(errors.join('\n')).toContain('no confirmation handler is available');
  });

  it('allows an approved conversational request without exposing its content to consent metadata', async () => {
    const requests: CloudEscalationRequest[] = [];
    const handler = vi.fn(async (request: CloudEscalationRequest) => {
      requests.push(request);
      return true;
    });
    const { runtime, provider, errors } = makeRuntime({ cloudEscalationHandler: handler });

    await runtime.executeTask('Hello');

    expect(errors).toEqual([]);
    expect(provider.streamCalls).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(requests[0].providerId).toBe('cloudmock');
    expect(requests[0].modelId).toBe('test-model');
    expect(JSON.stringify(requests)).not.toContain('Hello');
  });

  it('blocks sensitive prompt content even when the user would approve escalation', async () => {
    const handler = vi.fn().mockResolvedValue(true);
    const { runtime, provider, errors } = makeRuntime({
      cloudEscalationHandler: handler,
      sensitivePatterns: ['SECRET_TOKEN'],
    });

    await runtime.executeTask('Explain SECRET_TOKEN handling?');

    expect(handler).not.toHaveBeenCalled();
    expect(provider.streamCalls).toBe(0);
    expect(errors.join('\n')).toContain('Privacy policy violation');
  });

  it('does not send credentials or prompts to a denied custom endpoint', async () => {
    const authStore = { getApiKey: vi.fn().mockResolvedValue('stored-secret') } as unknown as AuthStore;
    const trustHandler = vi.fn().mockResolvedValue(false);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const provider = new OpenRouterProvider(
      authStore,
      'https://example.com/custom-openrouter',
      trustHandler
    );

    await expect(provider.listModels()).rejects.toThrow(/was not approved/);
    expect(trustHandler).toHaveBeenCalledTimes(1);
    expect(authStore.getApiKey).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    const consume = async () => {
      for await (const _chunk of provider.stream(
        [{ role: 'user', content: 'private prompt' }],
        { model: 'test-model' }
      )) {
        // No chunks should arrive.
      }
    };
    await expect(consume()).rejects.toThrow(/was not approved/);
    expect(authStore.getApiKey).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caches explicit custom-endpoint approval for the provider session', async () => {
    const authStore = { getApiKey: vi.fn().mockResolvedValue('stored-secret') } as unknown as AuthStore;
    const trustHandler = vi.fn().mockResolvedValue(true);
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'test-model', context_length: 4096 }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(new Response('data: [DONE]\n\n', { status: 200 }));

    const provider = new OpenRouterProvider(
      authStore,
      'https://example.com/custom-openrouter',
      trustHandler
    );

    const models = await provider.listModels();
    expect(models.map((model) => model.id)).toEqual(['test-model']);
    expect(authStore.getApiKey).toHaveBeenCalled();

    for await (const _chunk of provider.stream(
      [{ role: 'user', content: 'approved prompt' }],
      { model: 'test-model' }
    )) {
      // Consume the stream.
    }

    expect(trustHandler).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://example.com/custom-openrouter/models');
  });

  it('treats loopback endpoints as local without approval and remote endpoints as untrusted', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ models: [] }), { status: 200 }));

    const local = new OllamaProvider('http://127.0.0.1:65530');
    expect(local.isLocal()).toBe(true);
    await local.listModels();

    const remote = new OllamaProvider('https://example.com/ollama');
    expect(remote.isLocal()).toBe(false);
    await expect(remote.listModels()).rejects.toThrow(/untrusted custom endpoint/);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('http://127.0.0.1:65530/api/tags');
  });

  it('rejects endpoint URLs that embed credentials', () => {
    const authStore = { getApiKey: vi.fn() } as unknown as AuthStore;
    expect(
      () => new OpenRouterProvider(authStore, 'https://user:pass@example.com/v1')
    ).toThrow(/must not contain embedded credentials/);
  });
});
