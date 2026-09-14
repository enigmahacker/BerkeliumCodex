import { EventBus } from '@berkelium/events';

export type AgentState =
  | 'IDLE'
  | 'THINKING'
  | 'PLANNING'
  | 'WAITING_FOR_MODEL'
  | 'WAITING_FOR_PERMISSION'
  | 'EXECUTING_TOOL'
  | 'COMPACTING_CONTEXT'
  | 'RUNNING_SUBAGENT'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface StateTransitionRecord {
  from: AgentState;
  to: AgentState;
  timestamp: number;
  description?: string;
  durationMs: number;
}

export class InvalidStateTransitionError extends Error {
  public readonly fromState: AgentState;
  public readonly toState: AgentState;

  constructor(fromState: AgentState, toState: AgentState, message?: string) {
    super(message || `Invalid state transition: Cannot transition from ${fromState} to ${toState}`);
    this.name = 'InvalidStateTransitionError';
    this.fromState = fromState;
    this.toState = toState;
  }
}

/**
 * Deterministic finite state transition table for Berkelium Agent Runtime.
 * Defines all mathematically valid transitions in the autonomous engineering loop.
 */
export const VALID_TRANSITIONS: Record<AgentState, AgentState[]> = {
  IDLE: ['THINKING', 'PLANNING', 'CANCELLED'],
  THINKING: [
    'PLANNING',
    'COMPACTING_CONTEXT',
    'WAITING_FOR_MODEL',
    'RUNNING_SUBAGENT',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  PLANNING: [
    'WAITING_FOR_MODEL',
    'COMPACTING_CONTEXT',
    'EXECUTING_TOOL',
    'RUNNING_SUBAGENT',
    'WAITING_FOR_PERMISSION',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  WAITING_FOR_MODEL: [
    'EXECUTING_TOOL',
    'WAITING_FOR_PERMISSION',
    'VERIFYING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  WAITING_FOR_PERMISSION: [
    'EXECUTING_TOOL',
    'WAITING_FOR_MODEL',
    'CANCELLED',
    'FAILED',
    'IDLE',
  ],
  EXECUTING_TOOL: [
    'WAITING_FOR_MODEL',
    'EXECUTING_TOOL',
    'VERIFYING',
    'COMPACTING_CONTEXT',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  COMPACTING_CONTEXT: [
    'WAITING_FOR_MODEL',
    'PLANNING',
    'THINKING',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  RUNNING_SUBAGENT: [
    'THINKING',
    'PLANNING',
    'WAITING_FOR_MODEL',
    'VERIFYING',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  VERIFYING: [
    'COMPLETED',
    'WAITING_FOR_MODEL',
    'PLANNING',
    'EXECUTING_TOOL',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  COMPLETED: ['IDLE', 'THINKING', 'PLANNING'],
  FAILED: ['IDLE', 'THINKING', 'PLANNING'],
  CANCELLED: ['IDLE', 'THINKING', 'PLANNING'],
};

export class AgentStateMachine {
  private currentState: AgentState = 'IDLE';
  private stateEnteredAt: number = Date.now();
  private history: StateTransitionRecord[] = [];
  private eventBus?: EventBus;
  private sessionId: string;

  constructor(sessionId: string, eventBus?: EventBus, initialState: AgentState = 'IDLE') {
    this.sessionId = sessionId;
    this.eventBus = eventBus;
    this.currentState = initialState;
    this.stateEnteredAt = Date.now();
  }

  public getState(): AgentState {
    return this.currentState;
  }

  public getHistory(): StateTransitionRecord[] {
    return [...this.history];
  }

  public canTransition(newState: AgentState): boolean {
    if (this.currentState === newState) return true;
    const allowed = VALID_TRANSITIONS[this.currentState] || [];
    return allowed.includes(newState);
  }

  public transition(newState: AgentState, description?: string): void {
    if (this.currentState === newState) return;

    if (!this.canTransition(newState)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        newState,
        `Deterministic transition rejection: "${this.currentState}" → "${newState}" is not a permitted edge in the agent transition graph.`
      );
    }

    const previousState = this.currentState;
    const now = Date.now();
    const durationMs = now - this.stateEnteredAt;

    const record: StateTransitionRecord = {
      from: previousState,
      to: newState,
      timestamp: now,
      description,
      durationMs,
    };

    this.history.push(record);
    this.currentState = newState;
    this.stateEnteredAt = now;

    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'state_changed',
      sessionId: this.sessionId,
      timestamp: now,
      previousState,
      newState,
      description,
    });
  }

  /**
   * Serializes current state machine snapshot for mission persistence or recovery.
   */
  public exportSnapshot(): {
    currentState: AgentState;
    sessionId: string;
    enteredAt: number;
    historyLength: number;
  } {
    return {
      currentState: this.currentState,
      sessionId: this.sessionId,
      enteredAt: this.stateEnteredAt,
      historyLength: this.history.length,
    };
  }
}
