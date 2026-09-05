import { describe, it, expect } from 'vitest';
import { CommandMatcher } from '../../apps/cli/src/commands/matcher.js';
import { CommandDefinition } from '../../apps/cli/src/commands/types.js';

describe('CommandMatcher (4-Tier Fuzzy Search & Ranking)', () => {
  const sampleCommands: CommandDefinition[] = [
    { name: 'model', description: 'Change active model', category: 'MODEL' },
    { name: 'models', description: 'List available models', category: 'MODEL' },
    { name: 'matrix', description: 'Trigger matrix rain', category: 'THEMES' },
    { name: 'theme', description: 'Change theme', category: 'THEMES' },
    { name: 'permissions', aliases: ['perms'], description: 'Inspect permissions', category: 'PERMISSIONS' },
    { name: 'provider', description: 'Change provider', category: 'PROVIDERS' },
    { name: 'status', description: 'Show status', category: 'SYSTEM' },
    { name: 'subagents', description: 'Manage subagents', category: 'AGENTS' },
  ];

  it('should rank exact matches highest with 1000 score', () => {
    const results = CommandMatcher.matchCommands(sampleCommands, 'model');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].command.name).toBe('model');
    expect(results[0].score).toBe(1000);
    expect(results[0].matchedIndices).toEqual([0, 1, 2, 3, 4]);
  });

  it('should rank prefix matches correctly and extract character indices', () => {
    const results = CommandMatcher.matchCommands(sampleCommands, 'm');
    expect(results.some((r) => r.command.name === 'model')).toBe(true);
    expect(results.some((r) => r.command.name === 'models')).toBe(true);
    expect(results.some((r) => r.command.name === 'matrix')).toBe(true);

    const modelMatch = results.find((r) => r.command.name === 'model');
    expect(modelMatch?.matchedIndices).toEqual([0]);
  });

  it('should match aliases properly', () => {
    const results = CommandMatcher.matchCommands(sampleCommands, 'perms');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].command.name).toBe('permissions');
  });

  it('should match dynamic argument options accurately', () => {
    const options = [
      { value: 'coding', description: 'DeepSeek Chat' },
      { value: 'local', description: 'Local Ollama' },
      { value: 'fast', description: 'Gemini Flash' },
      { value: 'reasoning', description: 'DeepSeek R1' },
      { value: 'ollama/qwen2.5:14b', description: 'Local Qwen' },
    ];

    const results = CommandMatcher.matchArguments(options, 'cod');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe('coding');
    expect(results[0].matchedIndices).toEqual([0, 1, 2]);

    const emptyResults = CommandMatcher.matchArguments(options, '');
    expect(emptyResults.length).toBe(options.length);
  });
});
