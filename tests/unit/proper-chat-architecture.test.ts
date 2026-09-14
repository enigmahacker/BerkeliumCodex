import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { EventBus, AgentEvent } from '@berkelium/events';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter, Provider, NormalizedChunk, NormalizedResponse, Message, ProviderRequestOptions, ModelInfo } from '@berkelium/providers';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { ContextEngine } from '@berkelium/context';
import { Logger } from '@berkelium/logging';
import { AuthStore } from '@berkelium/auth';
import { AgentRuntime } from '@berkelium/agent';
import { sanitizeAssistantResponse, StreamSanitizer } from '@berkelium/agent';
import { SlashCommandHandler } from '../../apps/cli/src/tui/slash-commands.js';
import { ThemeManager } from '@berkelium/themes';

class MockProvider implements Provider {
  public readonly id: string;
  public readonly name: string;
  public mockStreamResponse: string = 'Hello! I am Berkelium Codex. How can I help you with your code today?';
  public mockToolCalls: any[] = [];
  public lastSystemPrompt?: string;
  public lastToolsReceived?: any[];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  capabilities() {
    return {
      streaming: true,
      tool_calling: true,
      vision: false,
      reasoning: true,
      structured_output: true,
      embeddings: false,
      model_discovery: true,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      {
        id: 'berkeliumgpt-coder-3b',
        name: 'BerkeliumGPT Coder 3B',
        provider: this.id,
        context_length: 32768,
        capabilities: this.capabilities(),
      },
      {
        id: 'mock-model',
        name: 'Mock Model',
        provider: this.id,
        context_length: 32768,
        capabilities: this.capabilities(),
      },
    ];
  }

  async *stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk> {
    this.lastSystemPrompt = options.systemPrompt;
    this.lastToolsReceived = options.tools;

    // Simulate streaming the mock text in chunks
    yield {
      type: 'token',
      text: this.mockStreamResponse,
    };

    if (this.mockToolCalls && this.mockToolCalls.length > 0) {
      for (let i = 0; i < this.mockToolCalls.length; i++) {
        const tc = this.mockToolCalls[i];
        yield {
          type: 'tool_call_delta',
          toolCall: {
            index: i,
            id: tc.id || `call_${i}`,
            name: tc.name,
            argumentsDelta: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments),
          },
        };
      }
    }

    yield {
      type: 'usage',
      usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
    };
    yield { type: 'finish', finishReason: 'stop' };
  }

  async generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse> {
    return {
      text: this.mockStreamResponse,
      content: this.mockStreamResponse,
      toolCalls: this.mockToolCalls,
      usage: { promptTokens: 50, completionTokens: 25, totalTokens: 75 },
      finishReason: 'stop',
      model: options.model,
      provider: this.id,
    };
  }
}

describe('Berkelium Codex — Proper Chat Architecture & Acceptance Tests', () => {
  let tmpDir: string;
  let configManager: ConfigManager;
  let logger: Logger;
  let eventBus: EventBus;
  let orchestrator: ToolOrchestrator;
  let contextEngine: ContextEngine;
  let router: ProviderRouter;
  let mockProvider: MockProvider;
  let lmstudioProvider: MockProvider;
  let runtime: AgentRuntime;
  let themeManager: ThemeManager;
  let authStore: AuthStore;
  let slashHandler: SlashCommandHandler;
  let capturedEvents: AgentEvent[] = [];

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-chat-arch-test-'));
    fs.mkdirSync(path.join(tmpDir, '.berkelium'), { recursive: true });
    process.env.BERKELIUM_GLOBAL_CONFIG_DIR = path.join(tmpDir, 'global-config');
    fs.mkdirSync(process.env.BERKELIUM_GLOBAL_CONFIG_DIR, { recursive: true });

    configManager = new ConfigManager(tmpDir);
    logger = new Logger({ level: 'error', destination: 'stdout', pretty: false });
    eventBus = new EventBus();
    capturedEvents = [];
    eventBus.on('*', (e) => capturedEvents.push(e));

    const permissionEngine = new PermissionEngine(tmpDir, configManager.getConfig().permissions, eventBus);
    const secretRedactor = new SecretRedactor();
    const registry = new ToolRegistry();
    orchestrator = new ToolOrchestrator(registry, permissionEngine, secretRedactor, logger, tmpDir, eventBus);
    contextEngine = new ContextEngine(tmpDir, logger as any);
    router = new ProviderRouter(configManager.getConfig(), logger);

    mockProvider = new MockProvider('mock', 'Mock Provider');
    lmstudioProvider = new MockProvider('lmstudio', 'LM Studio');
    router.registerProvider(mockProvider);
    router.registerProvider(lmstudioProvider);

    authStore = new AuthStore();
    themeManager = new ThemeManager();

    runtime = new AgentRuntime({
      workspaceRoot: tmpDir,
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
    });
    runtime.setActiveModel('mock/mock-model');

    slashHandler = new SlashCommandHandler(
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore
    );
  });

  afterEach(() => {
    delete process.env.BERKELIUM_GLOBAL_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // TEST 1 — Greeting
  it('Acceptance Test 1: Greeting "hi" follows IDLE -> THINKING -> RESPONDING -> IDLE with no tools and no verification', async () => {
    mockProvider.mockStreamResponse = "Hello! I'm Berkelium Codex. How can I help you with your code today?";
    mockProvider.mockToolCalls = [];

    await runtime.executeTask('hi');

    // State machine must have transitioned through THINKING and RESPONDING back to IDLE
    const stateEvents = capturedEvents.filter((e) => e.type === 'state_changed') as any[];
    const stateSequence = stateEvents.map((e) => e.newState);

    expect(stateSequence).toContain('THINKING');
    expect(stateSequence).toContain('RESPONDING');
    expect(stateSequence).toContain('IDLE');

    // Must NOT enter PLANNING, EXECUTING, or VERIFYING
    expect(stateSequence).not.toContain('PLANNING');
    expect(stateSequence).not.toContain('EXECUTING');
    expect(stateSequence).not.toContain('VERIFYING');

    // No tool events must be emitted
    const toolEvents = capturedEvents.filter((e) => e.type === 'tool_started' || e.type === 'tool_requested');
    expect(toolEvents.length).toBe(0);

    // No verification events must be emitted
    const verifyEvents = capturedEvents.filter((e) => e.type === 'verification_started');
    expect(verifyEvents.length).toBe(0);

    // No tools were exposed to the provider
    expect(mockProvider.lastToolsReceived).toEqual([]);
  });

  // TEST 2 — Question
  it('Acceptance Test 2: Conceptual Question "What is a Python decorator?" runs without tools or verification', async () => {
    mockProvider.mockStreamResponse = 'A Python decorator is a function that takes another function and extends its behavior without modifying it.';
    mockProvider.mockToolCalls = [];

    await runtime.executeTask('What is a Python decorator?');

    const stateEvents = capturedEvents.filter((e) => e.type === 'state_changed') as any[];
    const stateSequence = stateEvents.map((e) => e.newState);

    expect(stateSequence).toContain('THINKING');
    expect(stateSequence).toContain('RESPONDING');
    expect(stateSequence).toContain('IDLE');
    expect(stateSequence).not.toContain('VERIFYING');

    const verifyEvents = capturedEvents.filter((e) => e.type === 'verification_started');
    expect(verifyEvents.length).toBe(0);
  });

  // TEST 3 — Coding Task
  it('Acceptance Test 3: Actionable Coding Task "Fix the bug in src/auth.ts" enters PLANNING, EXECUTING, and VERIFYING', async () => {
    // Create dummy src/auth.ts
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'auth.ts'), 'export const isAuthenticated = false;');

    mockProvider.mockStreamResponse = 'I will inspect and patch the authentication flow.';
    mockProvider.mockToolCalls = [
      {
        id: 'tc_1',
        name: 'write_file',
        arguments: { path: 'src/auth.ts', content: 'export const isAuthenticated = true;' },
      },
    ];

    // Second turn completes without tools
    const originalStream = mockProvider.stream.bind(mockProvider);
    let callCount = 0;
    mockProvider.stream = async function* (msgs, opts) {
      callCount++;
      if (callCount === 1) {
        yield* originalStream(msgs, opts);
      } else {
        yield { type: 'token', text: 'The authentication bug was fixed in src/auth.ts.' };
        yield { type: 'usage', usage: { promptTokens: 30, completionTokens: 15, totalTokens: 45 } };
        yield { type: 'finish', finishReason: 'stop' };
      }
    };

    await runtime.executeTask('Fix the bug in src/auth.ts');

    const stateEvents = capturedEvents.filter((e) => e.type === 'state_changed') as any[];
    const stateSequence = stateEvents.map((e) => e.newState);

    expect(stateSequence).toContain('THINKING');
    expect(stateSequence).toContain('PLANNING');
    expect(stateSequence).toContain('EXECUTING');
    expect(stateSequence).toContain('VERIFYING');
    expect(stateSequence).toContain('COMPLETED');
  });

  // TEST 4 — Model Switching
  it('Acceptance Test 4: Slash Command /default model sets and persists default model in config', async () => {
    const consoleLogSpy: string[] = [];
    const origLog = console.log;
    console.log = (...args: any[]) => consoleLogSpy.push(args.join(' '));

    try {
      // 1. Check current default
      await slashHandler.handle('/default model');
      expect(consoleLogSpy.some((l) => l.includes('Default model:'))).toBe(true);

      // 2. Set default model
      consoleLogSpy.length = 0;
      await slashHandler.handle('/default model lmstudio/berkeliumgpt-coder-3b');
      expect(consoleLogSpy.some((l) => l.includes('Default model set to lmstudio/berkeliumgpt-coder-3b'))).toBe(true);

      // 3. Verify runtime active model changed
      expect(runtime.getActiveModel()).toBe('lmstudio/berkeliumgpt-coder-3b');

      // 4. Verify persisted in config
      expect(configManager.getDefaultModel()).toBe('lmstudio/berkeliumgpt-coder-3b');

      // 5. Subsequent session uses persisted default
      const newConfigManager = new ConfigManager(tmpDir);
      expect(newConfigManager.getDefaultModel()).toBe('lmstudio/berkeliumgpt-coder-3b');
    } finally {
      console.log = origLog;
    }
  });

  // TEST 5 — Effort
  it('Acceptance Test 5: Slash Command /effort sets, displays, and updates runtime reasoning effort', async () => {
    const consoleLogSpy: string[] = [];
    const origLog = console.log;
    console.log = (...args: any[]) => consoleLogSpy.push(args.join(' '));

    try {
      // 1. View default effort
      await slashHandler.handle('/effort');
      expect(consoleLogSpy.some((l) => l.includes('Effort: medium'))).toBe(true);

      // 2. Set effort to high
      consoleLogSpy.length = 0;
      await slashHandler.handle('/effort high');
      expect(consoleLogSpy.some((l) => l.includes('Effort set to high'))).toBe(true);

      // 3. Verify runtime received effort
      expect(runtime.getEffort()).toBe('high');

      // 4. Verify persisted in config
      expect(configManager.getEffort()).toBe('high');

      // 5. Querying /effort now returns high
      consoleLogSpy.length = 0;
      await slashHandler.handle('/effort');
      expect(consoleLogSpy.some((l) => l.includes('Effort: high'))).toBe(true);
    } finally {
      console.log = origLog;
    }
  });

  // TEST 6 — Reasoning Leakage Sanitization
  it('Acceptance Test 6: Reasoning Leakage (<thought>, <think>, System Prompt, Role reconstruction) is strictly stripped', () => {
    const leakyOutput1 = `<thought>
User says hi.
System Prompt: You are Berkelium Codex.
Role: Berkelium Codex.
Traits: precise, autonomous.
Constraint: do not leak thoughts.
Greeting: Hello! I'm Berkelium Codex.
</thought>
Hello! I'm Berkelium Codex. How can I help you with your code today?`;

    const sanitized1 = sanitizeAssistantResponse(leakyOutput1);
    expect(sanitized1.content).toBe("Hello! I'm Berkelium Codex. How can I help you with your code today?");
    expect(sanitized1.content).not.toContain('<thought>');
    expect(sanitized1.content).not.toContain('System Prompt:');
    expect(sanitized1.content).not.toContain('Role:');
    expect(sanitized1.content).not.toContain('Traits:');
    expect(sanitized1.reasoning).toContain('User says hi.');

    const leakyOutput2 = `<think>
Internal Reasoning: Inspect user request and determine tool.
Tool Selection: None needed.
</think>
Hello! How can I assist you?`;

    const sanitized2 = sanitizeAssistantResponse(leakyOutput2);
    expect(sanitized2.content).toBe('Hello! How can I assist you?');
    expect(sanitized2.content).not.toContain('<think>');
    expect(sanitized2.content).not.toContain('Internal Reasoning:');
  });

  // Stream Sanitizer Live Token Filter
  it('StreamSanitizer suppresses live tokens inside <thought> and passes clean tokens', () => {
    const emittedTokens: string[] = [];
    let reasoningStarted = false;
    let reasoningFinished = false;

    const streamSanitizer = new StreamSanitizer({
      onToken: (t) => emittedTokens.push(t),
      onReasoningStart: () => { reasoningStarted = true; },
      onReasoningEnd: () => { reasoningFinished = true; },
    });

    streamSanitizer.feed('<thought>I will');
    streamSanitizer.feed(' figure out');
    streamSanitizer.feed(' the solution</thought>Hello ');
    streamSanitizer.feed('world!');
    streamSanitizer.flush();

    expect(reasoningStarted).toBe(true);
    expect(reasoningFinished).toBe(true);
    expect(emittedTokens.join('')).toBe('Hello world!');
    expect(emittedTokens.join('')).not.toContain('<thought>');
    expect(emittedTokens.join('')).not.toContain('figure out');
  });
});
