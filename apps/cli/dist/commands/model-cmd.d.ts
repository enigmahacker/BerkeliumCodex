import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
export declare class ModelSubcommand {
    static run(themeManager: ThemeManager, configManager: ConfigManager, router: ProviderRouter, subaction?: string, targetModel?: string, modelsDir?: string): Promise<void>;
}
//# sourceMappingURL=model-cmd.d.ts.map