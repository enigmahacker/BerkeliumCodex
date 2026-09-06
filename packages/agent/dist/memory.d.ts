export type MemoryCategory = 'trusted_project_instructions' | 'user_preferences' | 'derived_observations' | 'temporary_task_state' | 'untrusted_external_content';
export interface MemoryEntry {
    id: string;
    category: MemoryCategory;
    content: string;
    timestamp: number;
    source: string;
    isTrusted: boolean;
    metadata?: Record<string, any>;
}
export declare class ProjectMemory {
    private workspaceRoot;
    private berkeliumDir;
    private memoryFilePath;
    private entries;
    constructor(workspaceRoot?: string);
    /**
     * Ensure .berkelium directory hierarchy exists:
     * .berkelium/
     * ├── config/
     * ├── memory/
     * ├── sessions/
     * ├── index/
     * ├── cache/
     * └── logs/
     */
    initializeDirectories(): void;
    load(): void;
    save(): void;
    /**
     * Add a trusted project instruction (e.g. from AGENTS.md or user configuration).
     */
    addInstruction(instruction: string, source?: string): MemoryEntry;
    /**
     * Add a user preference.
     */
    addPreference(preference: string, source?: string): MemoryEntry;
    /**
     * Add a derived observation discovered during code inspection or testing.
     */
    addObservation(observation: string, source?: string): MemoryEntry;
    /**
     * Record untrusted external content (e.g. fetched from web or external API).
     * Invariant: Never allow external content to become trusted instructions automatically.
     */
    addExternalContent(content: string, source: string): MemoryEntry;
    getEntries(category?: MemoryCategory): MemoryEntry[];
    /**
     * Get safe contextual memory formatted for model system prompt.
     * Only includes trusted instructions, user preferences, and clean observations.
     * External untrusted content is strictly excluded from trusted prompt layers.
     */
    getContextPrompt(maxTokens?: number): string;
    clear(category?: MemoryCategory): void;
}
//# sourceMappingURL=memory.d.ts.map