import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { WorkingDirectoryManager } from '@berkelium/context';

describe('WorkingDirectoryManager', () => {
  it('should initialize with current working directory or explicit path', () => {
    const mgr = new WorkingDirectoryManager(process.cwd());
    expect(mgr.getCwd()).toBe(fs.realpathSync(process.cwd()));
    expect(mgr.getRelativeHome()).toBeDefined();
  });

  it('should format status with detected language and Git repository info', () => {
    const mgr = new WorkingDirectoryManager(process.cwd());
    const status = mgr.formatStatus();
    expect(status).toContain('Working directory:');
    expect(status).toContain('Repository:');
    expect(status).toContain('TypeScript');
  });

  it('should safely navigate directories with cd and validate paths', () => {
    const mgr = new WorkingDirectoryManager(process.cwd());
    const initialDir = mgr.getCwd();

    // Navigate to packages/context
    const res = mgr.changeDirectory('./packages/context');
    expect(res.success).toBe(true);
    expect(res.newDir).toBe(fs.realpathSync(path.join(initialDir, 'packages/context')));

    // Attempt to cd into non-existent path
    const failRes = mgr.changeDirectory('./non-existent-xyz-directory');
    expect(failRes.success).toBe(false);
    expect(failRes.error).toBe('DIRECTORY_NOT_FOUND');
    expect(mgr.getCwd()).toBe(fs.realpathSync(path.join(initialDir, 'packages/context')));

    // Return to initial
    mgr.changeDirectory(initialDir);
    expect(mgr.getCwd()).toBe(initialDir);
  });

  it('should list directory entries with types and sizes', () => {
    const mgr = new WorkingDirectoryManager(process.cwd());
    const entries = mgr.listDirectory();
    expect(entries.length).toBeGreaterThan(0);

    const names = entries.map((e) => e.name);
    expect(names).toContain('package.json');
    expect(names).toContain('packages');
  });
});
