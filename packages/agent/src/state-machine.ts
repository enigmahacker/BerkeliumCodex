import { EventBus } from '@berkelium/events';

export type AgentState =
  | 'IDLE'
  | 'THINKING'
  | 'PLANNING'
  | 'WAITING_FOR_PERMISSION'
  | 'EXECUTING_TOOL'
  | 'WAITING_FOR_MODEL'
  | 'COMPACTING_CONTEXT'
  | 'RUNNING_SUBAGENT'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export class AgentStateMachine {
  private currentState: AgentState = 'IDLE';
  private eventBus?: EventBus;
  private sessionId: string;

  constructor(sessionId: string, eventBus?: EventBus) {
    this.sessionId = sessionId;
    this.eventBus = eventBus;
  }

  public getState(): AgentState {
    return this.currentState;
  }

  public transition(newState: AgentState, description?: string): void {
    if (this.currentState === newState) return;

    const previousState = this.currentState;
    this.currentState = newState;

    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'state_changed',
      sessionId: this.sessionId,
      timestamp: Date.now(),
      previousState,
      newState,
      description,
    });
  }
}
