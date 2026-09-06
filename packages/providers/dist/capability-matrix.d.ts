/**
 * @berkelium/providers — Capability Matrix
 *
 * Maps model IDs and architectures to supported capabilities.
 * Used by the model router to select the optimal model for a given task
 * (e.g. requires tool calling, vision, complex reasoning, or long context).
 */
export type ModelCapabilityType = 'chat' | 'code' | 'reasoning' | 'vision' | 'tool_calling' | 'structured_output' | 'embeddings' | 'long_context' | 'streaming';
export interface ModelCapabilityProfile {
    id: string;
    name: string;
    contextWindow: number;
    capabilities: ModelCapabilityType[];
    speedTier: 'ultra-fast' | 'fast' | 'balanced' | 'thoughtful';
    recommendedUse: string;
}
export declare class CapabilityMatrix {
    private profiles;
    constructor();
    registerProfile(profile: ModelCapabilityProfile): void;
    getProfile(modelId: string): ModelCapabilityProfile | undefined;
    hasCapability(modelId: string, capability: ModelCapabilityType): boolean;
    recommendModel(requirements: {
        code?: boolean;
        reasoning?: boolean;
        toolCalling?: boolean;
        vision?: boolean;
        longContext?: boolean;
        preferLocal?: boolean;
    }): string;
}
//# sourceMappingURL=capability-matrix.d.ts.map