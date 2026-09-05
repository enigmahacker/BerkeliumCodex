import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { AuthProviderId, AuthStatus, AuthStoreOptions } from './types.js';
import { MacOSKeychain } from './keychain.js';

export class AuthStore {
  private keychain: MacOSKeychain;
  private vaultPath: string;

  constructor(options: AuthStoreOptions = {}) {
    this.keychain = new MacOSKeychain(options.serviceName || 'berkelium');
    this.vaultPath =
      options.vaultPath || path.join(os.homedir(), '.berkelium', '.auth_vault.json');
  }

  public async getApiKey(provider: AuthProviderId): Promise<string | null> {
    const envKey = this.getEnvKey(provider);
    if (envKey) return envKey;

    // Try macOS keychain first
    const keychainKey = await this.keychain.getPassword(provider);
    if (keychainKey) return keychainKey;

    // Fallback to vault
    return this.getFromVault(provider);
  }

  public async setApiKey(provider: AuthProviderId, key: string): Promise<void> {
    const savedInKeychain = await this.keychain.setPassword(provider, key);
    if (!savedInKeychain) {
      this.saveToVault(provider, key);
    }
  }

  public async removeApiKey(provider: AuthProviderId): Promise<void> {
    await this.keychain.deletePassword(provider);
    this.removeFromVault(provider);
  }

  public async getStatus(provider: AuthProviderId): Promise<AuthStatus> {
    if (provider === 'ollama') {
      return {
        provider,
        name: 'Ollama',
        authenticated: true,
        source: 'local',
      };
    }
    if (provider === 'lmstudio') {
      return {
        provider,
        name: 'LM Studio',
        authenticated: true,
        source: 'local',
      };
    }

    const envKey = this.getEnvKey(provider);
    if (envKey) {
      return {
        provider,
        name: this.formatProviderName(provider),
        authenticated: true,
        source: 'env',
        maskedKey: this.maskKey(envKey),
      };
    }

    const keychainKey = await this.keychain.getPassword(provider);
    if (keychainKey) {
      return {
        provider,
        name: this.formatProviderName(provider),
        authenticated: true,
        source: 'keychain',
        maskedKey: this.maskKey(keychainKey),
      };
    }

    const vaultKey = this.getFromVault(provider);
    if (vaultKey) {
      return {
        provider,
        name: this.formatProviderName(provider),
        authenticated: true,
        source: 'vault',
        maskedKey: this.maskKey(vaultKey),
      };
    }

    return {
      provider,
      name: this.formatProviderName(provider),
      authenticated: false,
      source: 'none',
    };
  }

  public async getAllStatuses(): Promise<AuthStatus[]> {
    const providers: AuthProviderId[] = ['nvidia', 'openrouter', 'gemini', 'huggingface', 'groq', 'ollama', 'lmstudio'];
    return Promise.all(providers.map((p) => this.getStatus(p)));
  }

  public maskKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '********';
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}...${suffix}`;
  }

  private getEnvKey(provider: AuthProviderId): string | null {
    const varNames: Record<string, string[]> = {
      nvidia: ['NVIDIA_API_KEY', 'NGC_API_KEY'],
      openrouter: ['OPENROUTER_API_KEY'],
      gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY'],
      google: ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_API_KEY'],
      huggingface: ['HF_TOKEN', 'HUGGINGFACE_API_KEY', 'HUGGING_FACE_HUB_TOKEN'],
      groq: ['GROQ_API_KEY'],
      openai: ['OPENAI_API_KEY'],
      anthropic: ['ANTHROPIC_API_KEY'],
    };

    const candidates = varNames[provider] || [`${provider.toUpperCase()}_API_KEY`];
    for (const name of candidates) {
      if (process.env[name]) {
        return process.env[name]!.trim();
      }
    }
    return null;
  }

  private formatProviderName(provider: string): string {
    switch (provider) {
      case 'nvidia':
        return 'NVIDIA';
      case 'openrouter':
        return 'OpenRouter';
      case 'gemini':
      case 'google':
        return 'Google Gemini';
      case 'huggingface':
        return 'Hugging Face';
      case 'groq':
        return 'Groq';
      case 'ollama':
        return 'Ollama';
      case 'lmstudio':
        return 'LM Studio';
      default:
        return provider.toUpperCase();
    }
  }


  private getFromVault(provider: string): string | null {
    try {
      if (!fs.existsSync(this.vaultPath)) return null;
      const data = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
      return data[provider] || null;
    } catch {
      return null;
    }
  }

  private saveToVault(provider: string, key: string): void {
    try {
      const dir = path.dirname(this.vaultPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }
      let data: Record<string, string> = {};
      if (fs.existsSync(this.vaultPath)) {
        data = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
      }
      data[provider] = key;
      fs.writeFileSync(this.vaultPath, JSON.stringify(data, null, 2), { mode: 0o600 });
    } catch (err) {
      console.error('[AuthStore] Failed to save to local vault:', err);
    }
  }

  private removeFromVault(provider: string): void {
    try {
      if (!fs.existsSync(this.vaultPath)) return;
      const data = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
      delete data[provider];
      fs.writeFileSync(this.vaultPath, JSON.stringify(data, null, 2), { mode: 0o600 });
    } catch {}
  }
}

export const defaultAuthStore = new AuthStore();
