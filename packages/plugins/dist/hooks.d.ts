import { HookHandler, HookType } from './types.js';
export declare class HookManager {
    private hooks;
    register(type: HookType, handler: HookHandler): () => void;
    trigger<T = any>(type: HookType, context: T): Promise<void>;
}
//# sourceMappingURL=hooks.d.ts.map