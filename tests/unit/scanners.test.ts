import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { ProjectScanner, SystemScanner } from '@berkelium/context';
import { SecurityScanner } from '@berkelium/permissions';

describe('Project, System, and Security Scanners', () => {
  const root = process.cwd();

  it('ProjectScanner should inspect files, dependencies, and git status', () => {
    const result = ProjectScanner.scan(root, 'project');
    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.sourceFiles).toBeGreaterThan(0);
    expect(result.language).toBe('TypeScript');
    expect(result.framework).toContain('Node.js');

    const formatted = ProjectScanner.formatReport(result);
    expect(formatted).toContain('PROJECT SCAN');
    expect(formatted).toContain('TypeScript');
    expect(formatted).toContain('Files:');
  });

  it('SystemScanner should return real OS, CPU, memory, and dev environment metrics', () => {
    const sys = SystemScanner.scan();
    expect(sys.os.platform).toBeDefined();
    expect(sys.cpu.cores).toBeGreaterThan(0);
    expect(sys.memory.totalBytes).toBeGreaterThan(0);
    expect(sys.environment.Node).toBeDefined();

    const overview = SystemScanner.formatReport(sys);
    expect(overview).toContain('SYSTEM SCAN');
    expect(overview).toContain('OS:');
    expect(overview).toContain('Memory Total:');

    const storageReport = SystemScanner.formatReport(sys, 'storage');
    expect(storageReport).toContain('STORAGE SCAN');

    const envReport = SystemScanner.formatReport(sys, 'environment');
    expect(envReport).toContain('DEVELOPMENT ENVIRONMENT TOOLCHAINS');
  });

  it('SecurityScanner should scan files for secrets and output non-fabricated results', () => {
    const sec = SecurityScanner.scan(root);
    expect(sec.filesScanned).toBeGreaterThan(0);
    expect(sec.disclaimer).toContain('does not guarantee the absence of vulnerabilities');

    const formatted = SecurityScanner.formatReport(sec);
    expect(formatted).toContain('SECURITY ASSESSMENT REPORT');
    expect(formatted).toContain('HIGH:');
    expect(formatted).toContain('MEDIUM:');
    expect(formatted).toContain('LOW:');
  });

  it('SecurityScanner should detect test secrets in simulated file', () => {
    const tempDir = path.join(root, '.berkelium', 'test-sec-temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const secretFile = path.join(tempDir, 'leaked.txt');
    fs.writeFileSync(secretFile, 'export OPENAI_API_KEY="sk-123456789012345678901234567890123456789012345678"\n', 'utf-8');

    try {
      const scanRes = SecurityScanner.scan(tempDir);
      expect(scanRes.highCount).toBeGreaterThan(0);
      expect(scanRes.findings.some(f => f.category === 'SECRET_LEAK')).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
