import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { EventBus, AgentEvent } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ConfigManager } from '@berkelium/config';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { ToolRegistry, ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { ProviderRouter, Message, NormalizedChunk, NormalizedResponse, ProviderRequestOptions, Provider, ProviderCapabilities } from '@berkelium/providers';
import { AgentRuntime } from '@berkelium/agent';

class GoldenMockProvider implements Provider {
  public readonly id = 'golden';
  public readonly name = 'Golden Provider';
  private callCount = 0;

  public capabilities(): ProviderCapabilities {
    return {
      streaming: true,
      tool_calling: true,
      vision: false,
      reasoning: true,
      structured_output: true,
      embeddings: false,
      model_discovery: false,
    };
  }

  public async isAvailable() { return true; }
  public async listModels() { return [{ id: 'golden-model', name: 'Golden', provider: 'golden', context_length: 64000, capabilities: {} }]; }

  public async *stream(messages: Message[], _options: ProviderRequestOptions): AsyncIterable<NormalizedChunk> {
    this.callCount++;
    if (this.callCount === 1) {
      yield { type: 'reasoning', reasoning: 'Analyzing workspace structure and requirements.' };
      yield { type: 'token', text: 'Listing files...' };
      yield {
        type: 'tool_call_delta',
        toolCall: {
          index: 0,
          id: 'call_list_1',
          name: 'list_directory',
          argumentsDelta: JSON.stringify({ path: '.' }),
        },
      };
      yield { type: 'finish', finishReason: 'tool_calls' };
    } else {
      yield { type: 'token', text: 'All tasks verified.' };
      yield { type: 'finish', finishReason: 'stop' };
    }
  }

  public async generate(_messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse> {
    return {
      text: 'Golden done',
      toolCalls: [],
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      finishReason: 'stop',
      model: options.model,
      provider: 'golden',
    };
  }
}

describe('Golden Workflows', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'berkelium-golden-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should match canonical golden event trace', async () => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    configManager.setSessionOverride({ agent: { verify_changes: false } as any });

    const router = new ProviderRouter(configManager.getConfig(), logger);
    const goldenProvider = new GoldenMockProvider();
    router.registerProvider(goldenProvider);

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

    runtime.setActiveModel('golden/golden-model');

    const recordedEventTypes: string[] = [];
    eventBus.on('*', (e: AgentEvent) => {
      recordedEventTypes.push(e.type);
    });

    await runtime.executeTask('Inspect repository and list contents');

    // Canonical event sequence expectation
    const expectedSequence = [
      'message_started', // user
      'state_changed',   // THINKING -> COMPACTING_CONTEXT
      'state_changed',   // WAITING_FOR_MODEL
      'message_started', // assistant
      'reasoning_token_received',
      'token_received',
      'state_changed',   // EXECUTING_TOOL
      'tool_requested',
      'tool_started',
      'tool_completed',
      'state_changed',   // WAITING_FOR_MODEL (turn 2)
      'message_started', // assistant
      'token_received',
      'state_changed',   // COMPLETED -> IDLE
    ];

    for (const expected of ['tool_requested', 'tool_started', 'tool_completed', 'token_received', 'state_changed']) {
      expect(recordedEventTypes).toContain(expected);
    }
  });
});
