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

    case 'tool_completed': {
      const t = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'tool_result',
        role: 'tool',
        content: t.output || '',
        tool: {
          call_id: t.callId || randomUUID(),
          status: 'success',
          stdout: t.output || null,
          exit_code: 0,
          duration_ms: t.durationMs ?? null,
        },
      });
    }

    case 'tool_failed': {
      const t = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'tool_result',
        role: 'tool',
        content: t.error || 'Tool execution failed',
        tool: {
          call_id: t.callId || randomUUID(),
          status: 'failed',
          stderr: t.error || null,
          exit_code: 1,
        },
      });
    }

    case 'permission_requested': {
      const p = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'permission_request',
        role: 'system',
        content: `Permission required for action: ${p.operation || p.toolName}`,
        permission: {
          action: p.operation || p.toolName || 'execute',
          status: 'pending',
          reason: p.reason || null,
        },
      });
    }

    case 'permission_granted': {
      const p = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'permission_result',
        role: 'system',
        content: `Permission approved for ${p.operation || p.toolName}`,
        permission: {
          action: p.operation || p.toolName || 'execute',
          status: 'approved',
          scope: 'session',
        },
      });
    }

    case 'permission_denied': {
      const p = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'permission_result',
        role: 'system',
        content: `Permission denied for ${p.operation || p.toolName}`,
        permission: {
          action: p.operation || p.toolName || 'execute',
          status: 'denied',
          reason: p.reason || null,
        },
      });
    }

    case 'state_changed': {
      const s = agentEvent as any;
      const stateMap: Record<string, AgentStateName> = {
        IDLE: 'IDLE',
        ANALYZING: 'THINKING',
        PLANNING: 'PLANNING',
        WAITING_FOR_PERMISSION: 'WAITING_FOR_PERMISSION',
        EXECUTING_TOOL: 'EXECUTING',
        VERIFYING: 'VERIFYING',
        COMPACTING_CONTEXT: 'COMPACTING_CONTEXT',
        STOPPED: 'COMPLETED',
        ERROR: 'FAILED',
      };
      const mappedState: AgentStateName = stateMap[s.to] || 'EXECUTING';
      return createChatEvent({
        ...base,
        type: 'state_change',
        role: 'system',
        content: `State transition: ${s.from} -> ${s.to}`,
        agent: {
          state: mappedState,
          previous_state: s.from,
          reason: s.reason || null,
        },
      });
    }

    case 'context_compacted': {
      const c = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'context_compaction',
        role: 'system',
        content: `Context compacted: ${c.previousTokens || 0} -> ${c.newTokens || 0} tokens`,
        context: {
          tokens_used: c.newTokens,
          compaction_required: true,
          compaction_reason: c.reason || 'Context threshold exceeded',
        },
      });
    }

    case 'verification_started':
    case 'verification_completed': {
      const v = agentEvent as any;
      const status: VerificationStatus = agentEvent.type === 'verification_started'
        ? 'running'
        : v.passed
        ? 'passed'
        : 'failed';
      return createChatEvent({
        ...base,
        type: 'verification',
        role: 'system',
        content: `Verification status: ${status}`,
        verification: {
          status,
          remediation_required: !v.passed,
        },
      });
    }

    case 'error': {
      const err = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'error',
        role: 'system',
        content: err.message || 'An unexpected error occurred',
        error: {
          code: err.code || 'RUNTIME_ERROR',
          message: err.message || 'An unexpected error occurred',
          recoverable: true,
          retryable: true,
        },
      });
    }

    case 'security_warning':
    case 'security_blocked':
    case 'secret_detected':
    case 'unsafe_command_blocked': {
      const sec = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'warning',
        role: 'system',
        content: sec.reason || sec.message || `Security notice: ${agentEvent.type}`,
        metadata: {
          security_event: agentEvent.type,
          details: sec,
        },
      });
    }

    case 'status_updated': {
      const st = agentEvent as any;
      return createChatEvent({
        ...base,
        type: 'status',
        role: 'system',
        content: st.status || 'Status update',
      });
    }

    case 'session_completed': {
      return createChatEvent({
        ...base,
        type: 'final',
        role: 'system',
        content: 'Session execution completed successfully.',
      });
    }

    default:
      return createChatEvent({
        ...base,
        type: 'message',
        role: 'system',
        content: `Event: ${agentEvent.type}`,
      });
  }
}
