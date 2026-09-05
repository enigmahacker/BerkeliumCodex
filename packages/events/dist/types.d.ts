export type AgentEventType = 'session_started' | 'message_started' | 'token_received' | 'reasoning_started' | 'reasoning_token_received' | 'reasoning_finished' | 'tool_requested' | 'tool_started' | 'tool_output' | 'tool_completed' | 'tool_failed' | 'permission_requested' | 'permission_granted' | 'permission_denied' | 'security_warning' | 'security_blocked' | 'secret_detected' | 'path_escape_blocked' | 'network_request_blocked' | 'unsafe_command_blocked' | 'model_changed' | 'provider_changed' | 'context_compacted' | 'subagent_started' | 'subagent_completed' | 'verification_started' | 'verification_completed' | 'state_changed' | 'status_updated' | 'error' | 'session_completed';
export interface BaseAgentEvent {
    id: string;
    type: AgentEventType;
    timestamp: number;
    sessionId: string;
}
export interface SessionStartedEvent extends BaseAgentEvent {
    type: 'session_started';
    sessionId: string;
    model: string;
    provider: string;
    workspacePath: string;
}
export interface MessageStartedEvent extends BaseAgentEvent {
    type: 'message_started';
    role: 'user' | 'assistant' | 'system';
    content?: string;
}
export interface TokenReceivedEvent extends BaseAgentEvent {
    type: 'token_received';
    token: string;
}
export interface ReasoningStartedEvent extends BaseAgentEvent {
    type: 'reasoning_started';
}
export interface ReasoningTokenReceivedEvent extends BaseAgentEvent {
    type: 'reasoning_token_received';
    token: string;
}
export interface ReasoningFinishedEvent extends BaseAgentEvent {
    type: 'reasoning_finished';
    fullReasoning?: string;
}
export interface ToolRequestedEvent extends BaseAgentEvent {
    type: 'tool_requested';
    callId: string;
    toolName: string;
    args: Record<string, unknown>;
}
export interface ToolStartedEvent extends BaseAgentEvent {
    type: 'tool_started';
    callId: string;
    toolName: string;
    args: Record<string, unknown>;
}
export interface ToolOutputEvent extends BaseAgentEvent {
    type: 'tool_output';
    callId: string;
    toolName: string;
    output: string;
    stream?: boolean;
}
export interface ToolCompletedEvent extends BaseAgentEvent {
    type: 'tool_completed';
    callId: string;
    toolName: string;
    result: unknown;
    durationMs: number;
}
export interface ToolFailedEvent extends BaseAgentEvent {
    type: 'tool_failed';
    callId: string;
    toolName: string;
    error: string;
    durationMs: number;
    retryable?: boolean;
}
export interface PermissionRequestedEvent extends BaseAgentEvent {
    type: 'permission_requested';
    permissionId: string;
    action: string;
    target: string;
    risk: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, unknown>;
}
export interface PermissionGrantedEvent extends BaseAgentEvent {
    type: 'permission_granted';
    permissionId: string;
    remember?: boolean;
}
export interface PermissionDeniedEvent extends BaseAgentEvent {
    type: 'permission_denied';
    permissionId: string;
    reason?: string;
}
export interface SecurityWarningEvent extends BaseAgentEvent {
    type: 'security_warning';
    warning: string;
    category: string;
    target?: string;
}
export interface SecurityBlockedEvent extends BaseAgentEvent {
    type: 'security_blocked';
    reason: string;
    action: string;
    target?: string;
}
export interface SecretDetectedEvent extends BaseAgentEvent {
    type: 'secret_detected';
    secretTypes: string[];
    source: string;
}
export interface PathEscapeBlockedEvent extends BaseAgentEvent {
    type: 'path_escape_blocked';
    attemptedPath: string;
    workspaceRoot: string;
    reason: string;
}
export interface NetworkRequestBlockedEvent extends BaseAgentEvent {
    type: 'network_request_blocked';
    url: string;
    reason: string;
}
export interface UnsafeCommandBlockedEvent extends BaseAgentEvent {
    type: 'unsafe_command_blocked';
    command: string;
    reason: string;
}
export interface ModelChangedEvent extends BaseAgentEvent {
    type: 'model_changed';
    previousModel: string;
    newModel: string;
    provider: string;
}
export interface ProviderChangedEvent extends BaseAgentEvent {
    type: 'provider_changed';
    previousProvider: string;
    newProvider: string;
}
export interface ContextCompactedEvent extends BaseAgentEvent {
    type: 'context_compacted';
    tokensBefore: number;
    tokensAfter: number;
    reductionPercentage: number;
}
export interface SubagentStartedEvent extends BaseAgentEvent {
    type: 'subagent_started';
    subagentId: string;
    role: string;
    task: string;
}
export interface SubagentCompletedEvent extends BaseAgentEvent {
    type: 'subagent_completed';
    subagentId: string;
    role: string;
    result: unknown;
    durationMs: number;
}
export interface VerificationStartedEvent extends BaseAgentEvent {
    type: 'verification_started';
    checks: string[];
}
export interface VerificationCompletedEvent extends BaseAgentEvent {
    type: 'verification_completed';
    passed: boolean;
    results: Array<{
        check: string;
        passed: boolean;
        message?: string;
    }>;
}
export interface StateChangedEvent extends BaseAgentEvent {
    type: 'state_changed';
    previousState: string;
    newState: string;
    description?: string;
}
export interface StatusUpdatedEvent extends BaseAgentEvent {
    type: 'status_updated';
    status: string;
    step?: string;
    details?: string;
    icon?: string;
}
export interface ErrorEvent extends BaseAgentEvent {
    type: 'error';
    message: string;
    code?: string;
    recoverable: boolean;
    stack?: string;
}
export interface SessionCompletedEvent extends BaseAgentEvent {
    type: 'session_completed';
    durationMs: number;
    totalTokens: number;
    totalCost?: number;
    toolsExecuted: number;
}
export type AgentEvent = SessionStartedEvent | MessageStartedEvent | TokenReceivedEvent | ReasoningStartedEvent | ReasoningTokenReceivedEvent | ReasoningFinishedEvent | ToolRequestedEvent | ToolStartedEvent | ToolOutputEvent | ToolCompletedEvent | ToolFailedEvent | PermissionRequestedEvent | PermissionGrantedEvent | PermissionDeniedEvent | SecurityWarningEvent | SecurityBlockedEvent | SecretDetectedEvent | PathEscapeBlockedEvent | NetworkRequestBlockedEvent | UnsafeCommandBlockedEvent | ModelChangedEvent | ProviderChangedEvent | ContextCompactedEvent | SubagentStartedEvent | SubagentCompletedEvent | VerificationStartedEvent | VerificationCompletedEvent | StateChangedEvent | StatusUpdatedEvent | ErrorEvent | SessionCompletedEvent;
export type EventHandler<T extends AgentEvent = AgentEvent> = (event: T) => void | Promise<void>;
//# sourceMappingURL=types.d.ts.map