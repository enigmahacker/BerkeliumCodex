const SAFE_ENV_KEYS = new Set([
    'PATH',
    'HOME',
    'USER',
    'LOGNAME',
    'SHELL',
    'LANG',
    'LC_ALL',
    'LC_CTYPE',
    'LC_MESSAGES',
    'TMPDIR',
    'TERM',
    'TERM_PROGRAM',
    'TERM_PROGRAM_VERSION',
    'COLORTERM',
    'CI',
    'PAGER',
    'NODE_ENV',
    'EDITOR',
    'VISUAL',
    'XDG_CONFIG_HOME',
    'XDG_DATA_HOME',
    'XDG_CACHE_HOME',
    'XDG_RUNTIME_DIR',
    'PKG_CONFIG_PATH',
    'NODE_PATH',
    'npm_config_user_agent',
    'PNPM_HOME',
]);
const SENSITIVE_ENV_PATTERN = /(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD|AUTH|CREDENTIAL|OPENAI|ANTHROPIC|NVIDIA|OPENROUTER|AWS_|GITHUB_|GH_|DATABASE_URL|OAUTH|PRIVATE|SIGNING)/i;
/**
 * Sanitizes environment variables passed to spawned child processes and shell executions,
 * preventing accidental leakage of API keys, cloud tokens, database credentials, and session secrets.
 */
export function sanitizeEnvironment(customEnv) {
    const sanitized = {};
    const source = { ...process.env, ...(customEnv || {}) };
    for (const [key, value] of Object.entries(source)) {
        if (value === undefined)
            continue;
        // Check against blacklist pattern first
        if (SENSITIVE_ENV_PATTERN.test(key)) {
            continue;
        }
        // Include if in safe set or standard non-sensitive tool/compiler prefix
        if (SAFE_ENV_KEYS.has(key) ||
            key.startsWith('npm_') ||
            key.startsWith('pnpm_') ||
            key.startsWith('CARGO_') ||
            key.startsWith('RUST_') ||
            key.startsWith('GO') ||
            key.startsWith('PYTHON') ||
            key.startsWith('BERKELIUM_')) {
            sanitized[key] = value;
        }
    }
    // Ensure safe defaults for non-interactive execution
    sanitized.CI = '1';
    sanitized.PAGER = 'cat';
    return sanitized;
}
//# sourceMappingURL=env-sanitizer.js.map