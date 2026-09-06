import { describe, it, expect } from 'vitest';
import { PermissionEngine, PermissionPolicy } from '@berkelium/permissions';

describe('Permission Levels & Granular Capabilities', () => {
  const basePolicy: PermissionPolicy = {
    level: 'auto',
    filesystem: {
      read: 'allow',
      write: { workspace: 'allow', outside_workspace: 'ask' },
      delete: { workspace: 'ask', outside_workspace: 'deny' },
    },
    shell: {
      safe: 'allow',
      destructive: 'ask',
      privileged: 'deny',
    },
    network: {
      default: 'ask',
      allowed_domains: ['api.github.com'],
    },
  };

  it('should support switching permission levels (ask, auto, full)', () => {
    const engine = new PermissionEngine('/tmp/workspace', basePolicy);
    expect(engine.getPermissionLevel()).toBe('auto');

    engine.setPermissionLevel('ask');
    expect(engine.getPermissionLevel()).toBe('ask');

    engine.setPermissionLevel('full');
    expect(engine.getPermissionLevel()).toBe('full');
  });

  it('in ASK mode, should require confirmation for filesystem writes and shell execution', () => {
    const engine = new PermissionEngine('/tmp/workspace', basePolicy);
    engine.setPermissionLevel('ask');

    const writeCheck = engine.checkPolicy({
      id: 'test-w1',
      category: 'filesystem',
      action: 'write_file',
      target: '/tmp/workspace/test.txt',
      risk: 'medium',
      description: 'Write test file',
    });
    expect(writeCheck.allowed).toBe(false);
    expect(writeCheck.requiresPrompt).toBe(true);

    const shellCheck = engine.checkPolicy({
      id: 'test-s1',
      category: 'shell',
      action: 'run_shell',
      target: 'npm test',
      risk: 'low',
      description: 'Run tests',
    });
    expect(shellCheck.allowed).toBe(false);
    expect(shellCheck.requiresPrompt).toBe(true);
  });

  it('in AUTO mode, should auto-allow safe read and search operations but prompt for mutations', () => {
    const engine = new PermissionEngine('/tmp/workspace', basePolicy);
    engine.setPermissionLevel('auto');

    const readCheck = engine.checkPolicy({
      id: 'test-r1',
      category: 'filesystem',
      action: 'read_file',
      target: '/tmp/workspace/package.json',
      risk: 'low',
      description: 'Read package.json',
    });
    expect(readCheck.allowed).toBe(true);
    expect(readCheck.requiresPrompt).toBe(false);

    const safeShellCheck = engine.checkPolicy({
      id: 'test-s2',
      category: 'shell',
      action: 'run_shell',
      target: 'ls -la',
      risk: 'low',
      description: 'List files',
    });
    expect(safeShellCheck.allowed).toBe(true);
    expect(safeShellCheck.requiresPrompt).toBe(false);
  });

  it('in FULL mode, should auto-approve standard tools BUT strictly block/prompt on protected operations', () => {
    const engine = new PermissionEngine('/tmp/workspace', basePolicy);
    engine.setPermissionLevel('full');

    // Standard shell command auto-approved in FULL mode
    const buildCheck = engine.checkPolicy({
      id: 'test-build',
      category: 'shell',
      action: 'run_shell',
      target: 'npm run build',
      risk: 'medium',
      description: 'Run build',
    });
    expect(buildCheck.allowed).toBe(true);
    expect(buildCheck.requiresPrompt).toBe(false);

    // CRITICAL: Protected destructive commands ALWAYS require explicit authorization or policy denial even in FULL mode
    const hardResetCheck = engine.checkPolicy({
      id: 'test-git-reset',
      category: 'shell',
      action: 'run_shell',
      target: 'git reset --hard',
      risk: 'critical',
      description: 'Discard all uncommitted changes',
    });
    expect(hardResetCheck.allowed).toBe(false);
    expect(hardResetCheck.isProtectedOperation).toBe(true);

    const forcePushCheck = engine.checkPolicy({
      id: 'test-force-push',
      category: 'shell',
      action: 'run_shell',
      target: 'git push --force origin main',
      risk: 'critical',
      description: 'Force push to remote',
    });
    expect(forcePushCheck.allowed).toBe(false);
    expect(forcePushCheck.isProtectedOperation).toBe(true);

    const rmRootCheck = engine.checkPolicy({
      id: 'test-rm-root',
      category: 'shell',
      action: 'run_shell',
      target: 'rm -rf /',
      risk: 'critical',
      description: 'Delete root directory',
    });
    expect(rmRootCheck.allowed).toBe(false);
    expect(rmRootCheck.isProtectedOperation).toBe(true);
  });

  it('should support granular capability grants', () => {
    const engine = new PermissionEngine('/tmp/workspace', basePolicy);
    engine.setPermissionLevel('ask');

    // Before grant
    const beforeCheck = engine.checkPolicy({
      id: 'test-grant-1',
      category: 'network',
      action: 'fetch',
      target: 'https://custom-api.internal',
      risk: 'medium',
      description: 'Internal API fetch',
    });
    expect(beforeCheck.allowed).toBe(false);
    expect(beforeCheck.requiresPrompt).toBe(true);

    // Grant capability
    engine.grantCapability({
      id: 'grant-net-1',
      capability: 'network.access',
      targetPattern: 'custom-api.internal',
      scope: 'session',
      grantedAt: Date.now(),
    });

    // After grant
    const afterCheck = engine.checkPolicy({
      id: 'test-grant-2',
      category: 'network',
      action: 'fetch',
      target: 'https://custom-api.internal',
      risk: 'medium',
      description: 'Internal API fetch',
    });
    expect(afterCheck.allowed).toBe(true);
    expect(afterCheck.requiresPrompt).toBe(false);
  });
});
