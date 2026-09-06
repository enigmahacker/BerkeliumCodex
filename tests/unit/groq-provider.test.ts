import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqProvider, ProviderRouter, Message } from '@berkelium/providers';
import { AuthStore } from '@berkelium/auth';
import { ConfigManager } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { SecretRedactor } from '@berkelium/permissions';
import { sanitizeEnvironment } from '@berkelium/tools';

describe('Groq Provider Adapter & Integration', () => {
  let authStore: AuthStore;
  let provider: GroqProvider;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    authStore = new AuthStore({ vaultPath: '/tmp/test-groq-auth-vault.json' });
    vi.spyOn(authStore['keychain'], 'getPassword').mockResolvedValue(null);
    provider = new GroqProvider(authStore);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should have correct metadata and capabilities', () => {
    expect(provider.id).toBe('groq');
    expect(provider.name).toBe('Groq');
    const caps = provider.capabilities();
    expect(caps.streaming).toBe(true);
    expect(caps.tool_calling).toBe(true);
    expect(caps.vision).toBe(true);
    expect(caps.reasoning).toBe(true);
  });

  it('should detect availability based on environment variables or stored keys', async () => {
    expect(await provider.isAvailable()).toBe(false);

    process.env.GROQ_API_KEY = 'gsk_testToken1234567890abcdef1234567890abcdef1234567890';
    expect(await provider.isAvailable()).toBe(true);
  });

  it('should list default models when offline or API call fails', async () => {
    const models = await provider.listModels();
    expect(models.length).toBeGreaterThan(0);
    const modelIds = models.map((m) => m.id);
    expect(modelIds).toContain('llama-3.3-70b-versatile');
    expect(modelIds).toContain('llama-3.1-8b-instant');
    expect(modelIds).toContain('llama-3.2-11b-vision-preview');
    expect(modelIds).toContain('qwen-2.5-72b');
    expect(modelIds).toContain('gemma2-9b-it');
    expect(modelIds).toContain('whisper-large-v3');
    expect(modelIds).toContain('deepseek-r1-distill-llama-70b');
    expect(modelIds).toContain('qwen-qwq-32b');
  });

  it('should stream response chunks from Groq chat completions endpoint', async () => {
    process.env.GROQ_API_KEY = 'gsk_mockToken123456789012345678901234567890abcdef12345678';

    const sseChunks = [
      'data: {"id":"chatcmpl-groq-1","choices":[{"index":0,"delta":{"role":"assistant","content":"Lightning fast"},"finish_reason":null}]}\n\n',
      'data: {"id":"chatcmpl-groq-1","choices":[{"index":0,"delta":{"content":" inference!"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n',
    ];

    const mockStream = new ReadableStream({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(mockStream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const messages: Message[] = [{ role: 'user', content: 'How fast is Groq?' }];
    const chunks = [];
    for await (const chunk of provider.stream(messages, { model: 'llama-3.3-70b-versatile' })) {
      chunks.push(chunk);
    }

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gsk_mockToken123456789012345678901234567890abcdef12345678',
        }),
      })
    );

    const tokenChunks = chunks.filter((c) => c.type === 'token');
    const fullText = tokenChunks.map((c) => c.text).join('');
    expect(fullText).toBe('Lightning fast inference!');
  });

  it('should generate complete normalized response from streaming chunks', async () => {
    process.env.GROQ_API_KEY = 'gsk_mockToken123456789012345678901234567890abcdef12345678';

    const sseChunks = [
      'data: {"id":"chatcmpl-groq-2","choices":[{"index":0,"delta":{"role":"assistant","content":"Done in 12ms"},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":4,"total_tokens":12}}\n\n',
      'data: [DONE]\n\n',
    ];

    const mockStream = new ReadableStream({
      start(controller) {
        for (const chunk of sseChunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(mockStream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      })
    );

    const response = await provider.generate([{ role: 'user', content: 'Speed check' }], {
      model: 'llama-3.1-8b-instant',
    });

    expect(response.provider).toBe('groq');
    expect(response.text).toBe('Done in 12ms');
  });

  it('should resolve targets via ProviderRouter with groq/ prefix', () => {
    const configManager = new ConfigManager();
    const logger = new Logger({ subsystem: 'test' });
    const router = new ProviderRouter(configManager.getConfig(), logger);
    router.registerProvider(provider);

    const target = router.resolveTarget('groq/llama-3.3-70b-versatile');
    expect(target.providerId).toBe('groq');
    expect(target.modelId).toBe('llama-3.3-70b-versatile');
  });

  it('should redact Groq API keys in SecretRedactor', () => {
    const redactor = new SecretRedactor();
    const token = 'gsk_abcdef1234567890abcdef1234567890abcdef12345678901234';
    const text = `User configured Groq key: ${token}`;
    const result = redactor.redact(text);

    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('Groq API Key');
    expect(result.redacted).toContain('gsk_[REDACTED]');
    expect(result.redacted).not.toContain(token);
  });

  it('should sanitize GROQ_ environment variables from child process execution', () => {
    const sanitized = sanitizeEnvironment({
      GROQ_API_KEY: 'gsk_secretKey123456789012345678901234567890abcdef1234',
      BERKELIUM_CUSTOM_VAR: 'hello',
    });

    expect(sanitized.GROQ_API_KEY).toBeUndefined();
    expect(sanitized.BERKELIUM_CUSTOM_VAR).toBe('hello');
  });
});
