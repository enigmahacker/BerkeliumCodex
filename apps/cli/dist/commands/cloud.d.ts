import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { AuthStore } from '@berkelium/auth';
import { ProviderRouter } from '@berkelium/providers';
export declare class CloudCommand {
    static run(themeManager: ThemeManager, configManager: ConfigManager, authStore: AuthStore, router: ProviderRouter, subcommand?: string, arg1?: string, arg2?: string): Promise<void>;
}
//# sourceMappingURL=cloud.d.ts.map