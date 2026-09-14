import { describe, it, expect } from 'vitest';
import {
  AgentStateMachine,
  VALID_TRANSITIONS,
  InvalidStateTransitionError,
  AgentState,
} from '@berkelium/agent';
import { EventBus } from '@berkelium/events';

describe('Deterministic Agent State Machine & Transition Invariants', () => {
  it('should initialize cleanly in IDLE state', () => {
    const sm = new AgentStateMachine('test-session');
    expect(sm.getState()).toBe('IDLE');
    expect(sm.getHistory()).toHaveLength(0);
  });

  it('should traverse the canonical agent execution loop successfully', () => {
    const events: any[] = [];
    const bus = new EventBus();
    bus.on('state_changed', (evt) => events.push(evt));

    const sm = new AgentStateMachine('test-session', bus);

    // IDLE -> THINKING -> PLANNING -> WAITING_FOR_MODEL -> EXECUTING_TOOL -> VERIFYING -> COMPLETED -> IDLE
    sm.transition('THINKING', 'Analyzing user intent');
    expect(sm.getState()).toBe('THINKING');

    sm.transition('PLANNING', 'Formulating file edits');
    expect(sm.getState()).toBe('PLANNING');

    sm.transition('WAITING_FOR_MODEL', 'Streaming patch from model');
    expect(sm.getState()).toBe('WAITING_FOR_MODEL');

    sm.transition('EXECUTING_TOOL', 'Executing edit_file');
    expect(sm.getState()).toBe('EXECUTING_TOOL');

    sm.transition('VERIFYING', 'Running tests');
    expect(sm.getState()).toBe('VERIFYING');

    sm.transition('COMPLETED', 'Task finished');
    expect(sm.getState()).toBe('COMPLETED');

    sm.transition('IDLE', 'Ready for next command');
    expect(sm.getState()).toBe('IDLE');

    expect(sm.getHistory()).toHaveLength(7);
    expect(events).toHaveLength(7);
    expect(events[0].previousState).toBe('IDLE');
    expect(events[0].newState).toBe('THINKING');
    expect(events[6].previousState).toBe('COMPLETED');
    expect(events[6].newState).toBe('IDLE');
  });

  it('should reject illegal direct transitions with InvalidStateTransitionError', () => {
    const sm = new AgentStateMachine('test-session');

    // IDLE cannot jump directly to EXECUTING_TOOL
    expect(() => sm.transition('EXECUTING_TOOL')).toThrow(InvalidStateTransitionError);
    expect(sm.getState()).toBe('IDLE');

    // IDLE cannot jump directly to VERIFYING
    expect(() => sm.transition('VERIFYING')).toThrow(InvalidStateTransitionError);
    expect(sm.getState()).toBe('IDLE');

    // IDLE cannot jump directly to COMPLETED
    expect(() => sm.transition('COMPLETED')).toThrow(InvalidStateTransitionError);
    expect(sm.getState()).toBe('IDLE');
  });

  it('should reject illegal transitions from intermediate states', () => {
    const sm = new AgentStateMachine('test-session');
    sm.transition('THINKING');

    // THINKING cannot jump directly to VERIFYING without executing or planning
    expect(() => sm.transition('VERIFYING')).toThrow(InvalidStateTransitionError);

    // Transition to WAITING_FOR_PERMISSION
    sm.transition('PLANNING');
    sm.transition('WAITING_FOR_PERMISSION');

    // WAITING_FOR_PERMISSION cannot jump to COMPLETED
    expect(() => sm.transition('COMPLETED')).toThrow(InvalidStateTransitionError);

    // Can transition to EXECUTING_TOOL or WAITING_FOR_MODEL or CANCELLED
    expect(sm.canTransition('EXECUTING_TOOL')).toBe(true);
    expect(sm.canTransition('WAITING_FOR_MODEL')).toBe(true);
    expect(sm.canTransition('CANCELLED')).toBe(true);
  });

  it('should permit cancellation from any operational state', () => {
    const operationalStates: AgentState[] = [
      'IDLE',
      'THINKING',
      'PLANNING',
      'WAITING_FOR_MODEL',
      'WAITING_FOR_PERMISSION',
      'EXECUTING_TOOL',
      'COMPACTING_CONTEXT',
      'RUNNING_SUBAGENT',
      'VERIFYING',
    ];

    for (const state of operationalStates) {
      expect(VALID_TRANSITIONS[state]).toContain('CANCELLED');
    }
  });

  it('should export a serializable snapshot for mission persistence', () => {
    const sm = new AgentStateMachine('persist-test');
    sm.transition('THINKING');
    sm.transition('PLANNING');

    const snap = sm.exportSnapshot();
    expect(snap.sessionId).toBe('persist-test');
    expect(snap.currentState).toBe('PLANNING');
    expect(snap.historyLength).toBe(2);
    expect(snap.enteredAt).toBeGreaterThan(0);
  });
});
