import { describe, it, expect } from 'vitest';
import { SecretRedactor } from '@berkelium/permissions';

describe('SecretRedactor', () => {
  const redactor = new SecretRedactor();

  it('should redact OpenRouter API keys', () => {
    const raw = 'Config: OPENROUTER_API_KEY=sk-or-v1-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef in environment.';
    const res = redactor.redact(raw);

    expect(res.foundSecrets).toBe(true);
    expect(res.redacted).not.toContain('0123456789abcdef');
    expect(res.redacted).toContain('[REDACTED]');
  });

  it('should redact NVIDIA API keys', () => {
    const raw = 'nvapi-abcdef1234567890abcdef1234567890abcdef';
    const res = redactor.redact(raw);

    expect(res.foundSecrets).toBe(true);
    expect(res.redacted).toBe('nvapi-[REDACTED]');
  });

  it('should redact private keys', () => {
    const raw = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----';
    const res = redactor.redact(raw);

    expect(res.foundSecrets).toBe(true);
    expect(res.redacted).toBe('[REDACTED_PRIVATE_KEY]');
  });
});
