export type AuthProviderId = 'nvidia' | 'openrouter' | 'ollama' | 'lmstudio' | 'openai' | 'anthropic' | string;
export interface AuthStatus {
    provider: AuthProviderId;
    name: string;
    authenticated: boolean;
    source: 'keychain' | 'vault' | 'env' | 'local' | 'none';
    maskedKey?: string;
}
export interface AuthStoreOptions {
    serviceName?: string;
    vaultPath?: string;
}
//# sourceMappingURL=types.d.ts.map