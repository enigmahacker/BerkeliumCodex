export declare class MacOSKeychain {
    private serviceName;
    constructor(serviceName?: string);
    isAvailable(): boolean;
    getPassword(account: string): Promise<string | null>;
    setPassword(account: string, password: string): Promise<boolean>;
    deletePassword(account: string): Promise<boolean>;
}
//# sourceMappingURL=keychain.d.ts.map