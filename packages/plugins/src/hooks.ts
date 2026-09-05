import { HookHandler, HookType } from './types.js';

export class HookManager {
  private hooks: Map<HookType, Set<HookHandler>> = new Map();

  public register(type: HookType, handler: HookHandler): () => void {
    if (!this.hooks.has(type)) {
      this.hooks.set(type, new Set());
    }
    this.hooks.get(type)!.add(handler);
    return () => this.hooks.get(type)?.delete(handler);
  }

  public async trigger<T = any>(type: HookType, context: T): Promise<void> {
    const handlers = this.hooks.get(type);
    if (!handlers || handlers.size === 0) return;

    for (const handler of handlers) {
      try {
        await handler(context);
      } catch (err) {
        console.error(`[HookManager] Hook error in ${type}:`, err);
      }
    }
  }
}
