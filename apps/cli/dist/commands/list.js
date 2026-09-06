import { ModelStore } from '@berkelium/runtime';
export class ListCommand {
    static async run(themeManager, modelsDir) {
        const fmt = themeManager.getFormatted();
        const store = new ModelStore(modelsDir);
        console.log();
        console.log(fmt.bold(fmt.primary('LOCAL MODELS (~/.berkelium/models)')));
        console.log();
        console.log(store.formatList());
        console.log();
    }
}
//# sourceMappingURL=list.js.map