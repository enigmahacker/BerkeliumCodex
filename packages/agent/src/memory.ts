import * as fs from 'node:fs';
import * as path from 'node:path';

export type MemoryCategory =
  | 'trusted_project_instructions'
  | 'user_preferences'
  | 'derived_observations'
  | 'temporary_task_state'
  | 'untrusted_external_content';

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  content: string;
  timestamp: number;
  source: string;
  isTrusted: boolean;
  metadata?: Record<string, any>;
}

export class ProjectMemory {
  private workspaceRoot: string;
  private berkeliumDir: string;
  private memoryFilePath: string;
  private entries: MemoryEntry[] = [];

  constructor(workspaceRoot: string = process.cwd()) {
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
  public initializeDirectories(): void {
    const subdirs = ['config', 'memory', 'sessions', 'index', 'cache', 'logs'];
    for (const sub of subdirs) {
      const fullPath = path.join(this.berkeliumDir, sub);
      if (!fs.existsSync(fullPath)) {
        try {
          fs.mkdirSync(fullPath, { recursive: true });
        } catch {
          // Ignore mkdir errors
        }
      }
    }
  }

  public load(): void {
    if (fs.existsSync(this.memoryFilePath)) {
      try {
        const raw = fs.readFileSync(this.memoryFilePath, 'utf-8');
        this.entries = JSON.parse(raw);
      } catch {
        this.entries = [];
      }
    }
  }

  public save(): void {
    try {
      const dir = path.dirname(this.memoryFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.memoryFilePath, JSON.stringify(this.entries, null, 2), 'utf-8');
    } catch {
      // Ignore write errors
    }
  }

  /**
   * Add a trusted project instruction (e.g. from AGENTS.md or user configuration).
   */
  public addInstruction(instruction: string, source: string = 'AGENTS.md'): MemoryEntry {
    const entry: MemoryEntry = {
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
  public addPreference(preference: string, source: string = 'user'): MemoryEntry {
    const entry: MemoryEntry = {
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
  public addObservation(observation: string, source: string = 'agent_runtime'): MemoryEntry {
    const entry: MemoryEntry = {
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
  public addExternalContent(content: string, source: string): MemoryEntry {
    const entry: MemoryEntry = {
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

  public getEntries(category?: MemoryCategory): MemoryEntry[] {
    if (!category) return [...this.entries];
    return this.entries.filter((e) => e.category === category);
  }

  /**
   * Get safe contextual memory formatted for model system prompt.
   * Only includes trusted instructions, user preferences, and clean observations.
   * External untrusted content is strictly excluded from trusted prompt layers.
   */
  public getContextPrompt(maxTokens = 400): string {
    const trusted = this.entries.filter((e) => e.isTrusted);
    const observations = this.entries.filter((e) => e.category === 'derived_observations').slice(-5);

    if (trusted.length === 0 && observations.length === 0) {
      return '';
    }

    const lines: string[] = ['# Project Memory & Constraints'];

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

  public clear(category?: MemoryCategory): void {
    if (!category) {
      this.entries = [];
    } else {
      this.entries = this.entries.filter((e) => e.category !== category);
    }
    this.save();
  }
}
