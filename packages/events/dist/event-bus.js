export class EventBus {
    handlers = new Map();
    eventHistory = [];
    maxHistorySize;
    constructor(maxHistorySize = 1000) {
        this.maxHistorySize = maxHistorySize;
    }
    on(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type).add(handler);
        return () => {
            this.off(type, handler);
        };
    }
    off(type, handler) {
        const set = this.handlers.get(type);
        if (set) {
            set.delete(handler);
            if (set.size === 0) {
                this.handlers.delete(type);
            }
        }
    }
    emit(event) {
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
        // Direct type handlers
        const specificHandlers = this.handlers.get(event.type);
        if (specificHandlers) {
            for (const handler of specificHandlers) {
                try {
                    handler(event);
                }
                catch (err) {
                    console.error(`[EventBus] Error in handler for ${event.type}:`, err);
                }
            }
        }
        // Wildcard handlers
        const wildcardHandlers = this.handlers.get('*');
        if (wildcardHandlers) {
            for (const handler of wildcardHandlers) {
                try {
                    handler(event);
                }
                catch (err) {
                    console.error(`[EventBus] Error in wildcard handler for ${event.type}:`, err);
                }
            }
        }
    }
    getHistory() {
        return this.eventHistory;
    }
    clearHistory() {
        this.eventHistory = [];
    }
    removeAllListeners() {
        this.handlers.clear();
    }
}
//# sourceMappingURL=event-bus.js.map