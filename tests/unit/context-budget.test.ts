import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { Logger } from '@berkelium/logging';
import {
  ContextCompactor,
  ContextEngine,
  RepoMapper,
  Tokenizer,
  REPO_MAP_TOKEN_BUDGET,
} from '@berkelium/context';
import { Message } from '@berkelium/providers';

const logger = new Logger({ level: 'error', subsystem: 'context-budget-test' });

describe('Context budgeting', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'berkelium-context-'));
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  async function writeFile(relPath: string, content: string): Promise<void> {
    const fullPath = path.join(workspaceRoot, relPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  it('counts tool-call arguments instead of only message content', () => {
    const message: Message = {
      role: 'assistant',
      content: '',
      tool_calls: [
        {
          id: 'call_write',
          name: 'write_file',
          arguments: { path: 'src/big.ts', content: 'x'.repeat(4000) },
        },
      ],
    };

    const contentOnly = Tokenizer.countTokens(message.content || '') + 10;
    expect(Tokenizer.countMessageTokens(message)).toBeGreaterThan(contentOnly + 500);
  });

  it('includes system prompt and tool schema overhead in compaction pressure', () => {
    const engine = new ContextEngine(workspaceRoot, logger, 1000);
    const messages: Message[] = [{ role: 'user', content: 'x'.repeat(2160) }];

    expect(engine.needsCompaction(messages, 0.75)).toBe(false);
    expect(engine.needsCompaction(messages, 0.75, 200)).toBe(true);
  });

  it('reports tool-call argument tokens in compaction totals', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Apply the patch' },
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: 'call_patch',
            name: 'edit_file',
            arguments: { path: 'src/app.ts', content: 'y'.repeat(3600) },
          },
        ],
      },
      { role: 'tool', tool_call_id: 'call_patch', name: 'edit_file', content: 'ok' },
    ];

    const result = ContextCompactor.compact(messages, 100000, 0.75);
    expect(result.tokensBefore).toBeGreaterThan(900);
  });
});

describe('Repository map discovery', () => {
  let workspaceRoot: string;
  let mapper: RepoMapper;

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'berkelium-repomap-'));
    mapper = new RepoMapper(workspaceRoot);
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  async function writeFile(relPath: string, content: string): Promise<void> {
    const fullPath = path.join(workspaceRoot, relPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  it('skips ignored build directories and keeps prose out of symbol extraction', async () => {
    await writeFile('src/main.ts', 'export class WidgetFactory {}\nexport function buildWidget() {}\n');
    await writeFile('README.md', 'This interface and class or interface standing alone.\n');
    await writeFile('out/generated.ts', 'export class GeneratedArtifact {}\n');
    await writeFile('scratch/notes.ts', 'export class ScratchNote {}\n');
    await writeFile('node_modules/pkg/index.ts', 'export class Dependency {}\n');

    const map = await mapper.generateRepoMap(800);

    expect(map).toContain('• src: main.ts');
    expect(map).toContain('WidgetFactory');
    expect(map).not.toContain('out/');
    expect(map).not.toContain('scratch/');
    expect(map).not.toContain('node_modules');
    expect(map).not.toContain('README');
    expect(map).not.toContain('(and');
  });

  it('truncates long directory listings with an explicit remainder count', async () => {
    for (let i = 0; i < 7; i++) {
      await writeFile(`src/module-${i}.ts`, `export class Module${i} {}\n`);
    }

    const map = await mapper.generateRepoMap(800);
    expect(map).toContain('+3 more');
  });

  it('keeps every directory visible before spending budget on symbols', async () => {
    for (let d = 0; d < 10; d++) {
      for (let f = 0; f < 6; f++) {
        await writeFile(
          `pkg-${d}/module-${f}.ts`,
          `export class Package${d}Module${f}Handler {\n  public run(): void {}\n}\n`
        );
      }
    }

    const map = await mapper.generateRepoMap(400);
    const tokens = Tokenizer.countTokens(map);

    for (let d = 0; d < 10; d++) {
      expect(map).toContain(`pkg-${d}`);
    }
    expect(tokens).toBeLessThanOrEqual(400);
  });

  it('refreshes scan results only after invalidation', async () => {
    await writeFile('src/first.ts', 'export const first = 1;\n');
    const initial = await mapper.scan();
    expect(initial.some((f) => f.path === path.join('src', 'first.ts'))).toBe(true);

    await writeFile('src/second.ts', 'export const second = 2;\n');
    const cached = await mapper.scan();
    expect(cached.some((f) => f.path === path.join('src', 'second.ts'))).toBe(false);

    mapper.invalidate();
    const refreshed = await mapper.scan();
    expect(refreshed.some((f) => f.path === path.join('src', 'second.ts'))).toBe(true);
  });
});

describe('Relevant file selection', () => {
  let workspaceRoot: string;
  let engine: ContextEngine;

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'berkelium-rank-'));
    engine = new ContextEngine(workspaceRoot, logger);
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  async function writeFile(relPath: string, content: string): Promise<void> {
    const fullPath = path.join(workspaceRoot, relPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  it('ranks symbol matches and reports omitted matches within the budget', async () => {
    await writeFile('src/a-helper.ts', 'export class BudgetHelperService {}\n');
    await writeFile('src/b-helper.ts', 'export class BudgetHelperStore {}\n');
    await writeFile('src/unrelated.ts', 'export class UnrelatedThing {}\n');

    const context = await engine.getRelevantFilesContext('BudgetHelper', 120, 1);

    expect(context).toContain('Relevant files (ranked for current task):');
    expect(context).toContain('src/a-helper.ts');
    expect(context).toContain('BudgetHelperService');
    expect(context).toContain('1 more matching file(s)');
    expect(context).not.toContain('src/unrelated.ts');
  });

  it('returns an empty context when nothing in the workspace matches', async () => {
    await writeFile('src/unrelated.ts', 'export class UnrelatedThing {}\n');
    expect(await engine.getRelevantFilesContext('NoSuchSymbolAnywhere')).toBe('');
  });
});

describe('Compaction integrity', () => {
  it('never retains a tool result without its assistant tool call', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Task' },
      { role: 'assistant', content: 'A', tool_calls: [{ id: 'a', name: 'read_file', arguments: { path: 'a.ts' } }] },
      { role: 'tool', tool_call_id: 'a', name: 'read_file', content: 'a' },
      { role: 'assistant', content: 'B', tool_calls: [{ id: 'b', name: 'read_file', arguments: { path: 'b.ts' } }] },
      { role: 'tool', tool_call_id: 'b', name: 'read_file', content: 'b' },
      { role: 'assistant', content: 'C', tool_calls: [{ id: 'c', name: 'read_file', arguments: { path: 'c.ts' } }] },
      { role: 'tool', tool_call_id: 'c', name: 'read_file', content: 'c' },
      { role: 'assistant', content: 'D', tool_calls: [{ id: 'd', name: 'read_file', arguments: { path: 'd.ts' } }] },
      { role: 'tool', tool_call_id: 'd1', name: 'read_file', content: 'd1' },
      { role: 'tool', tool_call_id: 'd2', name: 'read_file', content: 'd2' },
    ];

    const result = ContextCompactor.compact(messages, 100, 0.1);
    expect(result.compacted).toBe(true);

    const summaryIndex = result.messages.findIndex(
      (m) => m.role === 'assistant' && m.content?.startsWith('[Compacted Conversation History Summary]')
    );
    expect(summaryIndex).toBeGreaterThan(-1);

    const retained = result.messages.slice(summaryIndex + 1);
    expect(retained[0].role).toBe('assistant');
    retained.forEach((message, index) => {
      if (message.role === 'tool') {
        expect(retained.slice(0, index).some((prior) => prior.role === 'assistant')).toBe(true);
      }
    });
  });
});

describe('Context breakdown reporting', () => {
  let workspaceRoot: string;
  let engine: ContextEngine;

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'berkelium-breakdown-'));
    engine = new ContextEngine(workspaceRoot, logger, 50000);
    const sourceDir = path.join(workspaceRoot, 'src');
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.writeFile(path.join(sourceDir, 'index.ts'), 'export class IndexThing {}\n', 'utf-8');
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('measures the repository map at the budget actually injected', async () => {
    const breakdown = await engine.getBreakdown('System prompt', [], '');
    const injectedMap = await engine.getRepoMap(REPO_MAP_TOKEN_BUDGET);

    expect(breakdown.projectTokens).toBe(Tokenizer.countTokens(injectedMap));
    expect(breakdown.limit).toBe(50000);
    expect('filesTokens' in breakdown).toBe(false);
  });

  it('counts tool-call arguments as conversation tokens', async () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          { id: 'call_big', name: 'write_file', arguments: { path: 'src/big.ts', content: 'z'.repeat(3600) } },
        ],
      },
    ];

    const breakdown = await engine.getBreakdown('', messages, '');
    expect(breakdown.conversationTokens).toBeGreaterThan(900);
  });
});
