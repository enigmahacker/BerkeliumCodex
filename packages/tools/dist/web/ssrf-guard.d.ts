export interface UrlValidationResult {
    safe: boolean;
    error?: string;
    url?: URL;
}
/**
 * Validates a URL against SSRF, loopback, cloud metadata, and forbidden protocol exploits.
 */
export declare function validateSafeUrl(rawUrl: string): UrlValidationResult;
//# sourceMappingURL=ssrf-guard.d.ts.map