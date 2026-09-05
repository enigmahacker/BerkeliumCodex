import { AuthProviderId, AuthStatus, AuthStoreOptions } from './types.js';
export declare class AuthStore {
    private keychain;
    private vaultPath;
    constructor(options?: AuthStoreOptions);
    getApiKey(provider: AuthProviderId): Promise<string | null>;
    setApiKey(provider: AuthProviderId, key: string): Promise<void>;
    removeApiKey(provider: AuthProviderId): Promise<void>;
    getStatus(provider: AuthProviderId): Promise<AuthStatus>;
    getAllStatuses(): Promise<AuthStatus[]>;
    maskKey(key: string): string;
    private getEnvKey;
    private formatProviderName;
    private getFromVault;
    private saveToVault;
    private removeFromVault;
}
export declare const defaultAuthStore: AuthStore;
//# sourceMappingURL=store.d.ts.map