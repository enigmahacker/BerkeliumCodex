import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { BerkeliumConfig, BerkeliumConfigSchema } from './schema.js';

export class ConfigManager {
  private config: BerkeliumConfig;
  private workspaceRoot: string;
  private sessionOverrides: Partial<BerkeliumConfig> = {};
  private cliOverrides: Partial<BerkeliumConfig> = {};

  constructor(workspaceRoot = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.config = this.loadHierarchy();
  }

  public getConfig(): BerkeliumConfig {
    // Deep-merge so partial overrides preserve nested settings from lower tiers.
    const merged = this.deepMerge(
      this.deepMerge(this.config, this.sessionOverrides),
      this.cliOverrides
    );
    return BerkeliumConfigSchema.parse(merged);
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  public setSessionOverride(overrides: Partial<BerkeliumConfig>): void {
    this.sessionOverrides = { ...this.sessionOverrides, ...overrides };
  }

  public setCliOverrides(overrides: Partial<BerkeliumConfig>): void {
    this.cliOverrides = { ...this.cliOverrides, ...overrides };
  }

  public getDefaultModel(): string {
    const conf = this.getConfig();
    return conf.defaultModel || conf.default_model;
  }

  public setDefaultModel(model: string): boolean {
    return this.updateProjectConfig((curr) => ({
      ...curr,
      default_model: model,
      defaultModel: model,
    }));
  }

  public getEffort(): string {
    const conf = this.getConfig();
    return conf.effort || 'medium';
  }

  public setEffort(effort: any): boolean {
    return this.updateProjectConfig((curr) => ({
      ...curr,
      effort,
    }));
  }

  private getGlobalConfigDir(): string {
    return process.env.BERKELIUM_GLOBAL_CONFIG_DIR || path.join(os.homedir(), '.berkelium');
  }

  public updateGlobalConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): boolean {
    const globalDir = this.getGlobalConfigDir();
    const jsonPath = path.join(globalDir, 'config.json');
    const yamlPath = path.join(globalDir, 'config.yaml');
    const targetPath = fs.existsSync(jsonPath) ? jsonPath : (fs.existsSync(yamlPath) ? yamlPath : jsonPath);
    return this.persistConfig(targetPath, mutator);
  }

  public updateProjectConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): boolean {
    const jsonPath = path.join(this.workspaceRoot, '.berkelium', 'config.json');
    const yamlPath = path.join(this.workspaceRoot, '.berkelium', 'config.yaml');
    const targetPath = fs.existsSync(jsonPath) ? jsonPath : (fs.existsSync(yamlPath) ? yamlPath : jsonPath);
    return this.persistConfig(targetPath, mutator);
  }

  private persistConfig(
    targetPath: string,
    mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>
  ): boolean {
    try {
      // Mutate the persisted hierarchy, not session/CLI overrides, so transient
      // flags are never written to disk.
      const updated = mutator(this.config);
      const changes = this.diffConfig(this.config, updated);
      if (Object.keys(changes).length === 0) {
        return true;
      }
      this.writeConfigFile(targetPath, changes);
      this.config = this.loadHierarchy();
      return true;
    } catch (err) {
      console.error(`[ConfigManager] Failed to persist config to ${targetPath}:`, err);
      return false;
    }
  }

  private loadHierarchy(): BerkeliumConfig {
    let merged: Record<string, any> = {};

    // 1. Built-in defaults are applied via Zod parsing empty object
    const defaults = BerkeliumConfigSchema.parse({});
    merged = { ...defaults };

    // 2. Global configuration: ~/.berkelium/config.json or config.yaml
    const globalConfig = this.readConfigWithFallbacks(path.join(this.getGlobalConfigDir(), 'config'));
    if (globalConfig) merged = this.deepMerge(merged, globalConfig);

    // 3. Machine configuration: /etc/berkelium/config.json or config.yaml
    const machineConfig = this.readConfigWithFallbacks('/etc/berkelium/config');
    if (machineConfig) merged = this.deepMerge(merged, machineConfig);

    // 4. Project configuration: <workspaceRoot>/.berkelium/config.json or config.yaml
    const projectConfig = this.readConfigWithFallbacks(path.join(this.workspaceRoot, '.berkelium', 'config'));
    if (projectConfig) merged = this.deepMerge(merged, projectConfig);

    // 5. Directory configuration: <cwd>/.berkelium/config.json or config.yaml (if different from workspace)
    if (process.cwd() !== this.workspaceRoot) {
      const dirConfig = this.readConfigWithFallbacks(path.join(process.cwd(), '.berkelium', 'config'));
      if (dirConfig) merged = this.deepMerge(merged, dirConfig);
    }

    return BerkeliumConfigSchema.parse(merged);
  }

  private readConfigWithFallbacks(basePath: string): Record<string, any> | null {
    const candidates = [
      `${basePath}.json`,
      `${basePath}.yaml`,
      `${basePath}.yml`,
      basePath,
    ];
    for (const p of candidates) {
      const res = this.readConfigFile(p);
      if (res) return res;
    }
    return null;
  }

  private readConfigFile(filePath: string): Record<string, any> | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err: any) {
      throw new Error(`Failed to read config file "${filePath}": ${err?.message || String(err)}`);
    }

    let parsed: unknown;
    try {
      parsed = filePath.endsWith('.json') ? JSON.parse(content) : parseYaml(content);
    } catch (err: any) {
      throw new Error(`Failed to parse config file "${filePath}": ${err?.message || String(err)}`);
    }

    if (parsed === null || parsed === undefined) {
      return null;
    }
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Config file "${filePath}" must contain an object at the root.`);
    }
    return parsed as Record<string, any>;
  }

  private writeConfigFile(filePath: string, updates: Record<string, any>): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const current = this.readConfigFile(filePath) || {};
    const combined = this.deepMerge(current, updates);
    const serialized = filePath.endsWith('.json')
      ? JSON.stringify(combined, null, 2)
      : stringifyYaml(combined);
    const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;

    try {
      // Config files can contain provider settings; keep them owner-only and
      // replace atomically so a crash cannot leave a truncated file behind.
      fs.writeFileSync(tempPath, serialized, { encoding: 'utf-8', mode: 0o600 });
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
      throw err;
    }
  }

  private diffConfig(current: any, next: any): Record<string, any> {
    const changes: Record<string, any> = {};
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      return changes;
    }

    for (const key of Object.keys(next)) {
      const nextValue = next[key];
      const currentValue = current?.[key];
      if (
        nextValue &&
        typeof nextValue === 'object' &&
        !Array.isArray(nextValue) &&
        currentValue &&
        typeof currentValue === 'object' &&
        !Array.isArray(currentValue)
      ) {
        const nested = this.diffConfig(currentValue, nextValue);
        if (Object.keys(nested).length > 0) {
          changes[key] = nested;
        }
      } else if (JSON.stringify(nextValue) !== JSON.stringify(currentValue)) {
        changes[key] = nextValue;
      }
    }
    return changes;
  }

  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') return target;
    const output = { ...target };
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        key in target &&
        typeof target[key] === 'object'
      ) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }
}
