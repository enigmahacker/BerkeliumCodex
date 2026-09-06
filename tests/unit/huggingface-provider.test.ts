import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HuggingFaceProvider, ProviderRouter, Message } from '@berkelium/providers';
import { AuthStore } from '@berkelium/auth';
import { ConfigManager } from '@berkelium/config';
import { Logger } from '@berkelium/logging';
import { SecretRedactor } from '@berkelium/permissions';
import { sanitizeEnvironment } from '@berkelium/tools';

describe('Hugging Face Provider Adapter & Integration', () => {
  let authStore: AuthStore;
  let provider: HuggingFaceProvider;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.HF_TOKEN;
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.HUGGING_FACE_HUB_TOKEN;
    authStore = new AuthStore({ vaultPath: '/tmp/test-hf-auth-vault.json' });
    vi.spyOn(authStore['keychain'], 'getPassword').mockResolvedValue(null);
    provider = new HuggingFaceProvider(authStore);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should have correct metadata and capabilities', () => {
    expect(provider.id).toBe('huggingface');
    expect(provider.name).toBe('Hugging Face');
    const caps = provider.capabilities();
    expect(caps.streaming).toBe(true);
    expect(caps.tool_calling).toBe(true);
    expect(caps.vision).toBe(true);
    expect(caps.reasoning).toBe(true);
  });

  it('should detect availability based on environment variables or stored keys', async () => {
    expect(await provider.isAvailable()).toBe(false);

    process.env.HF_TOKEN = 'hf_testToken1234567890abcdef1234567890';
    expect(await provider.isAvailable()).toBe(true);

    delete process.env.HF_TOKEN;
    process.env.HUGGINGFACE_API_KEY = 'hf_alternateKey1234567890abcdef1234';
    expect(await provider.isAvailable()).toBe(true);

    delete process.env.HUGGINGFACE_API_KEY;
    process.env.HUGGING_FACE_HUB_TOKEN = 'hf_hubToken1234567890abcdef12345678';
    expect(await provider.isAvailable()).toBe(true);
  });

  it('should list default models when offline or API call fails', async () => {
    const models = await provider.listModels();
    expect(models.length).toBeGreaterThan(0);
    const modelIds = models.map((m) => m.id);
    expect(modelIds).toContain('meta-llama/Llama-3.1-8B-Instruct');
    expect(modelIds).toContain('google/gemma-2-9b-it');
    expect(modelIds).toContain('Qwen/Qwen2.5-Coder-7B');
    expect(modelIds).toContain('BAAI/bge-large-en-v1.5');
    expect(modelIds).toContain('black-forest-labs/FLUX.1-schnell');
    expect(modelIds).toContain('meta-llama/Llama-3.3-70B-Instruct');
    expect(modelIds).toContain('deepseek-ai/DeepSeek-R1');
    expect(modelIds).toContain('Qwen/Qwen2.5-Coder-32B-Instruct');
  });

  it('should stream response chunks from Hugging Face chat completions endpoint', async () => {
    process.env.HF_TOKEN = 'hf_mockToken123456789012345678901234567890';

    const sseChunks = [
      'data: {"id":"chatcmpl-1","choices":[{"index":0,"delta":{"role":"assistant","content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"id":"chatcmpl-1","choices":[{"index":0,"delta":{"content":" from Hugging Face!"},"finish_reason":null}]}\n\n',
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

    const messages: Message[] = [{ role: 'user', content: 'Say hello' }];
    const chunks = [];
    for await (const chunk of provider.stream(messages, { model: 'meta-llama/Llama-3.3-70B-Instruct' })) {
      chunks.push(chunk);
    }

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://router.huggingface.co/hf-inference/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer hf_mockToken123456789012345678901234567890',
        }),
      })
    );

    const tokenChunks = chunks.filter((c) => c.type === 'token');
    const fullText = tokenChunks.map((c) => c.text).join('');
    expect(fullText).toBe('Hello from Hugging Face!');
  });

  it('should generate complete normalized response from streaming chunks', async () => {
    process.env.HF_TOKEN = 'hf_mockToken123456789012345678901234567890';

    const sseChunks = [
      'data: {"id":"chatcmpl-2","choices":[{"index":0,"delta":{"role":"assistant","content":"42"},"finish_reason":"stop"}],"usage":{"prompt_tokens":10,"completion_tokens":2,"total_tokens":12}}\n\n',
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

    const response = await provider.generate([{ role: 'user', content: 'Meaning of life?' }], {
      model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    });

    expect(response.provider).toBe('huggingface');
    expect(response.text).toBe('42');
  });

  it('should resolve targets via ProviderRouter with huggingface/ and hf/ prefixes', () => {
    const configManager = new ConfigManager();
    const logger = new Logger({ subsystem: 'test' });
    const router = new ProviderRouter(configManager.getConfig(), logger);
    router.registerProvider(provider);

    const target1 = router.resolveTarget('huggingface/meta-llama/Llama-3.3-70B-Instruct');
    expect(target1.providerId).toBe('huggingface');
    expect(target1.modelId).toBe('meta-llama/Llama-3.3-70B-Instruct');

    const target2 = router.resolveTarget('hf/deepseek-ai/DeepSeek-R1');
    expect(target2.providerId).toBe('huggingface');
    expect(target2.modelId).toBe('deepseek-ai/DeepSeek-R1');
  });

  it('should redact Hugging Face tokens in SecretRedactor', () => {
    const redactor = new SecretRedactor();
    const token = 'hf_abcdef1234567890abcdef1234567890abcdef';
    const text = `User configured API token: ${token} for production`;
    const result = redactor.redact(text);

    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('Hugging Face Token');
    expect(result.redacted).toContain('hf_[REDACTED]');
    expect(result.redacted).not.toContain(token);
  });

  it('should sanitize HF environment variables from child process execution', () => {
    const sanitized = sanitizeEnvironment({
      HF_TOKEN: 'hf_secret123456789012345678901234567890',
      HUGGINGFACE_API_KEY: 'hf_secretKey1234567890123456789012',
      HUGGING_FACE_HUB_TOKEN: 'hf_hubSecret123456789012345678901',
      SAFE_CUSTOM_VAR: 'hello',
    });

    expect(sanitized.HF_TOKEN).toBeUndefined();
    expect(sanitized.HUGGINGFACE_API_KEY).toBeUndefined();
    expect(sanitized.HUGGING_FACE_HUB_TOKEN).toBeUndefined();
  });
});
