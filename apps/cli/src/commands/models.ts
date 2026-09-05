import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { TUIOverlays } from '../tui/overlays.js';

export class ModelsCommand {
  public static async run(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    router: ProviderRouter
  ): Promise<void> {
    const conf = configManager.getConfig();
    const discovered = await router.listAllAvailableModels();
    TUIOverlays.renderModels(themeManager, conf.models, discovered);
  }
}
