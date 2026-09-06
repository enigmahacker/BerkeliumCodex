import { ModelManager } from '@berkelium/runtime';
export class ShowCommand {
    static async run(themeManager, modelId, modelsDir) {
        const fmt = themeManager.getFormatted();
        if (!modelId) {
            console.log(fmt.error('Usage: berkelium show <model>'));
            return;
        }
        const manager = new ModelManager({ modelsDir });
        const info = manager.show(modelId);
        if (!info) {
            console.log(fmt.error(`Model "${modelId}" not found in local store.`));
            return;
        }
        console.log();
        console.log(fmt.bold(fmt.primary(`MODEL CARD: ${modelId}`)));
        console.log(info);
        console.log();
    }
}
//# sourceMappingURL=show.js.map