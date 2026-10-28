import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { AuthProviderId, AuthStatus, AuthStoreOptions } from './types.js';
import { MacOSKeychain } from './keychain.js';

const VAULT_VERSION = 1;
const VAULT_ALGORITHM = 'aes-256-gcm';
const VAULT_AAD = Buffer.from('berkelium-auth-vault-v1');
const VAULT_KEY_BYTES = 32;
const VAULT_IV_BYTES = 12;

interface EncryptedVaultEnvelope {
  version: number;
  algorithm: string;
  iv: string;
  tag: string;
  data: string;
}

type VaultRecord = Record<string, string>;

function isVaultRecord(value: unknown): value is VaultRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === 'string');
}

function isEncryptedEnvelope(value: unknown): value is EncryptedVaultEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === VAULT_VERSION &&
    candidate.algorithm === VAULT_ALGORITHM &&
    typeof candidate.iv === 'string' &&
    typeof candidate.tag === 'string' &&
    typeof candidate.data === 'string'
  );
}

function decodeBase64(value: string, label: string): Buffer {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error(`[AuthStore] Invalid base64 encoding for ${label}.`);
  }
  return Buffer.from(value, 'base64');
}

function decodeVaultKey(value: string): Buffer {
  const trimmed = value.trim();
  if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  const decoded = decodeBase64(trimmed, 'vault encryption key');
  if (decoded.length !== VAULT_KEY_BYTES) {
    throw new Error(
      `[AuthStore] Vault encryption key must decode to ${VAULT_KEY_BYTES} bytes.`
    );
  }
  return decoded;
}

export class AuthStore {
  private keychain: MacOSKeychain;
  private vaultPath: string;
  private vaultKeyPath: string;
  private configuredVaultKey?: string;

  constructor(options: AuthStoreOptions = {}) {
    this.keychain = new MacOSKeychain(options.serviceName || 'berkelium');
    this.vaultPath =
      options.vaultPath || path.join(os.homedir(), '.berkelium', '.auth_vault.json');
    this.vaultKeyPath = options.vaultKeyPath || `${this.vaultPath}.key`;
    this.configuredVaultKey = options.vaultKey;
  }

  public async getApiKey(provider: AuthProviderId): Promise<string | null> {
    const envKey = this.getEnvKey(provider);
    if (envKey) return envKey;

    // Try macOS keychain first
    const keychainKey = await this.keychain.getPassword(provider);
    if (keychainKey) return keychainKey;

    // Fallback to encrypted vault
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
    const data = this.readVault();
    return data[provider] || null;
  }

  private saveToVault(provider: string, key: string): void {
    const data = this.readVault();
    data[provider] = key;
    this.writeVault(data);
  }

  private removeFromVault(provider: string): void {
    if (!fs.existsSync(this.vaultPath)) return;
    const data = this.readVault();
    delete data[provider];
    this.writeVault(data);
  }

  private readVault(): VaultRecord {
    if (!fs.existsSync(this.vaultPath)) return {};

    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
    } catch (err) {
      throw new Error(
        `[AuthStore] Failed to read credential vault at ${this.vaultPath}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    if (isEncryptedEnvelope(parsed)) {
      return this.decryptVault(parsed);
    }

    // Version 0 stored plaintext. Persist the encrypted form before returning
    // any credential so a failed migration never deletes the only copy.
    if (isVaultRecord(parsed)) {
      this.writeVault(parsed);
      return parsed;
    }

    throw new Error(
      `[AuthStore] Credential vault at ${this.vaultPath} has an unsupported format.`
    );
  }

  private decryptVault(envelope: EncryptedVaultEnvelope): VaultRecord {
    try {
      const key = this.getVaultKey();
      const iv = decodeBase64(envelope.iv, 'vault IV');
      const tag = decodeBase64(envelope.tag, 'vault authentication tag');
      const ciphertext = decodeBase64(envelope.data, 'vault ciphertext');

      if (iv.length !== VAULT_IV_BYTES || tag.length !== 16) {
        throw new Error('Vault envelope has invalid cryptographic parameters.');
      }

      const decipher = crypto.createDecipheriv(VAULT_ALGORITHM, key, iv);
      decipher.setAAD(VAULT_AAD);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf-8');

      const parsed = JSON.parse(plaintext);
      if (!isVaultRecord(parsed)) {
        throw new Error('Decrypted vault payload is not a credential record.');
      }
      return parsed;
    } catch (err) {
      throw new Error(
        `[AuthStore] Failed to decrypt credential vault. The vault or its key may be damaged: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  private writeVault(data: VaultRecord): void {
    try {
      const key = this.getVaultKey();
      const iv = crypto.randomBytes(VAULT_IV_BYTES);
      const cipher = crypto.createCipheriv(VAULT_ALGORITHM, key, iv);
      cipher.setAAD(VAULT_AAD);
      const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(data), 'utf-8'),
        cipher.final(),
      ]);
      const envelope: EncryptedVaultEnvelope = {
        version: VAULT_VERSION,
        algorithm: VAULT_ALGORITHM,
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        data: ciphertext.toString('base64'),
      };

      this.ensureVaultDirectory();
      const tempPath = `${this.vaultPath}.${process.pid}.${crypto
        .randomBytes(6)
        .toString('hex')}.tmp`;

      try {
        fs.writeFileSync(tempPath, JSON.stringify(envelope, null, 2), {
          mode: 0o600,
          flag: 'wx',
        });
        fs.chmodSync(tempPath, 0o600);
        fs.renameSync(tempPath, this.vaultPath);
        fs.chmodSync(this.vaultPath, 0o600);
      } catch (err) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // The temporary file may not have been created.
        }
        throw err;
      }
    } catch (err) {
      throw new Error(
        `[AuthStore] Failed to save the encrypted credential vault at ${this.vaultPath}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  private getVaultKey(): Buffer {
    const configured = this.configuredVaultKey || process.env.BERKELIUM_VAULT_KEY;
    if (configured) {
      return decodeVaultKey(configured);
    }

    this.ensureVaultDirectory();
    if (fs.existsSync(this.vaultKeyPath)) {
      const stored = fs.readFileSync(this.vaultKeyPath, 'utf-8');
      return decodeVaultKey(stored);
    }

    const generated = crypto.randomBytes(VAULT_KEY_BYTES);
    try {
      fs.writeFileSync(this.vaultKeyPath, generated.toString('base64'), {
        mode: 0o600,
        flag: 'wx',
      });
      fs.chmodSync(this.vaultKeyPath, 0o600);
      return generated;
    } catch (err: any) {
      if (err?.code === 'EEXIST') {
        return decodeVaultKey(fs.readFileSync(this.vaultKeyPath, 'utf-8'));
      }
      throw err;
    }
  }

  private ensureVaultDirectory(): void {
    const dir = path.dirname(this.vaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }
}

export const defaultAuthStore = new AuthStore();
