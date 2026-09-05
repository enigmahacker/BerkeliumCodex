import { describe, it, expect } from 'vitest';
import { MicroOutputCompactor, ContextCompactor, RepoMapper, Tokenizer } from '@berkelium/context';
import { PromptEngine, DEFAULT_IDENTITY_PROMPT, DEFAULT_BEHAVIOR_PROMPT } from '@berkelium/config';
import { Message } from '@berkelium/providers';
import { TelemetryTracker } from '@berkelium/telemetry';
import { CommandRegistry } from '../../apps/cli/src/commands/registry.js';


describe('Token Effectiveness & Lossless Compaction Architecture', () => {
  describe('MicroOutputCompactor', () => {
    it('should compact large file reads from historical turns while preserving recent turns in full fidelity', () => {
      // Simulate 4 turns
      const largeFileContent = Array.from({ length: 150 }, (_, i) => 
        `export class ServiceHandler${i} {\n  public handle(): void {\n    console.log("processing ${i}");\n  }\n}`
      ).join('\n');

      const recentFileContent = `export function calculateTotal(a: number, b: number): number {\n  return a + b;\n}`;

      const messages: Message[] = [
        { role: 'user', content: 'Step 1: Read the historical service file' },
        {
          role: 'assistant',
          content: 'Reading historical service file',
          tool_calls: [{ id: 'call_1', name: 'read_file', arguments: { path: 'src/services.ts' } }],
        },
        {
          role: 'tool',
          name: 'read_file',
          tool_call_id: 'call_1',
          content: largeFileContent,
        },
        { role: 'user', content: 'Step 2: Read recent file and calculate total' },
        {
          role: 'assistant',
          content: 'Reading recent file',
          tool_calls: [{ id: 'call_2', name: 'read_file', arguments: { path: 'src/calc.ts' } }],
        },
        {
          role: 'tool',
          name: 'read_file',
          tool_call_id: 'call_2',
          content: recentFileContent,
        },
      ];

      const res = MicroOutputCompactor.compactToolOutputs(messages, { keepRecentTurns: 1 });

      expect(res.compactedCount).toBe(1);
      expect(res.tokensSaved).toBeGreaterThan(500);

      // Historical tool output (turn 1) must be compacted with key symbols
      const historicalToolMsg = res.messages[2];
      expect(historicalToolMsg.content).toContain('[Read file');
      expect(historicalToolMsg.content).toContain('Key symbols:');
      expect(historicalToolMsg.content).toContain('ServiceHandler0');
      expect(historicalToolMsg.content).toContain('Full content elided from historical turn');

      // Recent tool output (turn 2) must remain 100% untouched
      const recentToolMsg = res.messages[5];
      expect(recentToolMsg.content).toBe(recentFileContent);
    });

    it('should compact verbose search results to concise file citations', () => {
      const verboseSearchOutput = Array.from({ length: 40 }, (_, i) => 
        `{"File":"/workspace/packages/agent/src/mod_${i}.ts","LineNumber":${i * 10},"LineContent":"function processItem_${i}()"}`
      ).join('\n');

      const messages: Message[] = [
        { role: 'user', content: 'Search for processItem' },
        {
          role: 'assistant',
          tool_calls: [{ id: 'call_search', name: 'search_files', arguments: { query: 'processItem' } }],
        },
        {
          role: 'tool',
          name: 'search_files',
          tool_call_id: 'call_search',
          content: verboseSearchOutput,
        },
        { role: 'user', content: 'Recent turn user prompt' },
        { role: 'assistant', content: 'Recent response' },
      ];

      const res = MicroOutputCompactor.compactToolOutputs(messages, { keepRecentTurns: 1 });
      expect(res.compactedCount).toBe(1);
      expect(res.messages[2].content).toContain('[Search results: 40 matches found');
      expect(res.messages[2].content).toContain('Compacted historical search output');
    });

    it('should preserve failing error logs intact during command output compaction', () => {
      const failedCommandOutput = [
        'Running vitest run...',
        'Compiling test bundles [50%]...',
        'FAIL src/agent.test.ts > AgentRuntime > should handle execution error',
        'AssertionError: expected false to be true',
        '  at Object.<anonymous> (/workspace/packages/agent/src/runtime.ts:150:12)',
        'Tests failed with exit code 1',
      ].join('\n');

      const messages: Message[] = [
        { role: 'user', content: 'Run test suite' },
        {
          role: 'assistant',
          tool_calls: [{ id: 'call_cmd', name: 'run_shell', arguments: { command: 'npm test' } }],
        },
        {
          role: 'tool',
          name: 'run_shell',
          tool_call_id: 'call_cmd',
          content: failedCommandOutput,
        },
        { role: 'user', content: 'Fix the failing test' },
        { role: 'assistant', content: 'Analyzing failure...' },
      ];

      const res = MicroOutputCompactor.compactToolOutputs(messages, { keepRecentTurns: 1 });
      // The error trace details must be preserved for reasoning
      expect(res.messages[2].content).toContain('AssertionError');
      expect(res.messages[2].content).toContain('FAIL');
    });
  });

  describe('ContextCompactor with Micro-Output Integration', () => {
    it('should retain full conversation turns when micro-compaction reduces tokens below budget', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Initial user prompt' },
      ];

      // Generate 8 turns with tool outputs
      for (let i = 0; i < 8; i++) {
        messages.push({
          role: 'assistant',
          content: `Assistant step ${i}`,
          tool_calls: [{ id: `call_${i}`, name: 'read_file', arguments: { path: `file_${i}.ts` } }],
        });
        messages.push({
          role: 'tool',
          name: 'read_file',
          tool_call_id: `call_${i}`,
          content: `export class Module${i} {\n${'  public execute(): void {}\n'.repeat(30)}}`,
        });
      }

      const res = ContextCompactor.compact(messages, 50000, 0.8);
      expect(res.compacted).toBe(true);
      expect(res.tokensSaved).toBeGreaterThan(0);
      expect(res.microCompactedCount).toBeGreaterThan(0);
      // Messages length should remain intact because micro-compaction was sufficient!
      expect(res.messages.length).toBe(messages.length);
    });
  });

  describe('Dense Symbol-Aware RepoMapper', () => {
    it('should group repository files by directory with symbol annotations', async () => {
      const mapper = new RepoMapper(process.cwd());
      const repoMap = await mapper.generateRepoMap(800);

      expect(repoMap).toContain('# Repository Map (Key Symbols)');
      expect(repoMap).toContain('packages/');
      expect(repoMap).toContain('• ');
      // Verify token budget
      const tokens = Tokenizer.countTokens(repoMap);
      expect(tokens).toBeLessThanOrEqual(800);
    });
  });

  describe('Prompt Caching Stability & Layering', () => {
    it('should pin immutable prompt prefix at index 0 and dynamic workspace at trailing position', () => {
      const staticLayers = {
        identity: 'You are Berkelium Master Agent.',
        behavior: 'Strict execution rules.',
        coding: 'Clean architecture.',
        safety: 'Default deny safety policy.',
        tools: 'Tool registry schemas.',
        custom: 'AGENTS.md project invariants.',
      };

      const composedTurn1 = PromptEngine.compose({
        ...staticLayers,
        workspace: 'Active Workspace: /project (turn 1 map)',
      });

      const composedTurn2 = PromptEngine.compose({
        ...staticLayers,
        workspace: 'Active Workspace: /project (turn 2 map with updated files)',
      });

      // The prefix (everything before Workspace Context) must be 100% character-for-character identical
      const prefix1 = composedTurn1.split('## Workspace Context')[0];
      const prefix2 = composedTurn2.split('## Workspace Context')[0];

      expect(prefix1).toBe(prefix2);
      expect(prefix1).toContain('You are Berkelium Master Agent.');
      expect(prefix1).toContain('Strict execution rules.');
      expect(prefix1).toContain('AGENTS.md project invariants.');
    });
  });

  describe('Telemetry Tracking & Efficiency Metrics', () => {
    it('should accurately track tokens saved and compute efficiency multipliers', () => {
      const telemetry = new TelemetryTracker('test_session');
      telemetry.recordTokenUsage({
        promptTokens: 1200,
        completionTokens: 300,
        cachedTokens: 800,
      });

      telemetry.recordTokensSaved(2500);

      const stats = telemetry.getStats();
      expect(stats.tokenUsage.promptTokens).toBe(1200);
      expect(stats.tokenUsage.completionTokens).toBe(300);
      expect(stats.tokenUsage.totalTokens).toBe(1500);
      expect(stats.tokenUsage.cachedTokens).toBe(800);
      expect(stats.tokenUsage.compactedTokensSaved).toBe(2500);
      expect(stats.latencies.tokensSaved).toBe(2500);
      expect(stats.latencies.promptCacheHits).toBe(1);
      expect(stats.latencies.compactionRatio).toBeGreaterThan(0);
    });
  });

  describe('Slash Command Handler for Token Economy', () => {
    it('should recognize /tokens and /cost commands in CommandRegistry', () => {
      const registry = CommandRegistry.getInstance();
      const tokensCmd = registry.get('tokens');
      const costCmd = registry.get('cost');

      expect(tokensCmd).toBeDefined();
      expect(tokensCmd!.name).toBe('tokens');
      expect(costCmd).toBeDefined();
      expect(costCmd!.name).toBe('tokens');
    });
  });
});


