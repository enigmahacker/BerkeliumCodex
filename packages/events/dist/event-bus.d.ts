import { AgentEvent, EventHandler } from './types.js';
export declare class EventBus {
    private handlers;
    private eventHistory;
    private maxHistorySize;
    constructor(maxHistorySize?: number);
    on<T extends AgentEvent>(type: T['type'] | '*', handler: EventHandler<T>): () => void;
    off<T extends AgentEvent>(type: T['type'] | '*', handler: EventHandler<T>): void;
    emit(event: AgentEvent): void;
    getHistory(): readonly AgentEvent[];
    clearHistory(): void;
    removeAllListeners(): void;
}
//# sourceMappingURL=event-bus.d.ts.map