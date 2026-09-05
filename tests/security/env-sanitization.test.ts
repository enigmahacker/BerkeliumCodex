import { describe, it, expect } from 'vitest';
import { sanitizeEnvironment } from '@berkelium/tools';

describe('Security Hardening: Environment Variable Sanitizer', () => {
  it('should strip sensitive API keys and tokens from environment variables', () => {
    const dirtyEnv = {
      PATH: '/usr/bin:/bin',
      HOME: '/Users/testuser',
      USER: 'testuser',
      OPENROUTER_API_KEY: 'sk-or-v1-secret123',
      NVIDIA_API_KEY: 'nvapi-secret456',
      OPENAI_API_KEY: 'sk-secret789',
      ANTHROPIC_API_KEY: 'sk-ant-secret000',
      AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
      GITHUB_TOKEN: 'ghp_secret_token_123',
      GH_TOKEN: 'ghp_secret_token_456',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      SUPER_SECRET_PASSWORD: 'password123',
      SIGNING_SECRET: 'sig-sec-999',
    };

    const cleanEnv = sanitizeEnvironment(dirtyEnv);

    // Verify sensitive keys are stripped
    expect(cleanEnv.OPENROUTER_API_KEY).toBeUndefined();
    expect(cleanEnv.NVIDIA_API_KEY).toBeUndefined();
    expect(cleanEnv.OPENAI_API_KEY).toBeUndefined();
    expect(cleanEnv.ANTHROPIC_API_KEY).toBeUndefined();
    expect(cleanEnv.AWS_SECRET_ACCESS_KEY).toBeUndefined();
    expect(cleanEnv.AWS_ACCESS_KEY_ID).toBeUndefined();
    expect(cleanEnv.GITHUB_TOKEN).toBeUndefined();
    expect(cleanEnv.GH_TOKEN).toBeUndefined();
    expect(cleanEnv.DATABASE_URL).toBeUndefined();
    expect(cleanEnv.SUPER_SECRET_PASSWORD).toBeUndefined();
    expect(cleanEnv.SIGNING_SECRET).toBeUndefined();

    // Verify standard safe keys are preserved
    expect(cleanEnv.PATH).toBe('/usr/bin:/bin');
    expect(cleanEnv.HOME).toBe('/Users/testuser');
    expect(cleanEnv.USER).toBe('testuser');
    expect(cleanEnv.CI).toBe('1');
    expect(cleanEnv.PAGER).toBe('cat');
  });
});
