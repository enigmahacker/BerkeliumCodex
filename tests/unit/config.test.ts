import { describe, it, expect } from 'vitest';
import { ConfigManager, BerkeliumConfigSchema } from '@berkelium/config';

describe('ConfigEngine', () => {
  it('should load valid default configuration', () => {
    const manager = new ConfigManager();
    const config = manager.getConfig();

    expect(config.version).toBe(1);
    expect(config.default_model).toBe('coding');
    expect(config.models.coding.provider).toBe('openrouter');
    expect(config.providers.nvidia.enabled).toBe(true);
    expect(config.permissions.filesystem.read).toBe('allow');
    expect(config.theme.name).toBe('berkelium-dark');
  });

  it('should accept custom session overrides', () => {
    const manager = new ConfigManager();
    manager.setSessionOverride({ default_model: 'local' });
    const config = manager.getConfig();

    expect(config.default_model).toBe('local');
  });

  it('should validate schema strictly with Zod', () => {
    expect(() => {
      BerkeliumConfigSchema.parse({
        version: 'invalid', // should be number
      });
    }).toThrow();
  });
});
