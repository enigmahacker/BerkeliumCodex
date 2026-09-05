import { TUIOverlays } from '../tui/overlays.js';
export class ModelsCommand {
    static async run(themeManager, configManager, router) {
        const conf = configManager.getConfig();
        const discovered = await router.listAllAvailableModels();
        TUIOverlays.renderModels(themeManager, conf.models, discovered);
    }
}
//# sourceMappingURL=models.js.map