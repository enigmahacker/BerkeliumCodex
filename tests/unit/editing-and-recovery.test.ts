import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  WriteFileTool,
  EditFileTool,
  CheckpointManager,
  ToolOrchestrator,
  ToolRegistry,
} from '@berkelium/tools';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { EventBus, TaskOutcomeEvent } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ProviderRouter } from '@berkelium/providers';
import { ConfigManager } from '@berkelium/config';
import { ContextEngine } from '@berkelium/context';
import { AgentRuntime } from '@berkelium/agent';

function runGit(cwd: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'commit.gpgsign=false',
      '-c',
      'user.name=Berkeley Test',
      '-c',
      'user.email=test@example.com',
      ...args,
    ],
    { cwd, stdio: ['ignore', 'pipe', 'ignore'] }
  ).toString();
}

function initRepo(dir: string): void {
  runGit(dir, 'init');
  fs.writeFileSync(path.join(dir, 'app.ts'), 'v1\n');
  runGit(dir, 'add', 'app.ts');
  runGit(dir, 'commit', '-m', 'initial');
}

function toolTurn(...calls: unknown[]): unknown[] {
  return [...calls, { type: 'finish', finishReason: 'tool_calls' }];
}

function textTurn(text: string): unknown[] {
  return [
    { type: 'token', text },
    { type: 'finish', finishReason: 'stop' },
  ];
}

function createRuntimeHarness(
  workspaceRoot: string,
  turns: unknown[][],
  options: { autoCheckpoint?: boolean } = {}
) {
  const { autoCheckpoint = true } = options;
  const logger = new Logger({ subsystem: 'editing-recovery-test' });
  const eventBus = new EventBus();
  const configManager = new ConfigManager(workspaceRoot);
  const config = configManager.getConfig();
  configManager.setSessionOverride({
    agent: {
      ...config.agent,
      max_iterations: 4,
      verify_changes: false,
      auto_checkpoint: autoCheckpoint,
      timeout_seconds: 30,
    },
  });

  const router = new ProviderRouter(configManager.getConfig(), logger);
  const permissionEngine = new PermissionEngine(workspaceRoot, config.permissions, eventBus);
  const orchestrator = new ToolOrchestrator(
    new ToolRegistry(),
    permissionEngine,
    new SecretRedactor(),
    logger,
    workspaceRoot,
    eventBus
  );
  const contextEngine = new ContextEngine(workspaceRoot, logger);
  const runtime = new AgentRuntime({
    workspaceRoot,
    configManager,
    router,
    orchestrator,
    contextEngine,
    logger,
    eventBus,
  });

  let turn = 0;
  vi.spyOn(router, 'resolveTarget').mockReturnValue({
    providerId: 'ollama',
    modelId: 'mock-model',
    provider: {
      isAvailable: async () => true,
      stream: async function* () {
        const chunks = turns[Math.min(turn, turns.length - 1)];
        turn++;
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    },
  } as any);

  return { runtime, eventBus };
}

function getOutcome(eventBus: EventBus): TaskOutcomeEvent {
  const outcomes = eventBus
    .getHistory()
    .filter((event): event is TaskOutcomeEvent => event.type === 'task_outcome');
  expect(outcomes).toHaveLength(1);
  return outcomes[0];
}

describe('Editing safety', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-editing-test-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('preserves executable permissions when write_file overwrites a file', async () => {
    const filePath = path.join(tempDir, 'script.sh');
    fs.writeFileSync(filePath, '#!/bin/sh\necho old\n');
    fs.chmodSync(filePath, 0o755);

    const result = await new WriteFileTool().execute(
      { path: 'script.sh', content: '#!/bin/sh\necho new\n' },
      { workspaceRoot: tempDir, sessionId: 'editing-test' }
    );

    expect(result.success).toBe(true);
    expect(fs.statSync(filePath).mode & 0o777).toBe(0o755);
    expect(fs.readFileSync(filePath, 'utf-8')).toContain('echo new');
  });

  it('preserves executable permissions when edit_file rewrites a file', async () => {
    const filePath = path.join(tempDir, 'tool.sh');
    fs.writeFileSync(filePath, '#!/bin/sh\necho old\n');
    fs.chmodSync(filePath, 0o755);

    const result = await new EditFileTool().execute(
      { path: 'tool.sh', target: 'old', replacement: 'new' },
      { workspaceRoot: tempDir, sessionId: 'editing-test' }
    );

    expect(result.success).toBe(true);
    expect(fs.statSync(filePath).mode & 0o777).toBe(0o755);
    expect(fs.readFileSync(filePath, 'utf-8')).toContain('echo new');
  });

  it('does not leave temporary files behind after atomic writes', async () => {
    await new WriteFileTool().execute(
      { path: 'src/app.ts', content: 'const ok = true;' },
      { workspaceRoot: tempDir, sessionId: 'editing-test' }
    );

    const leftovers = fs
      .readdirSync(path.join(tempDir, 'src'))
      .filter((name) => name.startsWith('.bk_tmp_'));
    expect(leftovers).toEqual([]);
  });
});

describe('Checkpoint recovery', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-checkpoint-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports non-Git workspaces as not restorable instead of claiming a snapshot', () => {
    const manager = new CheckpointManager(tempDir);
    const checkpoint = manager.createCheckpoint('manual');

    expect(checkpoint.restorable).toBe(false);
    expect(checkpoint.reason).toContain('not a Git repository');

    const restore = manager.restoreCheckpoint(checkpoint.id);
    expect(restore.success).toBe(false);
    expect(restore.message).toContain('cannot be restored');
  });

  it('keeps checkpoint storage out of git status', () => {
    initRepo(tempDir);
    const manager = new CheckpointManager(tempDir);
    manager.createCheckpoint('ignored');

    const status = runGit(tempDir, 'status', '--porcelain');
    expect(status).not.toContain('.berkelium');
  });

  it('captures and restores tracked modifications made before the checkpoint', () => {
    initRepo(tempDir);
    const appPath = path.join(tempDir, 'app.ts');
    fs.writeFileSync(appPath, 'v2\n');

    const manager = new CheckpointManager(tempDir);
    const checkpoint = manager.createCheckpoint('before_task');
    expect(checkpoint.restorable).toBe(true);
    expect(checkpoint.hasDiff).toBe(true);

    fs.writeFileSync(appPath, 'v3\n');

    const restore = manager.restoreCheckpoint(checkpoint.id);
    expect(restore.success).toBe(true);
    expect(fs.readFileSync(appPath, 'utf-8')).toBe('v2\n');

    const safetyCheckpoints = manager
      .listCheckpoints()
      .filter((entry) => entry.name.startsWith('safety_before_restore_'));
    expect(safetyCheckpoints.length).toBe(1);
  });

  it('prunes older automatic checkpoints while keeping manual ones', () => {
    const manager = new CheckpointManager(tempDir);
    const manual = manager.createCheckpoint('manual_keep');

    for (let i = 0; i < 25; i++) {
      manager.createCheckpoint('auto_before_task');
    }

    const checkpoints = manager.listCheckpoints();
    expect(checkpoints.filter((entry) => entry.name === 'auto_before_task').length).toBe(20);
    expect(checkpoints.some((entry) => entry.id === manual.id)).toBe(true);
  });
});

describe('AgentRuntime recovery checkpoints', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-auto-checkpoint-test-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates a restorable checkpoint before the first mutation and supports undo', async () => {
    initRepo(tempDir);
    const appPath = path.join(tempDir, 'app.ts');
    fs.writeFileSync(appPath, 'v2\n');

    const turns = [
      toolTurn({
        type: 'tool_call_delta',
        toolCall: {
          index: 0,
          id: 'call_0',
          name: 'write_file',
          argumentsDelta: JSON.stringify({ path: 'app.ts', content: 'v3\n' }),
        },
      }),
      textTurn('Updated the file.'),
    ];
    const { runtime, eventBus } = createRuntimeHarness(tempDir, turns);

    await runtime.executeTask('Update the file app.ts');

    expect(fs.readFileSync(appPath, 'utf-8')).toBe('v3\n');
    const outcome = getOutcome(eventBus);
    expect(outcome.status).toBe('completed');
    expect(outcome.checkpointId).toBeDefined();

    const manager = new CheckpointManager(tempDir);
    const undo = manager.undo();
    expect(undo.success).toBe(true);
    expect(fs.readFileSync(appPath, 'utf-8')).toBe('v2\n');
  });

  it('does not create checkpoint state outside a Git repository', async () => {
    const turns = [
      toolTurn({
        type: 'tool_call_delta',
        toolCall: {
          index: 0,
          id: 'call_0',
          name: 'write_file',
          argumentsDelta: JSON.stringify({ path: 'app.ts', content: 'v1\n' }),
        },
      }),
      textTurn('Created the file.'),
    ];
    const { runtime, eventBus } = createRuntimeHarness(tempDir, turns);

    await runtime.executeTask('Create app.ts');

    const outcome = getOutcome(eventBus);
    expect(outcome.status).toBe('completed');
    expect(outcome.checkpointId).toBeUndefined();
    expect(fs.existsSync(path.join(tempDir, '.berkelium', 'checkpoints'))).toBe(false);
  });

  it('honors agent.auto_checkpoint=false', async () => {
    initRepo(tempDir);
    const turns = [
      toolTurn({
        type: 'tool_call_delta',
        toolCall: {
          index: 0,
          id: 'call_0',
          name: 'write_file',
          argumentsDelta: JSON.stringify({ path: 'app.ts', content: 'v3\n' }),
        },
      }),
      textTurn('Updated the file.'),
    ];
    const { runtime, eventBus } = createRuntimeHarness(tempDir, turns, {
      autoCheckpoint: false,
    });

    await runtime.executeTask('Update the file app.ts');

    const outcome = getOutcome(eventBus);
    expect(outcome.checkpointId).toBeUndefined();
    expect(new CheckpointManager(tempDir).listCheckpoints()).toEqual([]);
  });
});
