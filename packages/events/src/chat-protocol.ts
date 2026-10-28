/**
 * Berkelium Codex Chat Protocol
 *
 * Implements the official JSON chat protocol specified in schemas/chat.schema.json.
 * Production-grade event schema for the Berkelium Codex agent runtime.
 */

import { randomUUID } from 'crypto';
import type { AgentEvent } from './types.js';

export type ChatEventType =
  | 'message'
  | 'system'
  | 'assistant'
  | 'user'
  | 'tool_call'
  | 'tool_result'
  | 'thinking'
  | 'plan'
  | 'permission_request'
  | 'permission_result'
  | 'verification'
  | 'context_compaction'
  | 'state_change'
  | 'error'
  | 'warning'
  | 'status'
  | 'final';

export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export type ModelMode = 'local' | 'cloud' | 'hybrid' | 'auto';

export type ContentPartType = 'text' | 'image' | 'file' | 'code' | 'diff' | 'citation';

export interface ContentPart {
  type: ContentPartType;
  text?: string | null;
  mime_type?: string | null;
  path?: string | null;
  language?: string | null;
  content?: string | null;
  url?: string | null;
}

export type AgentStateName =
  | 'IDLE'
  | 'THINKING'
  | 'PLANNING'
  | 'WAITING_FOR_PERMISSION'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'REMEDIATING'
  | 'COMPACTING_CONTEXT'
  | 'WAITING_FOR_USER'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface AgentStateDef {
  state: AgentStateName;
  previous_state?: string | null;
  reason?: string | null;
  run_id?: string | null;
  iteration?: number;
}

export interface ToolCallDef {
  call_id: string;
  name: string;
  arguments: Record<string, unknown>;
  working_directory?: string | null;
  timeout_ms?: number | null;
  requires_permission?: boolean;
}

export type ToolResultStatus = 'success' | 'failed' | 'cancelled' | 'timeout' | 'permission_denied';

export interface ToolResultDef {
  call_id: string;
  status: ToolResultStatus;
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: number | null;
  duration_ms?: number | null;
  artifacts?: string[];
}

export type PlanStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface PlanStepDef {
  id: string;
  description: string;
  status: PlanStepStatus;
  verification?: string | null;
}

export interface PlanDef {
  id?: string;
  goal?: string;
  steps: PlanStepDef[];
}

export type VerificationStatus = 'pending' | 'running' | 'passed' | 'failed' | 'partial';

export interface VerificationCheckDef {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  output?: string | null;
  duration_ms?: number | null;
}

export interface VerificationDef {
  status: VerificationStatus;
  checks?: VerificationCheckDef[];
  remediation_required?: boolean;
}

export type PermissionStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type PermissionScope = 'once' | 'session' | 'project' | 'global';

export interface PermissionDef {
  action: string;
  status: PermissionStatus;
  scope?: PermissionScope;
  reason?: string | null;
}

export interface ContextDef {
  tokens_used?: number;
  context_limit?: number;
  usage_percent?: number;
  compaction_required?: boolean;
  compaction_reason?: string | null;
  summary_id?: string | null;
}

export interface ErrorDef {
  code: string;
  message: string;
  recoverable?: boolean;
  details?: Record<string, unknown> | null;
  retryable?: boolean;
}

export interface BerkeliumChatEvent {
  id: string;
  conversation_id: string;
  parent_id?: string | null;
  created_at: string;
  type: ChatEventType;
  role: ChatRole;
  content: string | ContentPart[];
  model?: string | null;
  provider?: string | null;
  model_mode?: ModelMode;
  agent?: AgentStateDef;
  tool?: ToolCallDef | ToolResultDef;
  plan?: PlanDef;
  verification?: VerificationDef;
  permission?: PermissionDef;
  context?: ContextDef;
  error?: ErrorDef;
  metadata?: Record<string, unknown>;
}

const VALID_EVENT_TYPES: Set<ChatEventType> = new Set([
  'message',
  'system',
  'assistant',
  'user',
  'tool_call',
  'tool_result',
  'thinking',
  'plan',
  'permission_request',
  'permission_result',
  'verification',
  'context_compaction',
  'state_change',
  'error',
  'warning',
  'status',
  'final',
]);

const VALID_ROLES: Set<ChatRole> = new Set(['user', 'assistant', 'system', 'tool']);

const VALID_MODEL_MODES: Set<ModelMode> = new Set(['local', 'cloud', 'hybrid', 'auto']);

const VALID_AGENT_STATES: Set<AgentStateName> = new Set([
  'IDLE',
  'THINKING',
  'PLANNING',
  'WAITING_FOR_PERMISSION',
  'EXECUTING',
  'VERIFYING',
  'REMEDIATING',
  'COMPACTING_CONTEXT',
  'WAITING_FOR_USER',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

const VALID_CONTENT_PART_TYPES: Set<ContentPartType> = new Set([
  'text',
  'image',
  'file',
  'code',
  'diff',
  'citation',
]);

const ROOT_ALLOWED_PROPERTIES = new Set([
  'id',
  'conversation_id',
  'parent_id',
  'created_at',
  'type',
  'role',
  'content',
  'model',
  'provider',
  'model_mode',
  'agent',
  'tool',
  'plan',
  'verification',
  'permission',
  'context',
  'error',
  'metadata',
]);

/**
 * Validates any arbitrary object against the Berkelium Codex Chat Protocol JSON schema.
 */
export function validateChatEvent(event: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return { valid: false, errors: ['Chat event must be a non-null object'] };
  }

  const obj = event as Record<string, any>;

  // Additional properties check at root level
  for (const key of Object.keys(obj)) {
    if (!ROOT_ALLOWED_PROPERTIES.has(key)) {
      errors.push(`Disallowed property '${key}' at root (additionalProperties: false)`);
    }
  }

  // Required fields
  if (typeof obj.id !== 'string' || !obj.id.trim()) {
    errors.push('Required field "id" must be a non-empty string');
  }
  if (typeof obj.conversation_id !== 'string' || !obj.conversation_id.trim()) {
    errors.push('Required field "conversation_id" must be a non-empty string');
  }
  if (typeof obj.created_at !== 'string' || isNaN(Date.parse(obj.created_at))) {
    errors.push('Required field "created_at" must be a valid ISO 8601 date-time string');
  }
  if (!VALID_EVENT_TYPES.has(obj.type)) {
    errors.push(`Required field "type" must be one of: ${[...VALID_EVENT_TYPES].join(', ')}`);
  }
  if (!VALID_ROLES.has(obj.role)) {
    errors.push(`Required field "role" must be one of: ${[...VALID_ROLES].join(', ')}`);
  }

  // Content validation
  if (typeof obj.content !== 'string' && !Array.isArray(obj.content)) {
    errors.push('Required field "content" must be a string or an array of content parts');
  } else if (Array.isArray(obj.content)) {
    for (let i = 0; i < obj.content.length; i++) {
      const part = obj.content[i];
      if (!part || typeof part !== 'object' || Array.isArray(part)) {
        errors.push(`content[${i}] must be an object`);
        continue;
      }
      if (!VALID_CONTENT_PART_TYPES.has(part.type)) {
        errors.push(`content[${i}].type must be one of: ${[...VALID_CONTENT_PART_TYPES].join(', ')}`);
      }
      const allowedPartProps = new Set(['type', 'text', 'mime_type', 'path', 'language', 'content', 'url']);
      for (const k of Object.keys(part)) {
        if (!allowedPartProps.has(k)) {
          errors.push(`content[${i}] has disallowed property '${k}'`);
        }
      }
    }
  }

  // Optional fields validation
  if (obj.parent_id !== undefined && obj.parent_id !== null && typeof obj.parent_id !== 'string') {
    errors.push('"parent_id" must be a string or null');
  }
  if (obj.model !== undefined && obj.model !== null && typeof obj.model !== 'string') {
    errors.push('"model" must be a string or null');
  }
  if (obj.provider !== undefined && obj.provider !== null && typeof obj.provider !== 'string') {
    errors.push('"provider" must be a string or null');
  }
  if (obj.model_mode !== undefined && !VALID_MODEL_MODES.has(obj.model_mode)) {
    errors.push(`"model_mode" must be one of: ${[...VALID_MODEL_MODES].join(', ')}`);
  }

  // Agent state validation
  if (obj.agent !== undefined) {
    if (!obj.agent || typeof obj.agent !== 'object') {
      errors.push('"agent" must be an object');
    } else {
      if (!VALID_AGENT_STATES.has(obj.agent.state)) {
        errors.push(`"agent.state" must be one of: ${[...VALID_AGENT_STATES].join(', ')}`);
      }
      const allowedAgentProps = new Set(['state', 'previous_state', 'reason', 'run_id', 'iteration']);
      for (const k of Object.keys(obj.agent)) {
        if (!allowedAgentProps.has(k)) {
          errors.push(`"agent" has disallowed property '${k}'`);
        }
      }
    }
  }

  // Tool validation (toolCall or toolResult)
  if (obj.tool !== undefined) {
    if (!obj.tool || typeof obj.tool !== 'object') {
      errors.push('"tool" must be an object');
    } else {
      const tool = obj.tool;
      const isToolCall = 'name' in tool && 'arguments' in tool;
      const isToolResult = 'status' in tool;

      if (!isToolCall && !isToolResult) {
        errors.push('"tool" must be a valid toolCall or toolResult object');
      } else if (isToolCall) {
        if (typeof tool.call_id !== 'string') errors.push('"tool.call_id" must be a string');
        if (typeof tool.name !== 'string') errors.push('"tool.name" must be a string');
        if (!tool.arguments || typeof tool.arguments !== 'object') errors.push('"tool.arguments" must be an object');
        const allowed = new Set(['call_id', 'name', 'arguments', 'working_directory', 'timeout_ms', 'requires_permission']);
        for (const k of Object.keys(tool)) {
          if (!allowed.has(k)) errors.push(`"tool" (toolCall) has disallowed property '${k}'`);
        }
      } else {
        if (typeof tool.call_id !== 'string') errors.push('"tool.call_id" must be a string');
        const validStatuses = new Set(['success', 'failed', 'cancelled', 'timeout', 'permission_denied']);
        if (!validStatuses.has(tool.status)) {
          errors.push(`"tool.status" must be one of: ${[...validStatuses].join(', ')}`);
        }
        const allowed = new Set(['call_id', 'status', 'stdout', 'stderr', 'exit_code', 'duration_ms', 'artifacts']);
        for (const k of Object.keys(tool)) {
          if (!allowed.has(k)) errors.push(`"tool" (toolResult) has disallowed property '${k}'`);
        }
      }
    }
  }

  // Plan validation
  if (obj.plan !== undefined) {
    if (!obj.plan || typeof obj.plan !== 'object' || !Array.isArray(obj.plan.steps)) {
      errors.push('"plan" must be an object with a "steps" array');
    } else {
      const allowedPlanProps = new Set(['id', 'goal', 'steps']);
      for (const k of Object.keys(obj.plan)) {
        if (!allowedPlanProps.has(k)) errors.push(`"plan" has disallowed property '${k}'`);
      }
      for (let i = 0; i < obj.plan.steps.length; i++) {
        const step = obj.plan.steps[i];
        if (!step || typeof step !== 'object') {
          errors.push(`plan.steps[${i}] must be an object`);
          continue;
        }
        if (typeof step.id !== 'string') errors.push(`plan.steps[${i}].id must be a string`);
        if (typeof step.description !== 'string') errors.push(`plan.steps[${i}].description must be a string`);
        const validStepStatuses = new Set(['pending', 'in_progress', 'completed', 'failed', 'skipped']);
        if (!validStepStatuses.has(step.status)) {
          errors.push(`plan.steps[${i}].status must be one of: ${[...validStepStatuses].join(', ')}`);
        }
        const allowedStepProps = new Set(['id', 'description', 'status', 'verification']);
        for (const k of Object.keys(step)) {
          if (!allowedStepProps.has(k)) errors.push(`plan.steps[${i}] has disallowed property '${k}'`);
        }
      }
    }
  }

  // Verification validation
  if (obj.verification !== undefined) {
    if (!obj.verification || typeof obj.verification !== 'object') {
      errors.push('"verification" must be an object');
    } else {
      const validVerifStatuses = new Set(['pending', 'running', 'passed', 'failed', 'partial']);
      if (!validVerifStatuses.has(obj.verification.status)) {
        errors.push(`"verification.status" must be one of: ${[...validVerifStatuses].join(', ')}`);
      }
      const allowed = new Set(['status', 'checks', 'remediation_required']);
      for (const k of Object.keys(obj.verification)) {
        if (!allowed.has(k)) errors.push(`"verification" has disallowed property '${k}'`);
      }
    }
  }

  // Permission validation
  if (obj.permission !== undefined) {
    if (!obj.permission || typeof obj.permission !== 'object') {
      errors.push('"permission" must be an object');
    } else {
      if (typeof obj.permission.action !== 'string') errors.push('"permission.action" must be a string');
      const validPermStatuses = new Set(['pending', 'approved', 'denied', 'expired']);
      if (!validPermStatuses.has(obj.permission.status)) {
        errors.push(`"permission.status" must be one of: ${[...validPermStatuses].join(', ')}`);
      }
      if (obj.permission.scope !== undefined) {
        const validScopes = new Set(['once', 'session', 'project', 'global']);
        if (!validScopes.has(obj.permission.scope)) {
          errors.push(`"permission.scope" must be one of: ${[...validScopes].join(', ')}`);
        }
      }
      const allowed = new Set(['action', 'status', 'scope', 'reason']);
      for (const k of Object.keys(obj.permission)) {
        if (!allowed.has(k)) errors.push(`"permission" has disallowed property '${k}'`);
      }
    }
  }

  // Context validation
  if (obj.context !== undefined) {
    if (!obj.context || typeof obj.context !== 'object') {
      errors.push('"context" must be an object');
    } else {
      const allowed = new Set([
        'tokens_used',
        'context_limit',
        'usage_percent',
        'compaction_required',
        'compaction_reason',
        'summary_id',
      ]);
      for (const k of Object.keys(obj.context)) {
        if (!allowed.has(k)) errors.push(`"context" has disallowed property '${k}'`);
      }
    }
  }

  // Error validation
  if (obj.error !== undefined) {
    if (!obj.error || typeof obj.error !== 'object') {
      errors.push('"error" must be an object');
    } else {
      if (typeof obj.error.code !== 'string') errors.push('"error.code" must be a string');
      if (typeof obj.error.message !== 'string') errors.push('"error.message" must be a string');
      const allowed = new Set(['code', 'message', 'recoverable', 'details', 'retryable']);
      for (const k of Object.keys(obj.error)) {
        if (!allowed.has(k)) errors.push(`"error" has disallowed property '${k}'`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Creates a valid BerkeliumChatEvent with automatic ID and timestamp.
 */
export function createChatEvent(
  params: Partial<BerkeliumChatEvent> & Pick<BerkeliumChatEvent, 'type' | 'role' | 'content'>
): BerkeliumChatEvent {
  const event: BerkeliumChatEvent = {
    id: params.id || randomUUID(),
    conversation_id: params.conversation_id || 'session-default',
    created_at: params.created_at || new Date().toISOString(),
    type: params.type,
    role: params.role,
    content: params.content,
  };

  if (params.parent_id !== undefined) event.parent_id = params.parent_id;
  if (params.model !== undefined) event.model = params.model;
  if (params.provider !== undefined) event.provider = params.provider;
  if (params.model_mode !== undefined) event.model_mode = params.model_mode;
  if (params.agent !== undefined) event.agent = params.agent;
  if (params.tool !== undefined) event.tool = params.tool;
  if (params.plan !== undefined) event.plan = params.plan;
  if (params.verification !== undefined) event.verification = params.verification;
  if (params.permission !== undefined) event.permission = params.permission;
  if (params.context !== undefined) event.context = params.context;
  if (params.error !== undefined) event.error = params.error;
  if (params.metadata !== undefined) event.metadata = params.metadata;

  return event;
}

function stringifyToolResult(result: unknown): string {
  if (result === null || result === undefined) return '';
  if (typeof result === 'string') return result;
  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
}

const AGENT_STATE_MAP: Record<string, AgentStateName> = {
  IDLE: 'IDLE',
  THINKING: 'THINKING',
  RESPONDING: 'EXECUTING',
  ANALYZING: 'THINKING',
  PLANNING: 'PLANNING',
  WAITING_FOR_MODEL: 'THINKING',
  WAITING_FOR_PERMISSION: 'WAITING_FOR_PERMISSION',
  EXECUTING: 'EXECUTING',
  EXECUTING_TOOL: 'EXECUTING',
  RUNNING_SUBAGENT: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  REMEDIATING: 'REMEDIATING',
  COMPACTING_CONTEXT: 'COMPACTING_CONTEXT',
  STOPPED: 'COMPLETED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ERROR: 'FAILED',
  CANCELLED: 'CANCELLED',
};

function mapAgentState(state: string): AgentStateName {
  return AGENT_STATE_MAP[state] || (VALID_AGENT_STATES.has(state as AgentStateName) ? (state as AgentStateName) : 'IDLE');
}

/**
 * Maps an internal AgentRuntime AgentEvent into a specification-compliant BerkeliumChatEvent.
 */
export function agentEventToChatEvent(
  agentEvent: AgentEvent,
  context?: {
    conversationId?: string;
    model?: string;
    provider?: string;
    modelMode?: ModelMode;
  }
): BerkeliumChatEvent {
  const convId = context?.conversationId || (agentEvent as any).sessionId || 'session-default';
  const isoTime = new Date(agentEvent.timestamp || Date.now()).toISOString();

  const base: Partial<BerkeliumChatEvent> = {
    id: agentEvent.id || randomUUID(),
    conversation_id: convId,
    created_at: isoTime,
    model: context?.model ?? null,
    provider: context?.provider ?? null,
    model_mode: context?.modelMode || 'auto',
  };

  switch (agentEvent.type) {
    case 'token_received':
      return createChatEvent({
        ...base,
        type: 'assistant',
        role: 'assistant',
        content: (agentEvent as any).token || '',
      });

    case 'reasoning_started':
    case 'reasoning_token_received':
      return createChatEvent({
        ...base,
        type: 'thinking',
        role: 'assistant',
        content: (agentEvent as any).token || 'Thinking...',
      });

    case 'reasoning_finished':
      return createChatEvent({
        ...base,
        type: 'thinking',
        role: 'assistant',
        content: (agentEvent as any).fullReasoning || 'Reasoning finished.',
      });

    case 'message_started': {
      const msg = agentEvent as any;
      return createChatEvent({
        ...base,
        type: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'system',
        role: msg.role || 'assistant',
        content: msg.content || '',
      });
    }

    case 'tool_requested':
    case 'tool_started': {
      const t = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'tool_call',
        role: 'assistant',
        content: `Calling tool: ${t.toolName}`,
        tool: {
          call_id: t.callId || randomUUID(),
          name: t.toolName,
          arguments: t.args || {},
          requires_permission: false,
        },
      });
    }

    case 'tool_output':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'tool',
        content: agentEvent.output,
        metadata: {
          tool_call_id: agentEvent.callId,
          tool_name: agentEvent.toolName,
          stream: agentEvent.stream ?? false,
        },
      });

    case 'tool_completed': {
      const output = stringifyToolResult(agentEvent.result);
      return createChatEvent({
        ...base,
        type: 'tool_result',
        role: 'tool',
        content: output,
        tool: {
          call_id: agentEvent.callId,
          status: 'success',
          stdout: output,
          duration_ms: agentEvent.durationMs,
        },
        metadata: {
          tool_name: agentEvent.toolName,
        },
      });
    }

    case 'tool_failed':
      return createChatEvent({
        ...base,
        type: 'tool_result',
        role: 'tool',
        content: agentEvent.error,
        tool: {
          call_id: agentEvent.callId,
          status: 'failed',
          stderr: agentEvent.error,
          duration_ms: agentEvent.durationMs,
        },
        metadata: {
          tool_name: agentEvent.toolName,
          retryable: agentEvent.retryable ?? null,
        },
      });

    case 'permission_requested':
      return createChatEvent({
        ...base,
        type: 'permission_request',
        role: 'system',
        content: `Permission required: ${agentEvent.action} on ${agentEvent.target} (risk: ${agentEvent.risk})`,
        permission: {
          action: agentEvent.action,
          status: 'pending',
        },
        metadata: {
          permission_id: agentEvent.permissionId,
          target: agentEvent.target,
          risk: agentEvent.risk,
          details: agentEvent.details ?? null,
        },
      });

    case 'permission_granted':
      return createChatEvent({
        ...base,
        type: 'permission_result',
        role: 'system',
        content: `Permission approved (${agentEvent.remember ? 'remembered for session' : 'once'}): ${agentEvent.permissionId}`,
        permission: {
          action: 'permission',
          status: 'approved',
          scope: agentEvent.remember ? 'session' : 'once',
        },
        metadata: {
          permission_id: agentEvent.permissionId,
          remember: agentEvent.remember ?? false,
        },
      });

    case 'permission_denied':
      return createChatEvent({
        ...base,
        type: 'permission_result',
        role: 'system',
        content: `Permission denied: ${agentEvent.permissionId}${agentEvent.reason ? ` (${agentEvent.reason})` : ''}`,
        permission: {
          action: 'permission',
          status: 'denied',
          reason: agentEvent.reason ?? null,
        },
        metadata: {
          permission_id: agentEvent.permissionId,
        },
      });

    case 'state_changed':
      return createChatEvent({
        ...base,
        type: 'state_change',
        role: 'system',
        content: agentEvent.description || `State transition: ${agentEvent.previousState} -> ${agentEvent.newState}`,
        agent: {
          state: mapAgentState(agentEvent.newState),
          previous_state: agentEvent.previousState,
          reason: agentEvent.description ?? null,
        },
      });

    case 'context_compacted':
      return createChatEvent({
        ...base,
        type: 'context_compaction',
        role: 'system',
        content: `Context compacted: ${agentEvent.tokensBefore} -> ${agentEvent.tokensAfter} tokens (-${agentEvent.reductionPercentage}%)`,
        context: {
          tokens_used: Math.max(0, Math.round(agentEvent.tokensAfter)),
        },
        metadata: {
          tokens_before: agentEvent.tokensBefore,
          tokens_after: agentEvent.tokensAfter,
          reduction_percentage: agentEvent.reductionPercentage,
        },
      });

    case 'verification_started':
      return createChatEvent({
        ...base,
        type: 'verification',
        role: 'system',
        content: `Verification started: ${agentEvent.checks.join(', ')}`,
        verification: {
          status: 'running',
          checks: agentEvent.checks.map((check) => ({ name: check, status: 'pending' as const })),
        },
      });

    case 'verification_completed': {
      const checks = agentEvent.results.map((result) => ({
        name: result.check,
        status: result.status ?? (result.passed ? 'passed' : 'failed'),
        output: result.message ?? null,
      }));
      const hasSkipped = checks.some((check) => check.status === 'skipped');
      const status: VerificationStatus = agentEvent.passed ? (hasSkipped ? 'partial' : 'passed') : 'failed';
      return createChatEvent({
        ...base,
        type: 'verification',
        role: 'system',
        content: `Verification status: ${status}`,
        verification: {
          status,
          checks,
          remediation_required: !agentEvent.passed,
        },
      });
    }

    case 'task_outcome': {
      const outcome = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'system',
        content: outcome.summary || `Task ${outcome.status}`,
        metadata: {
          task_outcome: outcome.status,
          applied: outcome.applied || [],
          failed: outcome.failed || [],
          denied: outcome.denied || [],
          verified: outcome.verified ?? null,
          checkpointId: outcome.checkpointId,
        },
      });
    }

    case 'session_started':
      return createChatEvent({
        ...base,
        model: agentEvent.model,
        provider: agentEvent.provider,
        type: 'system',
        role: 'system',
        content: `Session started with ${agentEvent.model} (${agentEvent.provider})`,
        metadata: {
          workspace_path: agentEvent.workspacePath,
        },
      });

    case 'model_changed':
      return createChatEvent({
        ...base,
        model: agentEvent.newModel,
        provider: agentEvent.provider,
        type: 'status',
        role: 'system',
        content: `Model changed: ${agentEvent.previousModel} -> ${agentEvent.newModel} (${agentEvent.provider})`,
        metadata: {
          previous_model: agentEvent.previousModel,
          new_model: agentEvent.newModel,
          provider: agentEvent.provider,
        },
      });

    case 'mode_changed':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'system',
        content: `Mode changed: ${agentEvent.previousMode} -> ${agentEvent.newMode}`,
        metadata: {
          previous_mode: agentEvent.previousMode,
          new_mode: agentEvent.newMode,
        },
      });

    case 'provider_changed':
      return createChatEvent({
        ...base,
        provider: agentEvent.newProvider,
        type: 'status',
        role: 'system',
        content: `Provider changed: ${agentEvent.previousProvider} -> ${agentEvent.newProvider}`,
        metadata: {
          previous_provider: agentEvent.previousProvider,
          new_provider: agentEvent.newProvider,
        },
      });

    case 'subagent_started':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'assistant',
        content: `Subagent ${agentEvent.role} started: ${agentEvent.task}`,
        metadata: {
          subagent_id: agentEvent.subagentId,
          role: agentEvent.role,
          task: agentEvent.task,
        },
      });

    case 'subagent_completed':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'assistant',
        content: `Subagent ${agentEvent.role} completed in ${agentEvent.durationMs}ms`,
        metadata: {
          subagent_id: agentEvent.subagentId,
          role: agentEvent.role,
          duration_ms: agentEvent.durationMs,
          result: agentEvent.result,
        },
      });

    case 'mission_started':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'system',
        content: `Mission started: ${agentEvent.goal} (${agentEvent.taskCount} tasks)`,
        metadata: {
          mission_goal: agentEvent.goal,
          task_count: agentEvent.taskCount,
        },
      });

    case 'mission_task_started':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'system',
        content: `Mission task started: ${agentEvent.objective}`,
        metadata: {
          task_id: agentEvent.taskId,
          objective: agentEvent.objective,
        },
      });

    case 'mission_task_completed':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'system',
        content: `Mission task ${agentEvent.taskId} ${agentEvent.status}${agentEvent.result ? `: ${agentEvent.result}` : ''}`,
        metadata: {
          task_id: agentEvent.taskId,
          status: agentEvent.status,
          result: agentEvent.result ?? null,
        },
      });

    case 'mission_completed': {
      const report = agentEvent.report as { summary?: unknown } | null;
      const summary = report && typeof report.summary === 'string' ? report.summary : 'Mission completed';
      return createChatEvent({
        ...base,
        type: 'final',
        role: 'system',
        content: summary,
        metadata: {
          report: agentEvent.report,
        },
      });
    }

    case 'error':
      return createChatEvent({
        ...base,
        type: 'error',
        role: 'system',
        content: agentEvent.message,
        error: {
          code: agentEvent.code || 'RUNTIME_ERROR',
          message: agentEvent.message,
          recoverable: agentEvent.recoverable,
        },
      });

    case 'security_warning':
      return createChatEvent({
        ...base,
        type: 'warning',
        role: 'system',
        content: agentEvent.warning,
        metadata: {
          security_event: agentEvent.type,
          category: agentEvent.category,
          target: agentEvent.target ?? null,
        },
      });

    case 'security_blocked':
      return createChatEvent({
        ...base,
        type: 'warning',
        role: 'system',
        content: agentEvent.reason,
        metadata: {
          security_event: agentEvent.type,
          action: agentEvent.action,
          target: agentEvent.target ?? null,
        },
      });

    case 'secret_detected':
      return createChatEvent({
        ...base,
        type: 'warning',
        role: 'system',
        content: `Detected secret material (${agentEvent.secretTypes.join(', ')}) in ${agentEvent.source}`,
        metadata: {
          security_event: agentEvent.type,
          secret_types: agentEvent.secretTypes,
          source: agentEvent.source,
        },
      });

    case 'path_escape_blocked':
      return createChatEvent({
        ...base,
        type: 'warning',
        role: 'system',
        content: agentEvent.reason,
        metadata: {
          security_event: agentEvent.type,
          attempted_path: agentEvent.attemptedPath,
          workspace_root: agentEvent.workspaceRoot,
        },
      });

    case 'network_request_blocked':
      return createChatEvent({
        ...base,
        type: 'warning',
        role: 'system',
        content: agentEvent.reason,
        metadata: {
          security_event: agentEvent.type,
          url: agentEvent.url,
        },
      });

    case 'unsafe_command_blocked':
      return createChatEvent({
        ...base,
        type: 'warning',
        role: 'system',
        content: agentEvent.reason,
        metadata: {
          security_event: agentEvent.type,
          command: agentEvent.command,
        },
      });

    case 'status_updated':
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'system',
        content: agentEvent.status,
        metadata: {
          step: agentEvent.step ?? null,
          details: agentEvent.details ?? null,
          icon: agentEvent.icon ?? null,
        },
      });

    case 'session_completed':
      return createChatEvent({
        ...base,
        type: 'final',
        role: 'system',
        content: `Session completed in ${(agentEvent.durationMs / 1000).toFixed(1)}s (${agentEvent.toolsExecuted} tool(s) executed, ${agentEvent.totalTokens} tokens)`,
        metadata: {
          duration_ms: agentEvent.durationMs,
          total_tokens: agentEvent.totalTokens,
          total_cost: agentEvent.totalCost ?? null,
          tools_executed: agentEvent.toolsExecuted,
        },
      });

    default: {
      const unhandled = agentEvent as unknown as { type?: string };
      return createChatEvent({
        ...base,
        type: 'message',
        role: 'system',
        content: `Unhandled event: ${unhandled.type ?? 'unknown'}`,
      });
    }
  }
}
