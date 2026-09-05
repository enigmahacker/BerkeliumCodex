import { BerkeliumConfig } from './schema.js';
export declare class ConfigManager {
    private config;
    private workspaceRoot;
    private sessionOverrides;
    private cliOverrides;
    constructor(workspaceRoot?: string);
    getConfig(): BerkeliumConfig;
    getWorkspaceRoot(): string;
    setSessionOverride(overrides: Partial<BerkeliumConfig>): void;
    setCliOverrides(overrides: Partial<BerkeliumConfig>): void;
    updateGlobalConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): void;
    updateProjectConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): void;
    private loadHierarchy;
    private readConfigFile;
    private writeConfigFile;
    private deepMerge;
}
//# sourceMappingURL=loader.d.ts.map