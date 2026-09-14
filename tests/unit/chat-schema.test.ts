import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  validateChatEvent,
  createChatEvent,
  agentEventToChatEvent,
  BerkeliumChatEvent,
  AgentEvent,
} from '@berkelium/events';

describe('Berkelium Codex Chat Protocol & JSON Schema', () => {
  const rootSchemaPath = path.resolve(__dirname, '../../schemas/chat.schema.json');
  const pkgSchemaPath = path.resolve(__dirname, '../../packages/events/schemas/chat.schema.json');

  it('should have valid chat.schema.json files with correct identifiers', () => {
    expect(fs.existsSync(rootSchemaPath)).toBe(true);
    expect(fs.existsSync(pkgSchemaPath)).toBe(true);

    const rootSchema = JSON.parse(fs.readFileSync(rootSchemaPath, 'utf-8'));
    const pkgSchema = JSON.parse(fs.readFileSync(pkgSchemaPath, 'utf-8'));

    expect(rootSchema.$id).toBe('https://berkelium.ai/schemas/chat.schema.json');
    expect(rootSchema.title).toBe('Berkelium Codex Chat Protocol');
    expect(rootSchema.required).toEqual(['id', 'conversation_id', 'created_at', 'type', 'role', 'content']);
    expect(pkgSchema).toEqual(rootSchema);
  });

  it('should validate a simple user message', () => {
    const event: BerkeliumChatEvent = {
      id: 'msg_001',
      conversation_id: 'conv_123',
      created_at: new Date().toISOString(),
      type: 'user',
      role: 'user',
      content: 'Hello Berkelium, optimize this function.',
    };

    const result = validateChatEvent(event);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate an assistant message with structured content parts', () => {
    const event: BerkeliumChatEvent = {
      id: 'msg_002',
      conversation_id: 'conv_123',
      created_at: new Date().toISOString(),
      type: 'assistant',
      role: 'assistant',
      content: [
        { type: 'text', text: 'Here is the diff for your review:' },
        { type: 'diff', content: '+ const x = 1;\n- const x = 0;', language: 'typescript' },
      ],
      model: 'gemini-2.5-pro',
      provider: 'google',
      model_mode: 'cloud',
    };

    const result = validateChatEvent(event);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a tool call event', () => {
    const event: BerkeliumChatEvent = {
      id: 'evt_003',
      conversation_id: 'conv_123',
      created_at: new Date().toISOString(),
      type: 'tool_call',
      role: 'assistant',
      content: 'Calling tool read_file',
      tool: {
        call_id: 'call_abc',
        name: 'read_file',
        arguments: { path: 'src/main.ts' },
        requires_permission: false,
      },
    };

    const result = validateChatEvent(event);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a tool result event', () => {
    const event: BerkeliumChatEvent = {
      id: 'evt_004',
      conversation_id: 'conv_123',
      created_at: new Date().toISOString(),
      type: 'tool_result',
      role: 'tool',
      content: 'export const main = () => {};',
      tool: {
        call_id: 'call_abc',
        status: 'success',
        stdout: 'export const main = () => {};',
        exit_code: 0,
        duration_ms: 45,
      },
    };

    const result = validateChatEvent(event);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate an agent state change event', () => {
    const event: BerkeliumChatEvent = {
      id: 'evt_005',
      conversation_id: 'conv_123',
      created_at: new Date().toISOString(),
      type: 'state_change',
      role: 'system',
      content: 'Agent state transition',
      agent: {
        state: 'THINKING',
        previous_state: 'IDLE',
        reason: 'Analyzing code architecture',
        iteration: 1,
      },
    };

    const result = validateChatEvent(event);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate plan, verification, permission, context, and error payloads', () => {
    const fullEvent: BerkeliumChatEvent = {
      id: 'evt_full',
      conversation_id: 'conv_123',
      created_at: new Date().toISOString(),
      type: 'plan',
      role: 'assistant',
      content: 'Architectural refinement plan',
      plan: {
        goal: 'Refactor auth adapter',
        steps: [
          { id: 's1', description: 'Audit tokens', status: 'completed' },
          { id: 's2', description: 'Add unit tests', status: 'in_progress' },
        ],
      },
      verification: {
        status: 'running',
        remediation_required: false,
      },
      permission: {
        action: 'write_file',
        status: 'approved',
        scope: 'session',
      },
      context: {
        tokens_used: 1250,
        context_limit: 128000,
        usage_percent: 0.97,
        compaction_required: false,
      },
      error: {
        code: 'TEST_ERR',
        message: 'Non-fatal verification warning',
        recoverable: true,
        retryable: false,
      },
    };

    const result = validateChatEvent(fullEvent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject events missing required fields', () => {
    const invalid = {
      id: 'missing_fields',
      type: 'user',
    };

    const result = validateChatEvent(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject disallowed properties under additionalProperties: false', () => {
    const invalid = {
      id: 'unknown_prop',
      conversation_id: 'c1',
      created_at: new Date().toISOString(),
      type: 'user',
      role: 'user',
      content: 'hi',
      unsupported_field_xyz: true,
    };

    const result = validateChatEvent(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Disallowed property'))).toBe(true);
  });

  it('should reject invalid enum values', () => {
    const invalidRole = {
      id: 'inv_role',
      conversation_id: 'c1',
      created_at: new Date().toISOString(),
      type: 'user',
      role: 'superadmin' as any,
      content: 'hi',
    };

    const result = validateChatEvent(invalidRole);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('role'))).toBe(true);
  });

  it('should convert internal AgentEvent instances to valid BerkeliumChatEvent objects', () => {
    const testEvents: AgentEvent[] = [
      {
        id: 'ae_1',
        type: 'token_received',
        token: 'const result = 42;',
        timestamp: Date.now(),
        sessionId: 'session_conv_1',
      },
      {
        id: 'ae_2',
        type: 'reasoning_started',
        timestamp: Date.now(),
        sessionId: 'session_conv_1',
      },
      {
        id: 'ae_3',
        type: 'tool_requested',
        callId: 'call_99',
        toolName: 'shell_execute',
        args: { command: 'git status' },
        timestamp: Date.now(),
        sessionId: 'session_conv_1',
      },
      {
        id: 'ae_4',
        type: 'tool_completed',
        callId: 'call_99',
        toolName: 'shell_execute',
        output: 'On branch main',
        durationMs: 12,
        timestamp: Date.now(),
        sessionId: 'session_conv_1',
      },
      {
        id: 'ae_5',
        type: 'state_changed',
        from: 'IDLE',
        to: 'ANALYZING',
        timestamp: Date.now(),
        sessionId: 'session_conv_1',
      },
      {
        id: 'ae_6',
        type: 'error',
        code: 'NETWORK_TIMEOUT',
        message: 'Endpoint timed out',
        timestamp: Date.now(),
        sessionId: 'session_conv_1',
      },
    ];

    for (const ae of testEvents) {
      const chatEvent = agentEventToChatEvent(ae, {
        conversationId: 'session_conv_1',
        model: 'berkelium-coder:3b',
        provider: 'mlx',
      });

      const validation = validateChatEvent(chatEvent);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(chatEvent.conversation_id).toBe('session_conv_1');
    }
  });
});
