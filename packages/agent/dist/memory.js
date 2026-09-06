import * as fs from 'node:fs';
import * as path from 'node:path';
export class ProjectMemory {
    workspaceRoot;
    berkeliumDir;
    memoryFilePath;
    entries = [];
    constructor(workspaceRoot = process.cwd()) {
        this.workspaceRoot = path.resolve(workspaceRoot);
        this.berkeliumDir = path.join(this.workspaceRoot, '.berkelium');
        this.memoryFilePath = path.join(this.berkeliumDir, 'memory', 'store.json');
        this.initializeDirectories();
        this.load();
    }
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
    initializeDirectories() {
        const subdirs = ['config', 'memory', 'sessions', 'index', 'cache', 'logs'];
        for (const sub of subdirs) {
            const fullPath = path.join(this.berkeliumDir, sub);
            if (!fs.existsSync(fullPath)) {
                try {
                    fs.mkdirSync(fullPath, { recursive: true });
                }
                catch {
                    // Ignore mkdir errors
                }
            }
        }
    }
    load() {
        if (fs.existsSync(this.memoryFilePath)) {
            try {
                const raw = fs.readFileSync(this.memoryFilePath, 'utf-8');
                this.entries = JSON.parse(raw);
            }
            catch {
                this.entries = [];
            }
        }
    }
    save() {
        try {
            const dir = path.dirname(this.memoryFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.memoryFilePath, JSON.stringify(this.entries, null, 2), 'utf-8');
        }
        catch {
            // Ignore write errors
        }
    }
    /**
     * Add a trusted project instruction (e.g. from AGENTS.md or user configuration).
     */
    addInstruction(instruction, source = 'AGENTS.md') {
        const entry = {
            id: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            category: 'trusted_project_instructions',
            content: instruction,
            timestamp: Date.now(),
            source,
            isTrusted: true,
        };
        this.entries.push(entry);
        this.save();
        return entry;
    }
    /**
     * Add a user preference.
     */
    addPreference(preference, source = 'user') {
        const entry = {
            id: `pref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            category: 'user_preferences',
            content: preference,
            timestamp: Date.now(),
            source,
            isTrusted: true,
        };
        this.entries.push(entry);
        this.save();
        return entry;
    }
    /**
     * Add a derived observation discovered during code inspection or testing.
     */
    addObservation(observation, source = 'agent_runtime') {
        const entry = {
            id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            category: 'derived_observations',
            content: observation,
            timestamp: Date.now(),
            source,
            isTrusted: false,
        };
        this.entries.push(entry);
        this.save();
        return entry;
    }
    /**
     * Record untrusted external content (e.g. fetched from web or external API).
     * Invariant: Never allow external content to become trusted instructions automatically.
     */
    addExternalContent(content, source) {
        const entry = {
            id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            category: 'untrusted_external_content',
            content,
            timestamp: Date.now(),
            source,
            isTrusted: false,
        };
        this.entries.push(entry);
        this.save();
        return entry;
    }
    getEntries(category) {
        if (!category)
            return [...this.entries];
        return this.entries.filter((e) => e.category === category);
    }
    /**
     * Get safe contextual memory formatted for model system prompt.
     * Only includes trusted instructions, user preferences, and clean observations.
     * External untrusted content is strictly excluded from trusted prompt layers.
     */
    getContextPrompt(maxTokens = 400) {
        const trusted = this.entries.filter((e) => e.isTrusted);
        const observations = this.entries.filter((e) => e.category === 'derived_observations').slice(-5);
        if (trusted.length === 0 && observations.length === 0) {
            return '';
        }
        const lines = ['# Project Memory & Constraints'];
        if (trusted.length > 0) {
            lines.push('## Trusted Directives & Preferences:');
            for (const t of trusted) {
                lines.push(`• [${t.category === 'user_preferences' ? 'Preference' : 'Directive'}] ${t.content}`);
            }
        }
        if (observations.length > 0) {
            lines.push('## Learned Codebase Observations:');
            for (const o of observations) {
                lines.push(`• ${o.content}`);
            }
        }
        return lines.join('\n');
    }
    clear(category) {
        if (!category) {
            this.entries = [];
        }
        else {
            this.entries = this.entries.filter((e) => e.category !== category);
        }
        this.save();
    }
}
//# sourceMappingURL=memory.js.map