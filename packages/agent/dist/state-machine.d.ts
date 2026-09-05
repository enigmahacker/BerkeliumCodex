import { EventBus } from '@berkelium/events';
export type AgentState = 'IDLE' | 'THINKING' | 'PLANNING' | 'WAITING_FOR_PERMISSION' | 'EXECUTING_TOOL' | 'WAITING_FOR_MODEL' | 'COMPACTING_CONTEXT' | 'RUNNING_SUBAGENT' | 'VERIFYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export declare class AgentStateMachine {
    private currentState;
    private eventBus?;
    private sessionId;
    constructor(sessionId: string, eventBus?: EventBus);
    getState(): AgentState;
    transition(newState: AgentState, description?: string): void;
}
//# sourceMappingURL=state-machine.d.ts.map