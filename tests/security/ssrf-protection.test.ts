import { describe, it, expect } from 'vitest';
import { validateSafeUrl } from '@berkelium/tools';
import { FetchUrlTool } from '@berkelium/tools';

describe('Security Hardening: SSRF & Network Security', () => {
  it('should allow legitimate public HTTP/HTTPS URLs', () => {
    const valid1 = validateSafeUrl('https://api.github.com/repos/berkelium/cli');
    expect(valid1.safe).toBe(true);

    const valid2 = validateSafeUrl('https://docs.anthropic.com/en/docs/overview');
    expect(valid2.safe).toBe(true);

    const valid3 = validateSafeUrl('http://example.com/index.html');
    expect(valid3.safe).toBe(true);
  });

  it('should block loopback addresses (127.0.0.1, localhost, ::1, 0.0.0.0)', () => {
    expect(validateSafeUrl('http://localhost:8080').safe).toBe(false);
    expect(validateSafeUrl('http://127.0.0.1:3000/admin').safe).toBe(false);
    expect(validateSafeUrl('http://0.0.0.0:8000').safe).toBe(false);
    expect(validateSafeUrl('http://[::1]:8080').safe).toBe(false);
    expect(validateSafeUrl('http://app.localhost').safe).toBe(false);
  });

  it('should block cloud metadata endpoints (169.254.169.254, metadata.google.internal)', () => {
    const awsMetadata = validateSafeUrl('http://169.254.169.254/latest/meta-data/iam/security-credentials/');
    expect(awsMetadata.safe).toBe(false);
    expect(awsMetadata.error).toMatch(/SSRF/);

    const gcpMetadata = validateSafeUrl('http://metadata.google.internal/computeMetadata/v1/');
    expect(gcpMetadata.safe).toBe(false);
    expect(gcpMetadata.error).toMatch(/SSRF/);
  });

  it('should block private RFC1918 IPv4 ranges (10.x, 172.16-31.x, 192.168.x)', () => {
    expect(validateSafeUrl('http://10.0.0.1/admin').safe).toBe(false);
    expect(validateSafeUrl('http://10.255.255.255/internal').safe).toBe(false);
    expect(validateSafeUrl('http://172.16.0.5:8080').safe).toBe(false);
    expect(validateSafeUrl('http://172.31.255.255').safe).toBe(false);
    expect(validateSafeUrl('http://192.168.1.1/router').safe).toBe(false);
    expect(validateSafeUrl('http://192.168.0.100').safe).toBe(false);
  });

  it('should block non-HTTP schemes (file://, gopher://, ftp://, data://)', () => {
    expect(validateSafeUrl('file:///etc/passwd').safe).toBe(false);
    expect(validateSafeUrl('gopher://gopher.floodgap.com').safe).toBe(false);
    expect(validateSafeUrl('ftp://ftp.example.com').safe).toBe(false);
    expect(validateSafeUrl('data:text/html,<html>test</html>').safe).toBe(false);
  });

  it('should block URLs with embedded basic authentication credentials', () => {
    const res = validateSafeUrl('https://admin:secretpassword@api.example.com');
    expect(res.safe).toBe(false);
    expect(res.error).toMatch(/embedded basic authentication/);
  });

  it('should verify FetchUrlTool rejects SSRF destinations without network calls', async () => {
    const fetchTool = new FetchUrlTool();
    const result = await fetchTool.execute(
      { url: 'http://169.254.169.254/latest/meta-data' },
      { workspaceRoot: '/tmp', sessionId: 's1' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('SSRF_BLOCKED');
    expect(result.output).toMatch(/Security violation/);
  });
});
