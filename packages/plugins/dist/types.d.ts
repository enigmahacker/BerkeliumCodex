export type HookType = 'before_tool' | 'after_tool' | 'before_model' | 'after_model' | 'before_edit' | 'after_edit' | 'session_start' | 'session_end' | 'before_commit' | 'after_commit';
export type HookHandler<T = any> = (context: T) => Promise<void> | void;
export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    author?: string;
    hooks?: Partial<Record<HookType, string | string[]>>;
    tools?: string[];
    agents?: string[];
    themes?: string[];
}
export interface BerkeliumPlugin {
    manifest: PluginManifest;
    activate?(context: any): Promise<void> | void;
    deactivate?(): Promise<void> | void;
}
//# sourceMappingURL=types.d.ts.map