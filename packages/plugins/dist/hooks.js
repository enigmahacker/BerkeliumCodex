export class HookManager {
    hooks = new Map();
    register(type, handler) {
        if (!this.hooks.has(type)) {
            this.hooks.set(type, new Set());
        }
        this.hooks.get(type).add(handler);
        return () => this.hooks.get(type)?.delete(handler);
    }
    async trigger(type, context) {
        const handlers = this.hooks.get(type);
        if (!handlers || handlers.size === 0)
            return;
        for (const handler of handlers) {
            try {
                await handler(context);
            }
            catch (err) {
                console.error(`[HookManager] Hook error in ${type}:`, err);
            }
        }
    }
}
//# sourceMappingURL=hooks.js.map