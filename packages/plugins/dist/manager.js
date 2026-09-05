import { HookManager } from './hooks.js';
export class PluginManager {
    plugins = new Map();
    hookManager;
    logger;
    constructor(logger, hookManager = new HookManager()) {
        this.logger = logger.child('plugins');
        this.hookManager = hookManager;
    }
    getHookManager() {
        return this.hookManager;
    }
    async registerPlugin(plugin, runtimeContext) {
        this.plugins.set(plugin.manifest.name, plugin);
        if (plugin.activate) {
            try {
                await plugin.activate({ ...runtimeContext, hooks: this.hookManager });
                this.logger.info(`Plugin "${plugin.manifest.name}" activated.`);
            }
            catch (err) {
                this.logger.error(`Failed to activate plugin "${plugin.manifest.name}":`, err);
            }
        }
    }
    listPlugins() {
        return Array.from(this.plugins.values());
    }
}
//# sourceMappingURL=manager.js.map