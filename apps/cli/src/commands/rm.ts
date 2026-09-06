import { ThemeManager } from '@berkelium/themes';
import { ModelManager } from '@berkelium/runtime';

export class RmCommand {
  public static async run(
    themeManager: ThemeManager,
    modelId?: string,
    modelsDir?: string
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    if (!modelId) {
      console.log(fmt.error('Usage: berkelium rm <model>'));
      return;
    }

    const manager = new ModelManager({ modelsDir });
    const removed = manager.remove(modelId);
    if (removed) {
      console.log(fmt.success(`✓ Model "${modelId}" removed from local storage.`));
    } else {
      console.log(fmt.error(`Model "${modelId}" not found in local storage.`));
    }
  }
}
