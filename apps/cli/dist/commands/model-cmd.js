import { ModelStore } from '@berkelium/runtime';
import { ModelPicker } from '../tui/model-picker.js';
export class ModelSubcommand {
    static async run(themeManager, configManager, router, subaction, targetModel, modelsDir) {
        const fmt = themeManager.getFormatted();
        const config = configManager.getConfig();
        const store = new ModelStore(modelsDir);
        const action = subaction ? subaction.toLowerCase() : 'select';
        switch (action) {
            case 'select':
            case 'choose': {
                const picker = new ModelPicker(themeManager, configManager, router, modelsDir);
                await picker.promptInteractive();
                break;
            }
            case 'current': {
                const active = config.default_model;
                let resolvedInfo = '';
                try {
                    const target = router.resolveTarget(active);
                    resolvedInfo = ` → ${target.providerId}/${target.modelId}`;
                }
                catch {
                    // Unresolved target
                }
                console.log();
                console.log(`Active Model: ${fmt.bold(fmt.primary(active))}${fmt.dimmed(resolvedInfo)}`);
                console.log();
                break;
            }
            case 'use': {
                if (!targetModel) {
                    console.log(fmt.error('Usage: berkelium model use <model-or-alias>'));
                    console.log(fmt.dimmed('Example: berkelium model use gemini-3.6-flash'));
                    return;
                }
                try {
                    const target = router.resolveTarget(targetModel);
                    configManager.setSessionOverride({ default_model: targetModel });
                    console.log();
                    console.log(fmt.success(`✓ Active model set to "${targetModel}" (${target.providerId}/${target.modelId})`));
                    console.log();
                }
                catch (err) {
                    console.log(fmt.error(`Could not resolve model: ${err.message}`));
                }
                break;
            }
            case 'list': {
                console.log();
                console.log(fmt.bold(fmt.primary('LOCAL STORED MODELS')));
                console.log();
                console.log(store.formatList());
                console.log();
                break;
            }
            case 'cache': {
                const stats = store.getCacheStats();
                const sizeGB = (stats.totalSizeBytes / 1024 ** 3).toFixed(2);
                console.log();
                console.log(fmt.bold(fmt.primary('MODEL CACHE STATISTICS')));
                console.log(`Location:     ${stats.modelsDir}`);
                console.log(`Total Models: ${stats.modelCount}`);
                console.log(`Disk Storage: ${sizeGB} GB`);
                console.log();
                break;
            }
            case 'prune': {
                const days = targetModel ? parseInt(targetModel, 10) : 30;
                const pruned = store.prune(isNaN(days) ? 30 : days);
                console.log();
                if (pruned.length === 0) {
                    console.log(fmt.dimmed('No inactive models found to prune.'));
                }
                else {
                    console.log(fmt.success(`✓ Pruned ${pruned.length} models:`));
                    for (const id of pruned) {
                        console.log(`  - ${id}`);
                    }
                }
                console.log();
                break;
            }
            case 'verify': {
                if (!targetModel) {
                    console.log(fmt.error('Usage: berkelium model verify <model-id>'));
                    return;
                }
                const result = await store.verify(targetModel);
                console.log();
                if (result.valid) {
                    console.log(fmt.success(`✓ ${result.message}`));
                }
                else {
                    console.log(fmt.error(`✗ ${result.message}`));
                }
                console.log();
                break;
            }
            default: {
                console.log(fmt.bold(fmt.primary('BERKELIUM MODEL COMMANDS')));
                console.log('  berkelium model current           Show currently active model');
                console.log('  berkelium model use <model>       Switch active default model');
                console.log('  berkelium model list              List local stored models');
                console.log('  berkelium model cache             View cache disk storage metrics');
                console.log('  berkelium model prune [days]      Prune unused models');
                console.log('  berkelium model verify <model>    Verify model file integrity');
                console.log();
            }
        }
    }
}
//# sourceMappingURL=model-cmd.js.map