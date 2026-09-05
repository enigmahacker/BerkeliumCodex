import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { MacOSKeychain } from './keychain.js';
export class AuthStore {
    keychain;
    vaultPath;
    constructor(options = {}) {
        this.keychain = new MacOSKeychain(options.serviceName || 'berkelium');
        this.vaultPath =
            options.vaultPath || path.join(os.homedir(), '.berkelium', '.auth_vault.json');
    }
    async getApiKey(provider) {
        const envKey = this.getEnvKey(provider);
        if (envKey)
            return envKey;
        // Try macOS keychain first
        const keychainKey = await this.keychain.getPassword(provider);
        if (keychainKey)
            return keychainKey;
        // Fallback to vault
        return this.getFromVault(provider);
    }
    async setApiKey(provider, key) {
        const savedInKeychain = await this.keychain.setPassword(provider, key);
        if (!savedInKeychain) {
            this.saveToVault(provider, key);
        }
    }
    async removeApiKey(provider) {
        await this.keychain.deletePassword(provider);
        this.removeFromVault(provider);
    }
    async getStatus(provider) {
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
    async getAllStatuses() {
        const providers = ['nvidia', 'openrouter', 'gemini', 'huggingface', 'groq', 'ollama', 'lmstudio'];
        return Promise.all(providers.map((p) => this.getStatus(p)));
    }
    maskKey(key) {
        if (!key)
            return '';
        if (key.length <= 8)
            return '********';
        const prefix = key.slice(0, 4);
        const suffix = key.slice(-4);
        return `${prefix}...${suffix}`;
    }
    getEnvKey(provider) {
        const varNames = {
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
                return process.env[name].trim();
            }
        }
        return null;
    }
    formatProviderName(provider) {
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
    getFromVault(provider) {
        try {
            if (!fs.existsSync(this.vaultPath))
                return null;
            const data = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
            return data[provider] || null;
        }
        catch {
            return null;
        }
    }
    saveToVault(provider, key) {
        try {
            const dir = path.dirname(this.vaultPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
            }
            let data = {};
            if (fs.existsSync(this.vaultPath)) {
                data = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
            }
            data[provider] = key;
            fs.writeFileSync(this.vaultPath, JSON.stringify(data, null, 2), { mode: 0o600 });
        }
        catch (err) {
            console.error('[AuthStore] Failed to save to local vault:', err);
        }
    }
    removeFromVault(provider) {
        try {
            if (!fs.existsSync(this.vaultPath))
                return;
            const data = JSON.parse(fs.readFileSync(this.vaultPath, 'utf-8'));
            delete data[provider];
            fs.writeFileSync(this.vaultPath, JSON.stringify(data, null, 2), { mode: 0o600 });
        }
        catch { }
    }
}
export const defaultAuthStore = new AuthStore();
//# sourceMappingURL=store.js.map