export interface PromptLayers {
    identity?: string;
    behavior?: string;
    coding?: string;
    safety?: string;
    tools?: string;
    workspace?: string;
    custom?: string;
}
export declare const DEFAULT_IDENTITY_PROMPT: string;
export declare const DEFAULT_BEHAVIOR_PROMPT: string;
export declare const DEFAULT_CODING_PROMPT: string;
export declare const DEFAULT_SAFETY_PROMPT: string;
export declare class PromptEngine {
    static compose(layers: PromptLayers, workspaceRoot?: string): string;
    static loadCustomPrompts(workspaceRoot?: string): PromptLayers;
    static saveCustomPrompt(workspaceRoot: string, layer: 'identity' | 'behavior' | 'coding' | 'safety' | 'tools' | 'custom' | string, content: string): string;
    static resetCustomPrompt(workspaceRoot: string, layer?: string): boolean;
    private static tryReadFile;
}
//# sourceMappingURL=prompts.d.ts.map