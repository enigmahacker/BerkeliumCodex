import { describe, it, expect } from 'vitest';
import {
  ProviderRouter,
  LMStudioProvider,
  OllamaProvider,
  OpenRouterProvider,
  NVIDIAProvider,
  HuggingFaceProvider,
  GroqProvider,
} from '@berkelium/providers';
import { ConfigManager } from '@berkelium/config';
import { AuthStore } from '@berkelium/auth';
import { Logger } from '@berkelium/logging';

describe('Provider Router Target Resolution & LM Studio Routing', () => {
  const configManager = new ConfigManager();
  const logger = new Logger({ subsystem: 'test' });
  const authStore = new AuthStore({ vaultPath: '/tmp/test-routing-vault.json' });

  const router = new ProviderRouter(configManager.getConfig(), logger);
  router.registerProvider(new OpenRouterProvider(authStore));
  router.registerProvider(new NVIDIAProvider(authStore));
  router.registerProvider(new HuggingFaceProvider(authStore));
  router.registerProvider(new GroqProvider(authStore));
  router.registerProvider(new OllamaProvider());
  router.registerProvider(new LMStudioProvider());

  it('should route "workstation" alias to lmstudio', () => {
    const target = router.resolveTarget('workstation');
    expect(target.providerId).toBe('lmstudio');
    expect(target.modelId).toBe('deepseek-coder-v2');
  });

  it('should route direct "lmstudio" or "lm-studio" to lmstudio provider and not openrouter', () => {
    const target1 = router.resolveTarget('lmstudio');
    expect(target1.providerId).toBe('lmstudio');
    expect(target1.provider.name).toBe('LM Studio');

    const target2 = router.resolveTarget('lm-studio');
    expect(target2.providerId).toBe('lmstudio');

    const target3 = router.resolveTarget('lmstudio/custom-local-model');
    expect(target3.providerId).toBe('lmstudio');
    expect(target3.modelId).toBe('custom-local-model');
  });

  it('should route unqualified LM Studio model names to lmstudio and not openrouter', () => {
    const target = router.resolveTarget('deepseek-coder-v2');
    expect(target.providerId).toBe('lmstudio');
  });

  it('should route "local" and "ollama" to ollama provider', () => {
    const target1 = router.resolveTarget('local');
    expect(target1.providerId).toBe('ollama');

    const target2 = router.resolveTarget('ollama');
    expect(target2.providerId).toBe('ollama');

    const target3 = router.resolveTarget('ollama/qwen2.5:7b');
    expect(target3.providerId).toBe('ollama');
    expect(target3.modelId).toBe('qwen2.5:7b');
  });

  it('should route "groq" and "hf" to their respective providers', () => {
    const targetGroq = router.resolveTarget('groq');
    expect(targetGroq.providerId).toBe('groq');

    const targetHf = router.resolveTarget('hf');
    expect(targetHf.providerId).toBe('huggingface');

    const targetHfFull = router.resolveTarget('huggingface');
    expect(targetHfFull.providerId).toBe('huggingface');
  });
});
