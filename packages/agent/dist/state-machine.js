export class AgentStateMachine {
    currentState = 'IDLE';
    eventBus;
    sessionId;
    constructor(sessionId, eventBus) {
        this.sessionId = sessionId;
        this.eventBus = eventBus;
    }
    getState() {
        return this.currentState;
    }
    transition(newState, description) {
        if (this.currentState === newState)
            return;
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
//# sourceMappingURL=state-machine.js.map