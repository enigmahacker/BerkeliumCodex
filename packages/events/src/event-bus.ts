import { AgentEvent, AgentEventType, EventHandler } from './types.js';

export class EventBus {
  private handlers: Map<AgentEventType | '*', Set<EventHandler<any>>> = new Map();
  private eventHistory: AgentEvent[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  public on<T extends AgentEvent>(type: T['type'] | '*', handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.off(type, handler);
    };
  }

  public off<T extends AgentEvent>(type: T['type'] | '*', handler: EventHandler<T>): void {
    const set = this.handlers.get(type);
    if (set) {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  public emit(event: AgentEvent): void {
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
        } catch (err) {
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
        } catch (err) {
          console.error(`[EventBus] Error in wildcard handler for ${event.type}:`, err);
        }
      }
    }
  }

  public getHistory(): readonly AgentEvent[] {
    return this.eventHistory;
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }

  public removeAllListeners(): void {
    this.handlers.clear();
  }
}
