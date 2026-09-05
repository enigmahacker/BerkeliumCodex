import { Logger } from '@berkelium/logging';
import { BerkeliumPlugin } from './types.js';
import { HookManager } from './hooks.js';

export class PluginManager {
  private plugins: Map<string, BerkeliumPlugin> = new Map();
  private hookManager: HookManager;
  private logger: Logger;

  constructor(logger: Logger, hookManager = new HookManager()) {
    this.logger = logger.child('plugins');
    this.hookManager = hookManager;
  }

  public getHookManager(): HookManager {
    return this.hookManager;
  }

  public async registerPlugin(plugin: BerkeliumPlugin, runtimeContext?: any): Promise<void> {
    this.plugins.set(plugin.manifest.name, plugin);
    if (plugin.activate) {
      try {
        await plugin.activate({ ...runtimeContext, hooks: this.hookManager });
        this.logger.info(`Plugin "${plugin.manifest.name}" activated.`);
      } catch (err: any) {
        this.logger.error(`Failed to activate plugin "${plugin.manifest.name}":`, err);
      }
    }
  }

  public listPlugins(): BerkeliumPlugin[] {
    return Array.from(this.plugins.values());
  }
}
