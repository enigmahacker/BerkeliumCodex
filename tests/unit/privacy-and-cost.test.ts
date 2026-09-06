import { describe, it, expect } from 'vitest';
import { PrivacyEngine, CostController, type PrivacyConfig, type CostControlConfig } from '@berkelium/config';

describe('PrivacyEngine & CostController', () => {
  describe('PrivacyEngine', () => {
    it('should block external providers when mode is "local"', () => {
      const config: PrivacyConfig = {
        mode: 'local',
        cloud_escalation_prompt: true,
        sensitive_patterns: [],
      };
      const engine = new PrivacyEngine(config);

      // Local provider should be allowed
      const localResult = engine.evaluate('mlx', true);
      expect(localResult.allowed).toBe(true);

      // Cloud provider should be blocked
      const cloudResult = engine.evaluate('gemini', false);
      expect(cloudResult.allowed).toBe(false);
      expect(cloudResult.reason).toContain('strictly prohibited');
    });

    it('should require confirmation on cloud escalation when mode is "balanced"', () => {
      const config: PrivacyConfig = {
        mode: 'balanced',
        cloud_escalation_prompt: true,
        sensitive_patterns: [],
      };
      const engine = new PrivacyEngine(config);

      const localResult = engine.evaluate('mlx', true);
      expect(localResult.allowed).toBe(true);
      expect(localResult.requiresConfirmation).toBe(false);

      const cloudResult = engine.evaluate('openrouter', false);
      expect(cloudResult.allowed).toBe(true);
      expect(cloudResult.requiresConfirmation).toBe(true);
    });

    it('should detect sensitive patterns and block outbound cloud transfer', () => {
      const config: PrivacyConfig = {
        mode: 'balanced',
        cloud_escalation_prompt: false,
        sensitive_patterns: ['api_key', 'confidential', 'bearer [a-z0-9]+'],
      };
      const engine = new PrivacyEngine(config);

      const cleanResult = engine.evaluate('gemini', false, 'public code example');
      expect(cleanResult.allowed).toBe(true);

      const sensitiveResult = engine.evaluate('gemini', false, 'here is my secret API_KEY = 12345');
      expect(sensitiveResult.allowed).toBe(false);
      expect(sensitiveResult.violations?.length).toBeGreaterThan(0);
    });

    it('should format summary string for banners and status', () => {
      const config: PrivacyConfig = {
        mode: 'local',
        cloud_escalation_prompt: true,
        sensitive_patterns: [],
      };
      const engine = new PrivacyEngine(config);
      expect(engine.formatSummary()).toContain('STRICT LOCAL');
    });
  });

  describe('CostController', () => {
    it('should track token usage and calculate USD expenditure', () => {
      const config: CostControlConfig = {
        enabled: true,
        session_budget_usd: 5.0,
        warn_threshold_percent: 80,
      };
      const controller = new CostController(config);

      const usage = controller.recordUsage('gemini', 'gemini-3.6-flash', 1_000_000, 500_000);
      expect(usage.costUsd).toBeGreaterThan(0);
      expect(usage.totalCostUsd).toBe(usage.costUsd);

      const current = controller.getUsage();
      expect(current.promptTokens).toBe(1_000_000);
      expect(current.completionTokens).toBe(500_000);
      expect(current.totalTokens).toBe(1_500_000);
    });

    it('should treat local models as zero cost', () => {
      const config: CostControlConfig = {
        enabled: true,
      };
      const controller = new CostController(config);

      const usageMLX = controller.recordUsage('mlx', 'qwen3-coder:30b', 500_000, 200_000);
      expect(usageMLX.costUsd).toBe(0);

      const usageGGUF = controller.recordUsage('gguf', 'phi-4-mini', 500_000, 200_000);
      expect(usageGGUF.costUsd).toBe(0);
    });

    it('should enforce budget caps and emit warnings', () => {
      const config: CostControlConfig = {
        enabled: true,
        session_budget_usd: 0.10,
        warn_threshold_percent: 50,
      };
      const controller = new CostController(config);

      // Record high usage to exceed $0.10
      const usage = controller.recordUsage('groq', 'llama-3.3-70b', 500_000, 500_000);
      expect(usage.totalCostUsd).toBeGreaterThan(0.10);

      const budgetCheck = controller.checkBudget();
      expect(budgetCheck.allowed).toBe(false);
      expect(budgetCheck.reason).toContain('Session budget limit reached');
    });
  });
});
