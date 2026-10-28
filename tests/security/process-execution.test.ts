import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { RunProcessTool, TestTool, ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { ConfigManager } from '@berkelium/config';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';

describe('Security Hardening: Process Execution', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bk-process-security-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should treat test filters as arguments instead of shell syntax', async () => {
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
      name: 'process-security-fixture',
      version: '1.0.0',
      scripts: { test: `${JSON.stringify(process.execPath)} --version` },
    }));
    const marker = path.join(tempDir, 'injected-marker');

    const result = await new TestTool().execute(
      { filter: `; touch ${JSON.stringify(marker)} #` },
      { workspaceRoot: tempDir, sessionId: 'injection-test' }
    );

    expect(result.success).toBe(true);
    expect(existsSync(marker)).toBe(false);
  });

  it('should strip secrets while preserving approved custom environment variables', async () => {
    process.env.BERKELIUM_TEST_SECRET = 'must-not-leak';
    process.env.BERKELIUM_TEST_VISIBLE = 'visible-value';

    try {
      const result = await new RunProcessTool().execute(
        {
          executable: process.execPath,
          args: [
            '-e',
            'process.stdout.write(JSON.stringify({ secret: process.env.BERKELIUM_TEST_SECRET, visible: process.env.BERKELIUM_TEST_VISIBLE }))',
          ],
          timeout_ms: 30000,
        },
        { workspaceRoot: tempDir, sessionId: 'env-test' }
      );

      expect(result.success).toBe(true);
      expect(JSON.parse(result.output)).toEqual({ visible: 'visible-value' });
      expect(result.output).not.toContain('must-not-leak');
    } finally {
      delete process.env.BERKELIUM_TEST_SECRET;
      delete process.env.BERKELIUM_TEST_VISIBLE;
    }
  });

  it('should scope session process approvals to the executable and arguments', async () => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    const permissionEngine = new PermissionEngine(tempDir, configManager.getConfig().permissions, eventBus);
    permissionEngine.setPermissionLevel('ask');
    const targets: string[] = [];
    permissionEngine.setPromptHandler(async (request) => {
      targets.push(request.target);
      return 'allow_session';
    });
    const registry = new ToolRegistry();
    registry.register(new RunProcessTool());
    const orchestrator = new ToolOrchestrator(
      registry,
      permissionEngine,
      new SecretRedactor(),
      logger,
      tempDir,
      eventBus
    );

    const first = await orchestrator.execute({
      callId: 'process-1',
      toolName: 'run_process',
      args: { executable: process.execPath, args: ['-e', '0'] },
      sessionId: 'process-target-test',
    });
    const second = await orchestrator.execute({
      callId: 'process-2',
      toolName: 'run_process',
      args: { executable: process.execPath, args: ['-e', 'process.exit(0)'] },
      sessionId: 'process-target-test',
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(targets).toEqual([
      `${process.execPath} -e 0`,
      `${process.execPath} -e process.exit(0)`,
    ]);
  });
});
