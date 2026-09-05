export interface RedactionResult {
    redacted: string;
    foundSecrets: boolean;
    secretTypes: string[];
}
export interface RedactionPattern {
    name: string;
    regex: RegExp;
    replace: (match: string, ...args: any[]) => string;
}
export declare class SecretRedactor {
    private patterns;
    redact(input: string): RedactionResult;
    containsSecret(input: string): boolean;
    extractSecretTypes(input: string): string[];
    redactObject<T>(target: T): T;
}
export declare const defaultSecretRedactor: SecretRedactor;
//# sourceMappingURL=redaction.d.ts.map