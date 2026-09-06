import { describe, it, expect } from 'vitest';
import {
  OpenRouterProvider,
  NVIDIAProvider,
  GeminiProvider,
  GroqProvider,
  CapabilityMatrix,
  ProviderRouter,
} from '@berkelium/providers';
import { ConfigManager } from '@berkelium/config';
import { AuthStore } from '@berkelium/auth';
import { Logger } from '@berkelium/logging';

describe('Synced Provider Models & Capability Matrix', () => {
  const authStore = new AuthStore({ vaultPath: '/tmp/test-vault-models.json' });
  const logger = new Logger({ subsystem: 'test-sync' });

  describe('OpenRouterProvider Model Catalog (Anthropic, OpenAI, DeepSeek, Google)', () => {
    const provider = new OpenRouterProvider(authStore);
    const defaults = provider.getDefaultModels();

    it('should include full Anthropic Claude lineup', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('anthropic/claude-3.7-sonnet');
      expect(ids).toContain('anthropic/claude-3.7-sonnet:thinking');
      expect(ids).toContain('anthropic/claude-3.5-sonnet');
      expect(ids).toContain('anthropic/claude-3.5-haiku');
      expect(ids).toContain('anthropic/claude-3-opus');
      expect(ids).toContain('anthropic/claude-sonnet-4-5');
      expect(ids).toContain('anthropic/claude-opus-4-5');

      const sonnet37 = defaults.find((m) => m.id === 'anthropic/claude-3.7-sonnet');
      expect(sonnet37?.capabilities.tool_calling).toBe(true);
      expect(sonnet37?.capabilities.reasoning).toBe(true);
      expect(sonnet37?.capabilities.vision).toBe(true);
      expect(sonnet37?.context_length).toBe(200000);
    });

    it('should include full OpenAI lineup', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('openai/gpt-4o');
      expect(ids).toContain('openai/gpt-4o-mini');
      expect(ids).toContain('openai/o1');
      expect(ids).toContain('openai/o1-mini');
      expect(ids).toContain('openai/o3');
      expect(ids).toContain('openai/o3-mini');
      expect(ids).toContain('openai/chatgpt-4o-latest');

      const o3mini = defaults.find((m) => m.id === 'openai/o3-mini');
      expect(o3mini?.capabilities.reasoning).toBe(true);
      expect(o3mini?.capabilities.tool_calling).toBe(true);
      expect(o3mini?.context_length).toBe(200000);
    });

    it('should include DeepSeek and Google Gemini flagship models', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('deepseek/deepseek-r1');
      expect(ids).toContain('deepseek/deepseek-chat');
      expect(ids).toContain('google/gemini-3.8-flash');
      expect(ids).toContain('google/gemini-3.1-pro-preview');
    });

    it('should include community-subsidized OpenRouter :free endpoints', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('meta-llama/llama-4-scout:free');
      expect(ids).toContain('meta-llama/llama-4-maverick:free');
      expect(ids).toContain('meta-llama/llama-3.3-70b-instruct:free');
      expect(ids).toContain('meta-llama/llama-3.1-8b-instruct:free');
      expect(ids).toContain('minimax/minimax-m3:free');
      expect(ids).toContain('nvidia/nemotron-3.5-lightning:free');
      expect(ids).toContain('google/gemma-3-27b-it:free');
      expect(ids).toContain('qwen/qwen-2.5-72b-instruct:free');
      expect(ids).toContain('mistralai/mistral-7b-instruct:free');
    });
  });

  describe('NVIDIAProvider Model Catalog (NVIDIA NIM)', () => {
    const provider = new NVIDIAProvider(authStore);
    const defaults = provider.getDefaultModels();

    it('should include new NIM catalog models eligible for 1,000 free API credits', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('nvidia/nemotron-3.5-lightning-30b-a3b');
      expect(ids).toContain('nvidia/nemotron-3-embed-1b');
      expect(ids).toContain('nvidia/nemotron-ocr-v2');
      expect(ids).toContain('deepseek-ai/deepseek-v4-pro-0813');
      expect(ids).toContain('deepseek-ai/deepseek-v4-flash-0731');
      expect(ids).toContain('moonshotai/kimi-k3');
      expect(ids).toContain('meta/muse-glimmer-30b');
      expect(ids).toContain('poolside/laguna-xs-2.1');
      expect(ids).toContain('minimax/minimax-m3');
    });

    it('should include DeepSeek R1 and V3 on NIM', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('deepseek-ai/deepseek-r1');
      expect(ids).toContain('deepseek-ai/deepseek-v3');

      const r1 = defaults.find((m) => m.id === 'deepseek-ai/deepseek-r1');
      expect(r1?.capabilities.reasoning).toBe(true);
      expect(r1?.capabilities.tool_calling).toBe(true);
    });

    it('should include Meta Llama models (70B, 405B, 8B)', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('meta/llama-3.3-70b-instruct');
      expect(ids).toContain('meta/llama-3.1-405b-instruct');
      expect(ids).toContain('meta/llama-3.1-70b-instruct');
      expect(ids).toContain('meta/llama-3.1-8b-instruct');
    });

    it('should include NVIDIA aligned Nemotron models', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('nvidia/llama-3.1-nemotron-70b-instruct');
      expect(ids).toContain('nvidia/llama-3.1-nemotron-51b-instruct');
      expect(ids).toContain('nvidia/mistral-nemo-12b-instruct');
    });

    it('should include Qwen Coder and Mistral models on NIM', () => {
      const ids = defaults.map((m) => m.id);
      expect(ids).toContain('qwen/qwen2.5-coder-32b-instruct');
      expect(ids).toContain('qwen/qwen2.5-72b-instruct');
      expect(ids).toContain('mistralai/mistral-large-2-instruct');
      expect(ids).toContain('mistralai/codestral-22b-instruct-v0.1');
    });
  });

  describe('CapabilityMatrix Model Profiles & Heuristics', () => {
    const matrix = new CapabilityMatrix();

    it('should return profile for Anthropic Claude models', () => {
      const profile = matrix.getProfile('anthropic/claude-3.7-sonnet');
      expect(profile).toBeDefined();
      expect(profile?.capabilities).toContain('tool_calling');
      expect(profile?.capabilities).toContain('reasoning');
      expect(profile?.capabilities).toContain('vision');
      expect(profile?.capabilities).toContain('long_context');
      expect(profile?.contextWindow).toBe(200000);
    });

    it('should return profile for OpenAI o3-mini and GPT-4o', () => {
      const o3 = matrix.getProfile('openai/o3-mini');
      expect(o3).toBeDefined();
      expect(o3?.capabilities).toContain('reasoning');
      expect(o3?.capabilities).toContain('tool_calling');

      const gpt4o = matrix.getProfile('openai/gpt-4o');
      expect(gpt4o).toBeDefined();
      expect(gpt4o?.capabilities).toContain('vision');
      expect(gpt4o?.capabilities).toContain('tool_calling');
    });

    it('should return profile for NVIDIA NIM models', () => {
      const nemotron = matrix.getProfile('nvidia/llama-3.1-nemotron-70b-instruct');
      expect(nemotron).toBeDefined();
      expect(nemotron?.capabilities).toContain('reasoning');
      expect(nemotron?.capabilities).toContain('tool_calling');

      const qwenCoder = matrix.getProfile('qwen/qwen2.5-coder-32b-instruct');
      expect(qwenCoder).toBeDefined();
      expect(qwenCoder?.capabilities).toContain('code');
      expect(qwenCoder?.capabilities).toContain('tool_calling');
    });
  });

  describe('Router Alias Resolution for New Models', () => {
    const configManager = new ConfigManager('/tmp/test-config-dir-models');
    const router = new ProviderRouter(configManager.getConfig(), logger);

    const openrouter = new OpenRouterProvider(authStore);
    const nvidia = new NVIDIAProvider(authStore);
    const gemini = new GeminiProvider(authStore);
    const groq = new GroqProvider(authStore);

    router.registerProvider(openrouter);
    router.registerProvider(nvidia);
    router.registerProvider(gemini);
    router.registerProvider(groq);

    it('should resolve Anthropic model aliases', () => {
      const claude = router.resolveTarget('claude');
      expect(claude.providerId).toBe('openrouter');
      expect(claude.modelId).toBe('anthropic/claude-3.7-sonnet');

      const thinking = router.resolveTarget('claude-thinking');
      expect(thinking.providerId).toBe('openrouter');
      expect(thinking.modelId).toBe('anthropic/claude-3.7-sonnet:thinking');

      const haiku = router.resolveTarget('claude-haiku');
      expect(haiku.providerId).toBe('openrouter');
      expect(haiku.modelId).toBe('anthropic/claude-3.5-haiku');
    });

    it('should resolve OpenAI model aliases', () => {
      const gpt4o = router.resolveTarget('gpt4o');
      expect(gpt4o.providerId).toBe('openrouter');
      expect(gpt4o.modelId).toBe('openai/gpt-4o');

      const o3mini = router.resolveTarget('o3-mini');
      expect(o3mini.providerId).toBe('openrouter');
      expect(o3mini.modelId).toBe('openai/o3-mini');

      const o1 = router.resolveTarget('o1');
      expect(o1.providerId).toBe('openrouter');
      expect(o1.modelId).toBe('openai/o1');
    });

    it('should resolve NVIDIA NIM aliases', () => {
      const nvDeepSeek = router.resolveTarget('nvidia-deepseek');
      expect(nvDeepSeek.providerId).toBe('nvidia');
      expect(nvDeepSeek.modelId).toBe('deepseek-ai/deepseek-r1');

      const nvLlama = router.resolveTarget('nvidia-llama');
      expect(nvLlama.providerId).toBe('nvidia');
      expect(nvLlama.modelId).toBe('meta/llama-3.3-70b-instruct');

      const nvNemotron = router.resolveTarget('nvidia-nemotron');
      expect(nvNemotron.providerId).toBe('nvidia');
      expect(nvNemotron.modelId).toBe('nvidia/llama-3.1-nemotron-70b-instruct');

      const nvQwen = router.resolveTarget('nvidia-qwen');
      expect(nvQwen.providerId).toBe('nvidia');
      expect(nvQwen.modelId).toBe('qwen/qwen2.5-coder-32b-instruct');
    });
  });
});
