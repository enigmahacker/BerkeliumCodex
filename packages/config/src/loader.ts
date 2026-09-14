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

  public getDefaultModel(): string {
    const conf = this.getConfig();
    return conf.defaultModel || conf.default_model;
  }

  public setDefaultModel(model: string): void {
    this.updateProjectConfig((curr) => ({
      ...curr,
      default_model: model,
      defaultModel: model,
    }));
  }

  public getEffort(): string {
    const conf = this.getConfig();
    return conf.effort || 'medium';
  }

  public setEffort(effort: any): void {
    this.updateProjectConfig((curr) => ({
      ...curr,
      effort,
    }));
  }

  private getGlobalConfigDir(): string {
    return process.env.BERKELIUM_GLOBAL_CONFIG_DIR || path.join(os.homedir(), '.berkelium');
  }

  public updateGlobalConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): void {
    const globalDir = this.getGlobalConfigDir();
    const jsonPath = path.join(globalDir, 'config.json');
    const yamlPath = path.join(globalDir, 'config.yaml');
    const targetPath = fs.existsSync(jsonPath) ? jsonPath : (fs.existsSync(yamlPath) ? yamlPath : jsonPath);
    const updated = mutator(this.getConfig());
    this.writeConfigFile(targetPath, updated);
    this.config = this.loadHierarchy();
  }

  public updateProjectConfig(mutator: (current: BerkeliumConfig) => Partial<BerkeliumConfig>): void {
    const jsonPath = path.join(this.workspaceRoot, '.berkelium', 'config.json');
    const yamlPath = path.join(this.workspaceRoot, '.berkelium', 'config.yaml');
    const targetPath = fs.existsSync(jsonPath) ? jsonPath : (fs.existsSync(yamlPath) ? yamlPath : jsonPath);
    const updated = mutator(this.getConfig());
    this.writeConfigFile(targetPath, updated);
    this.config = this.loadHierarchy();
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
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (filePath.endsWith('.json')) {
          return JSON.parse(content);
        }
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
        const content = fs.readFileSync(filePath, 'utf-8');
        if (filePath.endsWith('.json')) {
          try {
            current = JSON.parse(content) || {};
          } catch {
            current = {};
          }
        } else {
          current = parseYaml(content) || {};
        }
      }
      const combined = this.deepMerge(current, updates);
      if (filePath.endsWith('.json')) {
        fs.writeFileSync(filePath, JSON.stringify(combined, null, 2), 'utf-8');
      } else {
        fs.writeFileSync(filePath, stringifyYaml(combined), 'utf-8');
      }
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
