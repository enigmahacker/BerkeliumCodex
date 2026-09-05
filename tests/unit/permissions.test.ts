import { describe, it, expect } from 'vitest';
import { PermissionEngine } from '@berkelium/permissions';
import { BerkeliumConfigSchema } from '@berkelium/config';

describe('PermissionEngine', () => {
  const defaultPolicy = BerkeliumConfigSchema.parse({}).permissions;

  it('should allow read operations within workspace', async () => {
    const engine = new PermissionEngine('/tmp/workspace', defaultPolicy);
    const result = engine.checkPolicy({
      id: 'p1',
      category: 'filesystem',
      action: 'read',
      target: 'src/index.ts',
      risk: 'low',
      description: 'Read file',
    });

    expect(result.allowed).toBe(true);
    expect(result.requiresPrompt).toBe(false);
  });

  it('should require prompt for destructive delete inside workspace', () => {
    const engine = new PermissionEngine('/tmp/workspace', defaultPolicy);
    const result = engine.checkPolicy({
      id: 'p2',
      category: 'filesystem',
      action: 'delete',
      target: 'src/secret.ts',
      risk: 'medium',
      description: 'Delete file',
    });

    expect(result.requiresPrompt).toBe(true);
  });

  it('should deny privileged/dangerous shell commands', () => {
    const engine = new PermissionEngine('/tmp/workspace', defaultPolicy);
    const result = engine.checkPolicy({
      id: 'p3',
      category: 'shell',
      action: 'run_shell',
      target: 'sudo rm -rf /',
      risk: 'critical',
      description: 'Execute dangerous command',
    });

    expect(result.allowed).toBe(false);
    expect(result.requiresPrompt).toBe(false);
  });
});
