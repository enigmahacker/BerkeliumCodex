import { ThemeManager } from '@berkelium/themes';
import { ModelStore } from '@berkelium/runtime';

export class ListCommand {
  public static async run(themeManager: ThemeManager, modelsDir?: string): Promise<void> {
    const fmt = themeManager.getFormatted();
    const store = new ModelStore(modelsDir);
    console.log();
    console.log(fmt.bold(fmt.primary('LOCAL MODELS (~/.berkelium/models)')));
    console.log();
    console.log(store.formatList());
    console.log();
  }
}
