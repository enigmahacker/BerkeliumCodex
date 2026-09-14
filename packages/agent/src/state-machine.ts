import { EventBus } from '@berkelium/events';

export type AgentState =
  | 'IDLE'
  | 'THINKING'
  | 'RESPONDING'
  | 'PLANNING'
  | 'WAITING_FOR_MODEL'
  | 'WAITING_FOR_PERMISSION'
  | 'EXECUTING'
  | 'EXECUTING_TOOL'
  | 'VERIFYING'
  | 'REMEDIATING'
  | 'COMPACTING_CONTEXT'
  | 'RUNNING_SUBAGENT'
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
    'RESPONDING',
    'PLANNING',
    'WAITING_FOR_MODEL',
    'WAITING_FOR_PERMISSION',
    'EXECUTING',
    'EXECUTING_TOOL',
    'RUNNING_SUBAGENT',
    'COMPACTING_CONTEXT',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  RESPONDING: [
    'IDLE',
    'THINKING',
    'COMPACTING_CONTEXT',
    'FAILED',
    'CANCELLED',
  ],
  PLANNING: [
    'WAITING_FOR_MODEL',
    'WAITING_FOR_PERMISSION',
    'EXECUTING',
    'EXECUTING_TOOL',
    'RUNNING_SUBAGENT',
    'COMPACTING_CONTEXT',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  WAITING_FOR_MODEL: [
    'EXECUTING',
    'EXECUTING_TOOL',
    'WAITING_FOR_PERMISSION',
    'RESPONDING',
    'VERIFYING',
    'COMPACTING_CONTEXT',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  WAITING_FOR_PERMISSION: [
    'EXECUTING',
    'EXECUTING_TOOL',
    'WAITING_FOR_MODEL',
    'COMPACTING_CONTEXT',
    'CANCELLED',
    'FAILED',
    'IDLE',
  ],
  EXECUTING: [
    'WAITING_FOR_MODEL',
    'EXECUTING',
    'EXECUTING_TOOL',
    'VERIFYING',
    'COMPACTING_CONTEXT',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  EXECUTING_TOOL: [
    'WAITING_FOR_MODEL',
    'EXECUTING',
    'EXECUTING_TOOL',
    'VERIFYING',
    'COMPACTING_CONTEXT',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  VERIFYING: [
    'COMPLETED',
    'REMEDIATING',
    'WAITING_FOR_MODEL',
    'PLANNING',
    'EXECUTING',
    'EXECUTING_TOOL',
    'COMPACTING_CONTEXT',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  REMEDIATING: [
    'EXECUTING',
    'EXECUTING_TOOL',
    'PLANNING',
    'WAITING_FOR_MODEL',
    'COMPACTING_CONTEXT',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  RUNNING_SUBAGENT: [
    'THINKING',
    'PLANNING',
    'WAITING_FOR_MODEL',
    'EXECUTING',
    'EXECUTING_TOOL',
    'VERIFYING',
    'COMPACTING_CONTEXT',
    'FAILED',
    'CANCELLED',
    'IDLE',
  ],
  COMPACTING_CONTEXT: [
    'THINKING',
    'RESPONDING',
    'PLANNING',
    'WAITING_FOR_MODEL',
    'WAITING_FOR_PERMISSION',
    'EXECUTING',
    'EXECUTING_TOOL',
    'RUNNING_SUBAGENT',
    'VERIFYING',
    'REMEDIATING',
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
  private interruptedState: AgentState | null = null;
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

  public get state(): AgentState {
    return this.currentState;
  }

  public getInterruptedState(): AgentState | null {
    return this.interruptedState;
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

    if (newState === 'COMPACTING_CONTEXT') {
      this.interruptedState = previousState;
    }

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
   * Deterministically restores an interrupted state following context compaction.
   */
  public restoreState(targetState?: AgentState): void {
    const stateToRestore = targetState || this.interruptedState;
    if (!stateToRestore) {
      throw new Error('No interrupted state available to restore.');
    }

    if (!this.canTransition(stateToRestore)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        stateToRestore,
        `Deterministic restore rejection: Cannot transition from "${this.currentState}" to "${stateToRestore}".`
      );
    }

    this.transition(stateToRestore, `Restored state to ${stateToRestore} after context compaction`);
    this.interruptedState = null;
  }

  /**
   * Serializes current state machine snapshot for mission persistence or recovery.
   */
  public exportSnapshot(): {
    currentState: AgentState;
    sessionId: string;
    enteredAt: number;
    historyLength: number;
    interruptedState: AgentState | null;
  } {
    return {
      currentState: this.currentState,
      sessionId: this.sessionId,
      enteredAt: this.stateEnteredAt,
      historyLength: this.history.length,
      interruptedState: this.interruptedState,
    };
  }
}
