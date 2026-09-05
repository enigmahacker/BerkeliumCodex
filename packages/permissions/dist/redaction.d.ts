export interface RedactionResult {
    redacted: string;
    foundSecrets: boolean;
    secretTypes: string[];
}
export declare class SecretRedactor {
    private patterns;
    redact(input: string): RedactionResult;
}
export declare const defaultSecretRedactor: SecretRedactor;
//# sourceMappingURL=redaction.d.ts.map