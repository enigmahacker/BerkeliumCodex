/**
 * Sanitizes environment variables passed to spawned child processes and shell executions,
 * preventing accidental leakage of API keys, cloud tokens, database credentials, and session secrets.
 */
export declare function sanitizeEnvironment(customEnv?: Record<string, string | undefined>): Record<string, string>;
//# sourceMappingURL=env-sanitizer.d.ts.map