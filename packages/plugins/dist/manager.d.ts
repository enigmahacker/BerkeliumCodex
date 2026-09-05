import { Logger } from '@berkelium/logging';
import { BerkeliumPlugin } from './types.js';
import { HookManager } from './hooks.js';
export declare class PluginManager {
    private plugins;
    private hookManager;
    private logger;
    constructor(logger: Logger, hookManager?: HookManager);
    getHookManager(): HookManager;
    registerPlugin(plugin: BerkeliumPlugin, runtimeContext?: any): Promise<void>;
    listPlugins(): BerkeliumPlugin[];
}
//# sourceMappingURL=manager.d.ts.map