import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { PromptEngine, pickFileWithFinder, ConfigManager } from '@berkelium/config';
import { SlashCommandHandler } from '../../apps/cli/src/tui/slash-commands.js';
import { AgentRuntime } from '@berkelium/agent';
import { ThemeManager } from '@berkelium/themes';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AuthStore } from '@berkelium/auth';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';

describe('System Prompt Input from Text File & Finder Selector', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-system-prompt-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should export pickFileWithFinder function', () => {
    expect(typeof pickFileWithFinder).toBe('function');
  });

  it('should load prompt from a file and save to target layer', async () => {
    const samplePromptFile = path.join(tempDir, 'custom-rules.md');
    fs.writeFileSync(samplePromptFile, '# Custom Coding Rules\n- Rule 1: Use strict types\n- Rule 2: Clean architecture', 'utf-8');

    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    const authStore = new AuthStore(path.join(tempDir, 'auth'));
    const themeManager = new ThemeManager('berkelium-dark');
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(
      tempDir,
      configManager.getConfig().permissions,
      eventBus
    );
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      tempDir,
      eventBus
    );
    const contextEngine = new ContextEngine(tempDir, logger);
    const runtime = new AgentRuntime({
      workspaceRoot: tempDir,
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
    });

    const slashHandler = new SlashCommandHandler(
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore
    );

    // Run /system file coding <path>
    const handled = await slashHandler.handle(`/system file coding ${samplePromptFile}`);
    expect(handled).toBe(true);

    // Verify file was saved in workspace .berkelium/prompts/coding.md
    const savedFile = path.join(tempDir, '.berkelium', 'prompts', 'coding.md');
    expect(fs.existsSync(savedFile)).toBe(true);
    const savedContent = fs.readFileSync(savedFile, 'utf-8');
    expect(savedContent).toContain('Use strict types');

    // Verify composed prompt includes the loaded file content
    const customLayers = PromptEngine.loadCustomPrompts(tempDir);
    expect(customLayers.coding).toContain('Use strict types');
    const composed = PromptEngine.compose(customLayers, tempDir);
    expect(composed).toContain('Use strict types');
  });

  it('should load prompt from a file directly to custom layer when layer is omitted', async () => {
    const samplePromptFile = path.join(tempDir, 'agent-instructions.txt');
    fs.writeFileSync(samplePromptFile, 'Always format responses with markdown headings.', 'utf-8');

    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    const authStore = new AuthStore(path.join(tempDir, 'auth'));
    const themeManager = new ThemeManager('berkelium-dark');
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(
      tempDir,
      configManager.getConfig().permissions,
      eventBus
    );
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      tempDir,
      eventBus
    );
    const contextEngine = new ContextEngine(tempDir, logger);
    const runtime = new AgentRuntime({
      workspaceRoot: tempDir,
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
    });

    const slashHandler = new SlashCommandHandler(
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore
    );

    // Run /system file <path> (omitting layer name)
    const handled = await slashHandler.handle(`/system file ${samplePromptFile}`);
    expect(handled).toBe(true);

    const savedFile = path.join(tempDir, '.berkelium', 'system.md');
    expect(fs.existsSync(savedFile)).toBe(true);
    const savedContent = fs.readFileSync(savedFile, 'utf-8');
    expect(savedContent).toContain('Always format responses with markdown headings.');
  });
});
