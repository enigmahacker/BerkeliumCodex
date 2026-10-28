import { describe, it, expect } from 'vitest';
import {
  AgentEvent,
  agentEventToChatEvent,
  validateChatEvent,
  BerkeliumChatEvent,
} from '@berkelium/events';

const sessionId = 'conv_contracts';
const context = { conversationId: sessionId, model: 'test-model', provider: 'test-provider' };

function base(id: string) {
  return { id, timestamp: Date.now(), sessionId };
}

function map(event: AgentEvent): BerkeliumChatEvent {
  return agentEventToChatEvent(event, context);
}

const events: AgentEvent[] = [
  { ...base('e01'), type: 'session_started', model: 'test-model', provider: 'test-provider', workspacePath: '/tmp/workspace' },
  { ...base('e02'), type: 'message_started', role: 'assistant', content: 'Hello' },
  { ...base('e03'), type: 'token_received', token: 'const x = 1;' },
  { ...base('e04'), type: 'reasoning_started' },
  { ...base('e05'), type: 'reasoning_token_received', token: 'considering' },
  { ...base('e06'), type: 'reasoning_finished', fullReasoning: 'done thinking' },
  { ...base('e07'), type: 'tool_requested', callId: 'c1', toolName: 'read_file', args: { path: 'a.ts' } },
  { ...base('e08'), type: 'tool_started', callId: 'c1', toolName: 'read_file', args: { path: 'a.ts' } },
  { ...base('e09'), type: 'tool_output', callId: 'c1', toolName: 'run_shell', output: 'working', stream: true },
  { ...base('e10'), type: 'tool_completed', callId: 'c1', toolName: 'read_file', result: 'file contents', durationMs: 7 },
  { ...base('e11'), type: 'tool_failed', callId: 'c2', toolName: 'write_file', error: 'disk full', durationMs: 3, retryable: true },
  { ...base('e12'), type: 'permission_requested', permissionId: 'p1', action: 'write_file', target: 'src/a.ts', risk: 'high', details: { reason: 'mutation' } },
  { ...base('e13'), type: 'permission_granted', permissionId: 'p1', remember: true },
  { ...base('e14'), type: 'permission_denied', permissionId: 'p2', reason: 'user denied' },
  { ...base('e15'), type: 'security_warning', warning: 'Suspicious command', category: 'shell', target: 'rm -rf /' },
  { ...base('e16'), type: 'security_blocked', reason: 'Blocked command', action: 'run_shell', target: 'sudo rm' },
  { ...base('e17'), type: 'secret_detected', secretTypes: ['api_key'], source: 'tool_output' },
  { ...base('e18'), type: 'path_escape_blocked', attemptedPath: '../outside', workspaceRoot: '/tmp/workspace', reason: 'Path escapes workspace' },
  { ...base('e19'), type: 'network_request_blocked', url: 'http://localhost:9999', reason: 'Private endpoint' },
  { ...base('e20'), type: 'unsafe_command_blocked', command: 'rm -rf /', reason: 'Destructive command' },
  { ...base('e21'), type: 'model_changed', previousModel: 'old-model', newModel: 'new-model', provider: 'test-provider' },
  { ...base('e22'), type: 'mode_changed', previousMode: 'build', newMode: 'plan' },
  { ...base('e23'), type: 'provider_changed', previousProvider: 'old-provider', newProvider: 'new-provider' },
  { ...base('e24'), type: 'context_compacted', tokensBefore: 1000, tokensAfter: 400, reductionPercentage: 60 },
  { ...base('e25'), type: 'subagent_started', subagentId: 'sa1', role: 'reviewer', task: 'Review diff' },
  { ...base('e26'), type: 'subagent_completed', subagentId: 'sa1', role: 'reviewer', result: 'looks good', durationMs: 90 },
  { ...base('e27'), type: 'verification_started', checks: ['tests', 'diagnostics'] },
  {
    ...base('e28'),
    type: 'verification_completed',
    passed: true,
    results: [
      { check: 'tests', passed: true, status: 'passed' },
      { check: 'diagnostics', passed: true, status: 'skipped', message: 'No diagnostics configured' },
    ],
  },
  { ...base('e29'), type: 'task_outcome', status: 'completed', applied: ['write_file(a.ts)'], failed: [], denied: [], verified: true, checkpointId: 'cp_1', summary: 'done' },
  { ...base('e30'), type: 'mission_started', goal: 'Refactor', taskCount: 2 },
  { ...base('e31'), type: 'mission_task_started', taskId: 't1', objective: 'Inspect' },
  { ...base('e32'), type: 'mission_task_completed', taskId: 't1', status: 'completed', result: 'inspected' },
  { ...base('e33'), type: 'mission_completed', report: { summary: 'Mission complete' } },
  { ...base('e34'), type: 'state_changed', previousState: 'IDLE', newState: 'RESPONDING', description: 'Streaming answer' },
  { ...base('e35'), type: 'status_updated', status: 'Working', step: 'step-1', details: 'detail', icon: '>' },
  { ...base('e36'), type: 'error', message: 'boom', code: 'E_BOOM', recoverable: false },
  { ...base('e37'), type: 'session_completed', durationMs: 1500, totalTokens: 42, totalCost: 0.01, toolsExecuted: 2 },
];

describe('AgentEvent to BerkeliumChatEvent contracts', () => {
  it('maps every AgentEvent variant to a schema-valid chat event', () => {
    expect(events).toHaveLength(37);

    for (const event of events) {
      const chatEvent = map(event);
      const validation = validateChatEvent(chatEvent);
      expect(validation.errors, `${event.type}: ${validation.errors.join('; ')}`).toHaveLength(0);
      expect(validation.valid, event.type).toBe(true);
      expect(chatEvent.conversation_id).toBe(sessionId);
      expect(chatEvent.id).toBe(event.id);
      expect(chatEvent.created_at).toBe(new Date(event.timestamp).toISOString());
    }
  });

  it('preserves tool results instead of fabricating success payloads', () => {
    const completed = map(events[9]);
    expect(completed.type).toBe('tool_result');
    expect(completed.content).toBe('file contents');
    expect(completed.tool).toMatchObject({ call_id: 'c1', status: 'success', stdout: 'file contents', duration_ms: 7 });
    expect(completed.metadata).toMatchObject({ tool_name: 'read_file' });

    const failed = map(events[10]);
    expect(failed.type).toBe('tool_result');
    expect(failed.content).toBe('disk full');
    expect(failed.tool).toMatchObject({ call_id: 'c2', status: 'failed', stderr: 'disk full', duration_ms: 3 });
    expect(failed.metadata).toMatchObject({ tool_name: 'write_file', retryable: true });
  });

  it('represents partial tool output as a stream status, not a completed result', () => {
    const output = map(events[8]);
    expect(output.type).toBe('status');
    expect(output.role).toBe('tool');
    expect(output.content).toBe('working');
    expect(output.tool).toBeUndefined();
    expect(output.metadata).toMatchObject({ tool_call_id: 'c1', tool_name: 'run_shell', stream: true });
  });

  it('maps permission events using their real action, target, and reason fields', () => {
    const requested = map(events[11]);
    expect(requested.type).toBe('permission_request');
    expect(requested.content).toContain('write_file');
    expect(requested.content).toContain('src/a.ts');
    expect(requested.permission).toMatchObject({ action: 'write_file', status: 'pending' });
    expect(requested.metadata).toMatchObject({ permission_id: 'p1', target: 'src/a.ts', risk: 'high' });

    const granted = map(events[12]);
    expect(granted.type).toBe('permission_result');
    expect(granted.permission).toMatchObject({ status: 'approved', scope: 'session' });

    const denied = map(events[13]);
    expect(denied.type).toBe('permission_result');
    expect(denied.permission).toMatchObject({ status: 'denied', reason: 'user denied' });
    expect(denied.metadata).toMatchObject({ permission_id: 'p2' });
  });

  it('maps state changes from previousState/newState and translates runtime-only states', () => {
    const transitional = map(events[33]);
    expect(transitional.type).toBe('state_change');
    expect(transitional.content).toBe('Streaming answer');
    expect(transitional.agent).toMatchObject({ state: 'EXECUTING', previous_state: 'IDLE', reason: 'Streaming answer' });

    const unknown = map({
      ...base('unknown_state'),
      type: 'state_changed',
      previousState: 'IDLE',
      newState: 'SOMETHING_NEW',
    });
    expect(unknown.agent?.state).toBe('IDLE');
    expect(validateChatEvent(unknown).valid).toBe(true);
  });

  it('reports context compaction with actual token counts and reduction', () => {
    const compacted = map(events[23]);
    expect(compacted.type).toBe('context_compaction');
    expect(compacted.content).toContain('1000 -> 400');
    expect(compacted.context).toMatchObject({ tokens_used: 400 });
    expect(compacted.metadata).toMatchObject({ tokens_before: 1000, tokens_after: 400, reduction_percentage: 60 });
  });

  it('carries verification checks and marks skipped checks as partial', () => {
    const started = map(events[26]);
    expect(started.verification?.status).toBe('running');
    expect(started.verification?.checks).toEqual([
      { name: 'tests', status: 'pending' },
      { name: 'diagnostics', status: 'pending' },
    ]);

    const completed = map(events[27]);
    expect(completed.verification?.status).toBe('partial');
    expect(completed.verification?.remediation_required).toBe(false);
    expect(completed.verification?.checks).toEqual([
      { name: 'tests', status: 'passed', output: null },
      { name: 'diagnostics', status: 'skipped', output: 'No diagnostics configured' },
    ]);
  });

  it('keeps error recoverability truthful and model changes attributable', () => {
    const failure = map(events[35]);
    expect(failure.type).toBe('error');
    expect(failure.error).toMatchObject({ code: 'E_BOOM', message: 'boom', recoverable: false });

    const session = map(events[0]);
    expect(session.model).toBe('test-model');
    expect(session.provider).toBe('test-provider');

    const changed = map(events[20]);
    expect(changed.model).toBe('new-model');
    expect(changed.content).toContain('old-model -> new-model');
  });

  it('surfaces security blocks and paths without collapsing them into generic messages', () => {
    for (const index of [14, 15, 16, 17, 18, 19]) {
      const warning = map(events[index]);
      expect(warning.type).toBe('warning');
      expect(warning.content.length).toBeGreaterThan(0);
    }
    expect(map(events[17]).metadata).toMatchObject({ attempted_path: '../outside' });
    expect(map(events[18]).metadata).toMatchObject({ url: 'http://localhost:9999' });
  });

  it('does not claim a session succeeded and reports mission summaries', () => {
    const session = map(events[36]);
    expect(session.type).toBe('final');
    expect(session.content).not.toContain('successfully');
    expect(session.content).toContain('1.5s');

    const mission = map(events[32]);
    expect(mission.type).toBe('final');
    expect(mission.content).toBe('Mission complete');
  });
});
