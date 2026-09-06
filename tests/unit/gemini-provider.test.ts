import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GeminiProvider, ProviderRouter } from '@berkelium/providers';
import { AuthStore } from '@berkelium/auth';
import { ConfigManager } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { sanitizeEnvironment } from '@berkelium/tools';

describe('Google Gemini Provider Adapter & Integration', () => {
  let authStore: AuthStore;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    authStore = new AuthStore({ vaultPath: '/tmp/test-gemini-auth-vault.json' });
    vi.spyOn(authStore['keychain'], 'getPassword').mockResolvedValue(null);
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should declare capabilities with streaming, tool calling, vision, and reasoning', () => {
    const provider = new GeminiProvider(authStore);
    const caps = provider.capabilities();

    expect(provider.id).toBe('gemini');
    expect(provider.name).toBe('Google Gemini');
    expect(caps.streaming).toBe(true);
    expect(caps.tool_calling).toBe(true);
    expect(caps.vision).toBe(true);
    expect(caps.reasoning).toBe(true);
    expect(caps.model_discovery).toBe(true);
  });

  it('should list default models when offline or API call fails', async () => {
    const provider = new GeminiProvider(authStore);
    const models = await provider.listModels();

    expect(models.length).toBeGreaterThanOrEqual(4);
    const modelIds = models.map((m) => m.id);
    expect(modelIds).toContain('gemini-3.8-flash');
    expect(modelIds).toContain('gemini-3.6-flash');
    expect(modelIds).toContain('gemini-2.5-pro');
    expect(modelIds).toContain('gemini-2.5-flash');
  });

  it('should reflect availability based on GEMINI_API_KEY or GOOGLE_API_KEY presence', async () => {
    const provider = new GeminiProvider(authStore);
    expect(await provider.isAvailable()).toBe(false);

    process.env.GEMINI_API_KEY = 'AIzaSyTestApiKey1234567890123456789012';
    expect(await provider.isAvailable()).toBe(true);

    delete process.env.GEMINI_API_KEY;
    process.env.GOOGLE_API_KEY = 'AIzaSyGoogleKey1234567890123456789012';
    expect(await provider.isAvailable()).toBe(true);
  });

  it('should throw clear error if streaming without API key', async () => {
    const provider = new GeminiProvider(authStore);

    // Mock fetch to prevent real network calls — error should come before fetch
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('should not reach fetch'));

    const stream = provider.stream(
      [{ role: 'user', content: 'Hello Gemini' }],
      { model: 'gemini-3.6-flash' }
    );

    await expect(async () => {
      for await (const chunk of stream) {}
    }).rejects.toThrow(/Google Gemini API key not found/i);
  });

  it('should stream chunks and parse OpenAI-compatible SSE data with dual headers', async () => {
    process.env.GEMINI_API_KEY = 'AIzaSyMockKey123456789012345678901234';

    const sseResponse = [
      'data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"Hello"},"index":0}]}\n\n',
      'data: {"id":"chatcmpl-2","choices":[{"delta":{"content":" from Gemini!"},"index":0}]}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    let capturedHeaders: HeadersInit | undefined;
    let capturedBody: any;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedHeaders = init?.headers;
      capturedBody = JSON.parse(init?.body as string);
      return new Response(sseResponse, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });

    const provider = new GeminiProvider(authStore);
    const chunks: any[] = [];

    for await (const chunk of provider.stream(
      [{ role: 'user', content: 'Say hello' }],
      { model: 'gemini/gemini-2.0-flash', temperature: 0.1 }
    )) {
      chunks.push(chunk);
    }

    expect(capturedHeaders).toBeDefined();
    expect((capturedHeaders as any)['Authorization']).toBe(`Bearer ${process.env.GEMINI_API_KEY}`);
    expect((capturedHeaders as any)['x-goog-api-key']).toBe(process.env.GEMINI_API_KEY);
    expect(capturedBody.model).toBe('gemini-2.0-flash');
    expect(capturedBody.messages[0].content).toBe('Say hello');

    const textTokens = chunks.filter((c) => c.type === 'token').map((c) => c.text);
    expect(textTokens.join('')).toBe('Hello from Gemini!');
  });

  it('should support tool calling payload in stream request', async () => {
    process.env.GEMINI_API_KEY = 'AIzaSyMockKey123456789012345678901234';

    let capturedBody: any;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response('data: [DONE]\n\n', { status: 200 });
    });

    const provider = new GeminiProvider(authStore);
    const tools = [
      {
        name: 'read_file',
        description: 'Read a file from workspace',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
      },
    ];

    for await (const _ of provider.stream(
      [{ role: 'user', content: 'Read file' }],
      { model: 'gemini-2.0-flash', tools }
    )) {}

    expect(capturedBody.tools).toBeDefined();
    expect(capturedBody.tools[0].function.name).toBe('read_file');
    expect(capturedBody.tools[0].function.parameters.properties.path.type).toBe('string');
  });

  it('should resolve provider targets in ProviderRouter for Gemini aliases and model notations', () => {
    const configManager = new ConfigManager();
    const logger = new Logger({ subsystem: 'test' });
    const router = new ProviderRouter(configManager.getConfig(), logger);

    const geminiProvider = new GeminiProvider(authStore);
    router.registerProvider(geminiProvider);

    // 1. Direct provider IDs and aliases
    const targetGemini = router.resolveTarget('gemini');
    expect(targetGemini.providerId).toBe('gemini');

    const targetGoogle = router.resolveTarget('google');
    expect(targetGoogle.providerId).toBe('gemini');

    const targetGoogleApi = router.resolveTarget('googleapi');
    expect(targetGoogleApi.providerId).toBe('gemini');

    // 2. Model aliases
    const targetFlash = router.resolveTarget('gemini-flash');
    expect(targetFlash.providerId).toBe('gemini');
    expect(targetFlash.modelId).toMatch(/^gemini-[\d.]+-flash/);

    const targetPro = router.resolveTarget('gemini-pro');
    expect(targetPro.providerId).toBe('gemini');
    expect(targetPro.modelId).toBe('gemini-2.5-pro');

    // 3. Provider/model notations
    const targetSlash = router.resolveTarget('gemini/gemini-2.5-flash');
    expect(targetSlash.providerId).toBe('gemini');
    expect(targetSlash.modelId).toBe('gemini-2.5-flash');

    const targetGoogleSlash = router.resolveTarget('google/gemini-2.0-flash-thinking-exp-01-21');
    expect(targetGoogleSlash.providerId).toBe('gemini');
    expect(targetGoogleSlash.modelId).toBe('gemini-2.0-flash-thinking-exp-01-21');
  });

  it('should sanitize Google and Gemini API keys from subprocess environment', () => {
    const dirtyEnv = {
      PATH: '/usr/bin:/bin',
      HOME: '/Users/test',
      GEMINI_API_KEY: 'AIzaSySecretGeminiKey1234567890123456',
      GOOGLE_API_KEY: 'AIzaSySecretGoogleKey1234567890123456',
      GOOGLE_GENAI_API_KEY: 'AIzaSySecretGenaiKey1234567890123456',
    };

    const sanitized = sanitizeEnvironment(dirtyEnv);

    expect(sanitized.PATH).toBe('/usr/bin:/bin');
    expect(sanitized.HOME).toBe('/Users/test');
    expect(sanitized.GEMINI_API_KEY).toBeUndefined();
    expect(sanitized.GOOGLE_API_KEY).toBeUndefined();
    expect(sanitized.GOOGLE_GENAI_API_KEY).toBeUndefined();
  });
});
