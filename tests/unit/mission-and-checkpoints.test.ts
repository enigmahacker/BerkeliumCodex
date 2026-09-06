import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { MissionRunner } from '../../packages/agent/src/mission.js';
import { CheckpointManager } from '../../packages/agent/src/checkpoint-manager.js';
import { BackgroundTaskManager } from '../../packages/agent/src/background-task-manager.js';
import { NetworkController } from '../../packages/tools/src/network-controller.js';
import { ToolOrchestrator, ToolRegistry, FetchUrlTool } from '@berkelium/tools';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { EventBus } from '../../packages/events/src/event-bus.js';
import { Logger } from '../../packages/logging/src/logger.js';
import { ProviderRouter } from '../../packages/providers/src/router.js';
import { Verifier } from '../../packages/agent/src/verifier.js';
import { ConfigManager } from '@berkelium/config';

describe('Mission Runner, Checkpoints, Background Tasks, and Network Controls', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-mission-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('MissionRunner Goal Decomposition', () => {
    it('should decompose "fix all failing tests" goal into systematic test-fix steps', () => {
      const logger = new Logger({ subsystem: 'test' });
      const eventBus = new EventBus();
      const configManager = new ConfigManager(tempDir);
      const router = new ProviderRouter(configManager.getConfig(), logger);
      const permissionEngine = new PermissionEngine(tempDir, configManager.getConfig().permissions, eventBus);
      const orchestrator = new ToolOrchestrator(
        new ToolRegistry(),
        permissionEngine,
        new SecretRedactor(),
        logger,
        tempDir,
        eventBus
      );
      const verifier = new Verifier();

      const runner = new MissionRunner(orchestrator, router, verifier, logger, eventBus, tempDir);
      const tasks = runner.decomposeGoal('Fix all failing tests');

      expect(tasks.length).toBe(4);
      expect(tasks[0].objective).toContain('Run workspace test suite');
      expect(tasks[1].objective).toContain('Analyze failures');
      expect(tasks[2].objective).toContain('Apply surgical fixes');
      expect(tasks[3].objective).toContain('Run test suite verification');
    });

    it('should decompose compound or arbitrary goals into structured subtasks', () => {
      const logger = new Logger({ subsystem: 'test' });
      const eventBus = new EventBus();
      const configManager = new ConfigManager(tempDir);
      const router = new ProviderRouter(configManager.getConfig(), logger);
      const permissionEngine = new PermissionEngine(tempDir, configManager.getConfig().permissions, eventBus);
      const orchestrator = new ToolOrchestrator(
        new ToolRegistry(),
        permissionEngine,
        new SecretRedactor(),
        logger,
        tempDir,
        eventBus
      );
      const verifier = new Verifier();

      const runner = new MissionRunner(orchestrator, router, verifier, logger, eventBus, tempDir);
      const compoundTasks = runner.decomposeGoal('Compile project; Run linter; Run typecheck');

      expect(compoundTasks.length).toBe(3);
      expect(compoundTasks[0].objective).toBe('Compile project');
      expect(compoundTasks[1].objective).toBe('Run linter');
      expect(compoundTasks[2].objective).toBe('Run typecheck');

      const genericTasks = runner.decomposeGoal('Implement dark mode toggle');
      expect(genericTasks.length).toBe(3);
      expect(genericTasks[0].objective).toContain('Understand and inspect');
      expect(genericTasks[1].objective).toContain('Execute implementation');
      expect(genericTasks[2].objective).toContain('Verify results');
    });
  });

  describe('CheckpointManager', () => {
    it('should create and list checkpoints in .berkelium/checkpoints/', () => {
      const manager = new CheckpointManager(tempDir);
      expect(manager.listCheckpoints().length).toBe(0);

      const cp1 = manager.createCheckpoint('before_feature');
      expect(cp1.id).toBeDefined();
      expect(cp1.name).toBe('before_feature');
      expect(fs.existsSync(path.join(tempDir, '.berkelium', 'checkpoints', `${cp1.id}.json`))).toBe(true);

      const list = manager.listCheckpoints();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(cp1.id);

      const formatted = manager.formatCheckpoints();
      expect(formatted).toContain('CHECKPOINTS');
      expect(formatted).toContain(cp1.id);
    });

    it('should handle non-existent checkpoint restoration gracefully', () => {
      const manager = new CheckpointManager(tempDir);
      const result = manager.restoreCheckpoint('non_existent_cp');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Checkpoint not found');
    });
  });

  describe('BackgroundTaskManager', () => {
    it('should start, list, buffer output, and stop tasks', async () => {
      const bg = BackgroundTaskManager.getInstance();
      const task = bg.startTask('sleep 10', tempDir);

      expect(task.id).toBeDefined();
      expect(task.status).toBe('RUNNING');
      expect(task.command).toBe('sleep 10');

      const found = bg.getTask(task.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(task.id);

      const stopped = bg.stopTask(task.id);
      expect(stopped).toBe(true);

      bg.stopAll();
    });
  });

  describe('NetworkController & Outbound Enforcement', () => {
    it('should toggle network allowed state and reflect status', () => {
      const net = NetworkController.getInstance();
      net.allowNetwork();
      expect(net.isNetworkAllowed()).toBe(true);
      expect(net.getStatus()).toBe('NETWORK: ALLOWED');

      net.denyNetwork();
      expect(net.isNetworkAllowed()).toBe(false);
      expect(net.getStatus()).toBe('NETWORK: BLOCKED');

      // Reset
      net.allowNetwork();
    });

    it('should block web/network tools in ToolOrchestrator when network is denied', async () => {
      const logger = new Logger({ subsystem: 'test' });
      const eventBus = new EventBus();
      const configManager = new ConfigManager(tempDir);
      const registry = new ToolRegistry();

      registry.register(new FetchUrlTool());

      const permissionEngine = new PermissionEngine(tempDir, configManager.getConfig().permissions, eventBus);
      const orchestrator = new ToolOrchestrator(
        registry,
        permissionEngine,
        new SecretRedactor(),
        logger,
        tempDir,
        eventBus
      );

      // Deny network
      NetworkController.getInstance().denyNetwork();

      const result = await orchestrator.execute({
        callId: 'call_net_1',
        toolName: 'fetch_url',
        args: { url: 'https://example.com' },
        sessionId: 'session-net-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_BLOCKED');
      expect(result.output).toContain('NETWORK: BLOCKED');

      // Re-enable network
      NetworkController.getInstance().allowNetwork();
    });
  });
});
