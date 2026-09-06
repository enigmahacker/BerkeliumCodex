import { ModelManager } from '@berkelium/runtime';
export class PullCommand {
    static async run(themeManager, modelId, modelsDir) {
        const fmt = themeManager.getFormatted();
        if (!modelId) {
            console.log(fmt.error('Usage: berkelium pull <model>'));
            console.log(fmt.dimmed('Example: berkelium pull qwen3-coder'));
            return;
        }
        console.log();
        console.log(fmt.bold(fmt.primary(`Pulling ${modelId}...`)));
        const manager = new ModelManager({ modelsDir });
        let lastStatus = '';
        try {
            await manager.pull(modelId, (progress) => {
                if (progress.message && progress.message !== lastStatus) {
                    lastStatus = progress.message;
                    console.log(fmt.dimmed(`  ${progress.message}`));
                }
            });
            console.log(fmt.success(`✓ Model "${modelId}" is ready.`));
        }
        catch (err) {
            console.log(fmt.error(`Failed to pull model: ${err.message}`));
        }
        console.log();
    }
}
//# sourceMappingURL=pull.js.map