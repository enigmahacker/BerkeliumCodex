import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
export interface ModelPickerItem {
    id: string;
    name: string;
    category: 'LOCAL' | 'CLOUD';
    details?: string;
    target: string;
}
export declare class ModelPicker {
    private themeManager;
    private configManager;
    private router;
    private items;
    constructor(themeManager: ThemeManager, configManager: ConfigManager, router: ProviderRouter, modelsDir?: string);
    private loadItems;
    getItems(): ModelPickerItem[];
    renderStatic(): void;
    promptInteractive(): Promise<ModelPickerItem | null>;
}
//# sourceMappingURL=model-picker.d.ts.map