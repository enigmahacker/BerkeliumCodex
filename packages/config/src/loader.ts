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
    // Merge base config with session and CLI overrides
    return BerkeliumConfigSchema.parse({
      ...this.config,
      ...this.sessionOverrides,
      ...this.cliOverrides,
    });
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

  public updateGlobalConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): void {
    const globalPath = path.join(os.homedir(), '.berkelium', 'config.yaml');
    const updated = mutator(this.getConfig());
    this.writeConfigFile(globalPath, updated);
    this.config = this.loadHierarchy();
  }

  public updateProjectConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): void {
    const projectPath = path.join(this.workspaceRoot, '.berkelium', 'config.yaml');
    const updated = mutator(this.getConfig());
    this.writeConfigFile(projectPath, updated);
    this.config = this.loadHierarchy();
  }

  private loadHierarchy(): BerkeliumConfig {
    let merged: Record<string, any> = {};

    // 1. Built-in defaults are applied via Zod parsing empty object
    const defaults = BerkeliumConfigSchema.parse({});
    merged = { ...defaults };

    // 2. Global configuration: ~/.berkelium/config.yaml
    const globalConfig = this.readConfigFile(path.join(os.homedir(), '.berkelium', 'config.yaml'));
    if (globalConfig) merged = this.deepMerge(merged, globalConfig);

    // 3. Machine configuration: /etc/berkelium/config.yaml
    const machineConfig = this.readConfigFile('/etc/berkelium/config.yaml');
    if (machineConfig) merged = this.deepMerge(merged, machineConfig);

    // 4. Project configuration: <workspaceRoot>/.berkelium/config.yaml
    const projectConfig = this.readConfigFile(path.join(this.workspaceRoot, '.berkelium', 'config.yaml'));
    if (projectConfig) merged = this.deepMerge(merged, projectConfig);

    // 5. Directory configuration: <cwd>/.berkelium/config.yaml (if different from workspace)
    if (process.cwd() !== this.workspaceRoot) {
      const dirConfig = this.readConfigFile(path.join(process.cwd(), '.berkelium', 'config.yaml'));
      if (dirConfig) merged = this.deepMerge(merged, dirConfig);
    }

    return BerkeliumConfigSchema.parse(merged);
  }

  private readConfigFile(filePath: string): Record<string, any> | null {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return parseYaml(content) || null;
      }
    } catch (err) {
      console.warn(`[ConfigManager] Failed to read config from ${filePath}:`, err);
    }
    return null;
  }

  private writeConfigFile(filePath: string, updates: Record<string, any>): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      let current: Record<string, any> = {};
      if (fs.existsSync(filePath)) {
        current = parseYaml(fs.readFileSync(filePath, 'utf-8')) || {};
      }
      const combined = this.deepMerge(current, updates);
      fs.writeFileSync(filePath, stringifyYaml(combined), 'utf-8');
    } catch (err) {
      console.error(`[ConfigManager] Failed to write config to ${filePath}:`, err);
    }
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
