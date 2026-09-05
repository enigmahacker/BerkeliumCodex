import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { PermissionEngine } from '@berkelium/permissions';
import {
  resolveSafeWorkspacePath,
  SecurityPathError,
  ReadFileTool,
  WriteFileTool,
  DeleteFileTool,
  EditFileTool,
  ListDirectoryTool,
} from '@berkelium/tools';
import { BerkeliumConfigSchema } from '@berkelium/config';

describe('Security Hardening: Workspace Boundary & Jail', () => {
  let tmpDir: string;
  let defaultPolicy: any;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-jail-test-'));
    defaultPolicy = BerkeliumConfigSchema.parse({}).permissions;
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should block directory traversal escaping workspace (../ traversal)', () => {
    expect(() => {
      resolveSafeWorkspacePath(tmpDir, '../../etc/passwd');
    }).toThrowError(SecurityPathError);

    expect(() => {
      resolveSafeWorkspacePath(tmpDir, '../../../private/etc/shadow');
    }).toThrowError(/Path traversal blocked/);
  });

  it('should block prefix collision attacks (e.g. /workspace-fake vs /workspace)', () => {
    const fakeSibling = `${tmpDir}-fake/evil.txt`;
    expect(() => {
      resolveSafeWorkspacePath(tmpDir, fakeSibling);
    }).toThrowError(/Path traversal blocked/);
  });

  it('should block null-byte injection attacks in file paths', () => {
    expect(() => {
      resolveSafeWorkspacePath(tmpDir, 'valid.txt\0.evil');
    }).toThrowError(/Null-byte injection/);
  });

  it('should block symlink escapes pointing outside workspace', () => {
    // Create an external secret file outside workspace
    const externalSecret = path.join(os.tmpdir(), `bk-ext-${Date.now()}.txt`);
    fs.writeFileSync(externalSecret, 'EXTERNAL_SECRET_DATA');

    // Create a symlink inside workspace pointing to external file
    const symlinkPath = path.join(tmpDir, 'symlink-to-secret');
    fs.symlinkSync(externalSecret, symlinkPath);

    try {
      expect(() => {
        resolveSafeWorkspacePath(tmpDir, 'symlink-to-secret');
      }).toThrowError(/Symlink escape blocked/);
    } finally {
      if (fs.existsSync(externalSecret)) {
        fs.unlinkSync(externalSecret);
      }
    }
  });

  it('should prevent deleting the workspace root or filesystem root', async () => {
    const deleteTool = new DeleteFileTool();
    const result = await deleteTool.execute(
      { path: '.' },
      { workspaceRoot: tmpDir, sessionId: 's1' }
    );

    expect(result.success).toBe(false);
    expect(result.output).toMatch(/Refusing to delete workspace root/);
  });

  it('should enforce write_file and edit_file to stay strictly inside workspace', async () => {
    const writeTool = new WriteFileTool();
    const writeRes = await writeTool.execute(
      { path: '../../escaped.txt', content: 'hello' },
      { workspaceRoot: tmpDir, sessionId: 's1' }
    );
    expect(writeRes.success).toBe(false);
    expect(writeRes.output).toMatch(/Path traversal blocked/);

    const editTool = new EditFileTool();
    const editRes = await editTool.execute(
      { path: '../../escaped.txt', target: 'a', replacement: 'b' },
      { workspaceRoot: tmpDir, sessionId: 's1' }
    );
    expect(editRes.success).toBe(false);
    expect(editRes.output).toMatch(/Path traversal blocked/);
  });

  it('should identify and block sensitive paths in PermissionEngine', () => {
    const engine = new PermissionEngine(tmpDir, defaultPolicy);

    const sshCheck = engine.isSensitivePath('.ssh/id_rsa');
    expect(sshCheck.isSensitive).toBe(true);
    expect(sshCheck.reason).toMatch(/SSH/);

    const envCheck = engine.isSensitivePath('.env.production');
    expect(envCheck.isSensitive).toBe(true);

    const awsCheck = engine.isSensitivePath('.aws/credentials');
    expect(awsCheck.isSensitive).toBe(true);

    const keyCheck = engine.isSensitivePath('certs/server.key');
    expect(keyCheck.isSensitive).toBe(true);
  });
});
