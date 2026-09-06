import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRouter, CapabilityMatrix, Provider, Message, NormalizedChunk, NormalizedResponse, ProviderRequestOptions, ProviderCapabilities } from '@berkelium/providers';
import { ConfigManager } from '@berkelium/config';
import { Logger } from '@berkelium/logging';

class MockProvider implements Provider {
  constructor(public readonly id: string, public readonly name: string) {}

  public capabilities(): ProviderCapabilities {
    return {
      streaming: true,
      tool_calling: true,
      vision: true,
      reasoning: true,
      structured_output: true,
      embeddings: false,
      model_discovery: true,
    };
  }

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async listModels() {
    return [
      {
        id: `${this.id}-model-1`,
        name: 'Model 1',
        provider: this.id,
        context_length: 32768,
        capabilities: {},
      },
    ];
  }

  public async *stream(_messages: Message[], _options: ProviderRequestOptions): AsyncIterable<NormalizedChunk> {
    yield { type: 'token', text: 'mock token' };
  }

  public async generate(_messages: Message[], _options: ProviderRequestOptions): Promise<NormalizedResponse> {
    return {
      text: 'mock response',
      toolCalls: [],
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      finishReason: 'stop',
      model: `${this.id}-model-1`,
      provider: this.id,
    };
  }
}

describe('CapabilityMatrix & Unified Provider Router', () => {
  let router: ProviderRouter;
  let logger: Logger;
  let configManager: ConfigManager;

  beforeEach(() => {
    logger = new Logger({ subsystem: 'test-router' });
    configManager = new ConfigManager();
    router = new ProviderRouter(configManager.getConfig(), logger);

    router.registerProvider(new MockProvider('gemini', 'Google Gemini'));
    router.registerProvider(new MockProvider('openrouter', 'OpenRouter'));
    router.registerProvider(new MockProvider('groq', 'Groq'));
    router.registerProvider(new MockProvider('ollama', 'Ollama'));
  });

  describe('CapabilityMatrix', () => {
    it('should retrieve capability profile for known models', () => {
      const matrix = router.getCapabilityMatrix();
      const profile = matrix.getProfile('gemini-3.6-flash');

      expect(profile).toBeDefined();
      expect(profile?.capabilities).toContain('tool_calling');
      expect(profile?.capabilities).toContain('vision');
      expect(profile?.capabilities).toContain('long_context');
      expect(matrix.hasCapability('gemini-3.6-flash', 'tool_calling')).toBe(true);
    });

    it('should recommend models based on task requirements', () => {
      const matrix = router.getCapabilityMatrix();

      const localRec = matrix.recommendModel({ preferLocal: true, code: true });
      expect(localRec).toBe('qwen3-coder:30b');

      const reasoningRec = matrix.recommendModel({ reasoning: true });
      expect(reasoningRec).toBe('deepseek/deepseek-r1');

      const visionRec = matrix.recommendModel({ vision: true });
      expect(visionRec).toBe('gemini-3.6-flash');
    });
  });

  describe('ProviderRouter Unified Resolution', () => {
    it('should resolve standard configured aliases', () => {
      const target = router.resolveTarget('coding');
      expect(target.providerId).toBe('openrouter');
      expect(target.modelId).toBe('deepseek/deepseek-chat');
    });

    it('should resolve cloud/ prefixed identifiers', () => {
      const target = router.resolveTarget('cloud/gemini/gemini-3.6-flash');
      expect(target.providerId).toBe('gemini');
      expect(target.modelId).toBe('gemini-3.6-flash');
      expect(target.category).toBe('cloud');
    });

    it('should resolve local/ prefixed identifiers', () => {
      const target = router.resolveTarget('local/ollama/qwen2.5');
      expect(target.providerId).toBe('ollama');
      expect(target.modelId).toBe('qwen2.5');
      expect(target.category).toBe('local');
    });

    it('should resolve custom/ prefixed identifiers', () => {
      const target = router.resolveTarget('custom/groq/llama-3.3-70b');
      expect(target.providerId).toBe('groq');
      expect(target.modelId).toBe('llama-3.3-70b');
      expect(target.category).toBe('custom');
    });

    it('should throw clear error on unknown model or provider', () => {
      expect(() => router.resolveTarget('nonexistent-unknown-provider/xyz')).toThrow();
    });
  });
});
