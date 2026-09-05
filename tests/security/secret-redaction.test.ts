import { describe, it, expect } from 'vitest';
import { SecretRedactor, defaultSecretRedactor } from '@berkelium/permissions';

describe('Security Hardening: Secret Redactor Engine', () => {
  const redactor = new SecretRedactor();

  it('should detect and redact NVIDIA API keys', () => {
    const input = 'Setting NVIDIA key: nvapi-abcdef1234567890abcdef1234567890_NVIDIA';
    const result = redactor.redact(input);
    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('NVIDIA API Key');
    expect(result.redacted).toContain('nvapi-[REDACTED]');
    expect(result.redacted).not.toContain('abcdef1234567890abcdef1234567890_NVIDIA');
  });

  it('should detect and redact OpenRouter API keys', () => {
    const input = 'export OPENROUTER_API_KEY=sk-or-v1-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const result = redactor.redact(input);
    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('OpenRouter API Key');
    expect(result.redacted).toContain('sk-or-v1-[REDACTED]');
  });

  it('should detect and redact OpenAI API keys (standard and proj)', () => {
    const input1 = 'sk-abcdefghijklmnopqrstuvwxyz1234567890ABCDEF';
    const input2 = 'sk-proj-abcdefghijklmnopqrstuvwxyz1234567890ABCDEF';
    expect(redactor.redact(input1).redacted).toBe('sk-[REDACTED]');
    expect(redactor.redact(input2).redacted).toBe('sk-[REDACTED]');
  });

  it('should detect and redact Anthropic API keys', () => {
    const input = 'ANTHROPIC_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890ABCDEF123456';
    const result = redactor.redact(input);
    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('Anthropic API Key');
    expect(result.redacted).toContain('sk-ant-[REDACTED]');
  });

  it('should detect and redact Google Cloud API keys', () => {
    const input = 'firebase key: AIzaSyA1234567890abcdefghijklmnopqrst';
    const result = redactor.redact(input);
    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('Google API Key');
    expect(result.redacted).toContain('AIza[REDACTED]');
  });

  it('should detect and redact GitHub personal access tokens', () => {
    const classic = 'token: ghp_123456789012345678901234567890123456';
    const fineGrained = 'github_pat_11AAAAAAA0123456789012345678901234567890123456789012345678901234567890123456789012';
    expect(redactor.redact(classic).redacted).toContain('gh*-[REDACTED]');
    expect(redactor.redact(fineGrained).redacted).toContain('gh*-[REDACTED]');
  });

  it('should detect and redact AWS Access Keys', () => {
    const input = 'AWS credentials: AKIAIOSFODNN7EXAMPLE';
    const result = redactor.redact(input);
    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('AWS Access Key');
    expect(result.redacted).toContain('AKIA[REDACTED]');
  });

  it('should detect and redact RSA / OpenSSH Private Keys', () => {
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3J1bWJsZSBmYWtlIGtleSBmb3Igc2VjdXJpdHkgdGVzdGlu
ZwIDAQABAoIBAQCfakefakefakefakefakefakefakefakefakefakefakefakefake
-----END RSA PRIVATE KEY-----`;
    const result = redactor.redact(privateKey);
    expect(result.foundSecrets).toBe(true);
    expect(result.secretTypes).toContain('Private Key');
    expect(result.redacted).toBe('[REDACTED_PRIVATE_KEY]');
  });

  it('should detect and redact JWT tokens', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = redactor.redact(`Bearer ${jwt}`);
    expect(result.foundSecrets).toBe(true);
    expect(result.redacted).toContain('[REDACTED');
  });

  it('should detect and redact database connection credentials', () => {
    const dbUrl = 'postgres://postgres:SuperSecretPassword123@db.internal.corp:5432/production_db';
    const result = redactor.redact(dbUrl);
    expect(result.foundSecrets).toBe(true);
    expect(result.redacted).toBe('postgres://postgres:[REDACTED]@db.internal.corp:5432/production_db');
  });

  it('should recursively redact objects and nested arrays (redactObject)', () => {
    const rawData = {
      config: {
        apiKey: 'nvapi-1234567890abcdef1234567890_NVIDIA_SECRET',
        services: [
          { name: 'auth', secret: 'PASSWORD=MySuperSecret999' },
          { name: 'public', info: 'hello world' },
        ],
      },
    };

    const sanitized = redactor.redactObject(rawData);
    expect(sanitized.config.apiKey).toContain('nvapi-[REDACTED]');
    expect(sanitized.config.services[0].secret).toContain('PASSWORD=[REDACTED]');
    expect(sanitized.config.services[1].info).toBe('hello world');
  });

  it('should verify containsSecret correctly identifies credentials', () => {
    expect(redactor.containsSecret('sk-proj-12345678901234567890123456789012')).toBe(true);
    expect(redactor.containsSecret('just a harmless standard terminal output')).toBe(false);
  });
});
