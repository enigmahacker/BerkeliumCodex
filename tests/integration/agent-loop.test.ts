import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ConfigManager } from '@berkelium/config';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { ToolRegistry, ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import {
  Provider,
  ProviderCapabilities,
  ProviderRouter,
  Message,
  NormalizedChunk,
  NormalizedResponse,
  ProviderRequestOptions,
} from '@berkelium/providers';
import { AgentRuntime } from '@berkelium/agent';

class MockProvider implements Provider {
  public readonly id = 'mock';
  public readonly name = 'Mock Provider';
  private callCount = 0;

  public capabilities(): ProviderCapabilities {
    return {
      streaming: true,
      tool_calling: true,
      vision: false,
      reasoning: false,
      structured_output: true,
      embeddings: false,
      model_discovery: false,
    };
  }

  public async isAvailable(): Promise<boolean> {
    return true;
  }

  public async listModels() {
    return [{ id: 'mock-model', name: 'Mock Model', provider: 'mock', context_length: 32000, capabilities: {} }];
  }

  public async *stream(
    messages: Message[],
    _options: ProviderRequestOptions
  ): AsyncIterable<NormalizedChunk> {
    this.callCount++;

    if (this.callCount === 1) {
      // First turn: Request to write a file
      yield { type: 'token', text: 'I will create the greeting module.' };
      yield {
        type: 'tool_call_delta',
        toolCall: {
          index: 0,
          id: 'call_mock_write',
          name: 'write_file',
          argumentsDelta: JSON.stringify({ path: 'src/greeting.ts', content: 'export const msg = "Hello from Berkelium!";\n' }),
        },
      };
      yield { type: 'finish', finishReason: 'tool_calls' };
    } else {
      // Second turn: Report task complete
      yield { type: 'token', text: 'I have successfully created the greeting module and verified it.' };
      yield { type: 'finish', finishReason: 'stop' };
    }
  }

  public async generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse> {
    return {
      text: 'Done',
      toolCalls: [],
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      finishReason: 'stop',
      model: options.model,
      provider: 'mock',
    };
  }
}

describe('Agent Loop Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'berkelium-agent-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should run multi-turn tool execution loop and write file autonomously', async () => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    configManager.setSessionOverride({ agent: { verify_changes: false } as any });

    const router = new ProviderRouter(configManager.getConfig(), logger);
    const mockProvider = new MockProvider();
    router.registerProvider(mockProvider);

    const permissionEngine = new PermissionEngine(tempDir, configManager.getConfig().permissions, eventBus);
    const secretRedactor = new SecretRedactor();
    const registry = new ToolRegistry();
    const orchestrator = new ToolOrchestrator(registry, permissionEngine, secretRedactor, logger, tempDir, eventBus);
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

    runtime.setActiveModel('mock/mock-model');

    const emittedEvents: string[] = [];
    eventBus.on('*', (e) => emittedEvents.push(e.type));

    await runtime.executeTask('Create a greeting module in src/greeting.ts');

    // Verify events sequence
    expect(emittedEvents).toContain('state_changed');
    expect(emittedEvents).toContain('tool_requested');
    expect(emittedEvents).toContain('tool_started');
    expect(emittedEvents).toContain('tool_completed');

    // Verify file was physically written to disk
    const createdFile = await fs.readFile(path.join(tempDir, 'src/greeting.ts'), 'utf-8');
    expect(createdFile).toContain('Hello from Berkelium!');
  });
});
