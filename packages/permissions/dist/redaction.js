export class SecretRedactor {
    patterns = [
        // NVIDIA NIM API Key
        {
            name: 'NVIDIA API Key',
            regex: /nvapi-[A-Za-z0-9_-]{30,}/g,
            replace: () => 'nvapi-[REDACTED]',
        },
        // OpenRouter API Key
        {
            name: 'OpenRouter API Key',
            regex: /sk-or-v1-[a-f0-9]{64}/g,
            replace: () => 'sk-or-v1-[REDACTED]',
        },
        // Anthropic API Key (must be before generic OpenAI)
        {
            name: 'Anthropic API Key',
            regex: /sk-ant-[A-Za-z0-9_-]{30,}/g,
            replace: () => 'sk-ant-[REDACTED]',
        },
        // OpenAI API Key (excludes OpenRouter and Anthropic)
        {
            name: 'OpenAI API Key',
            regex: /sk-(?!ant-|or-v1-)(?:proj-|live-)?[A-Za-z0-9_-]{24,}/g,
            replace: () => 'sk-[REDACTED]',
        },
        // Google Cloud / Firebase API Key
        {
            name: 'Google API Key',
            regex: /AIza[0-9A-Za-z\-_]{30,50}/g,
            replace: () => 'AIza[REDACTED]',
        },
        // GitHub Classic / Fine-Grained Token
        {
            name: 'GitHub Token',
            regex: /(?:gh[pousr][_-][A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{60,})/g,
            replace: () => 'gh*-[REDACTED]',
        },
        // AWS Access Key ID
        {
            name: 'AWS Access Key',
            regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
            replace: () => 'AKIA[REDACTED]',
        },
        // JWT Token
        {
            name: 'JSON Web Token (JWT)',
            regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
            replace: () => 'eyJ[REDACTED_JWT]',
        },
        // Authorization / Bearer Token Header
        {
            name: 'Bearer Token',
            regex: /Bearer\s+([A-Za-z0-9_\-\.]{20,})/gi,
            replace: () => 'Bearer [REDACTED_TOKEN]',
        },
        // Generic Private Key (RSA, EC, OPENSSH, DSA, PGP)
        {
            name: 'Private Key',
            regex: /-----BEGIN (?:[A-Z0-9 -]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9 -]+ )?PRIVATE KEY-----/g,
            replace: () => '[REDACTED_PRIVATE_KEY]',
        },
        // Database connection strings with embedded credentials
        {
            name: 'Database Credentials',
            regex: /([a-z]+:\/\/[^:]+:)([^@]+)(@[\w\.-]+(?::\d+)?\/[\w\.-]+)/gi,
            replace: (_match, prefix, _password, suffix) => `${prefix}[REDACTED]${suffix}`,
        },
        // Password / Secret in assignment or env var
        {
            name: 'Env Secret',
            regex: /(?:API_KEY|APIKEY|SECRET|PASSWORD|PASSWD|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|DATABASE_URL|CLIENT_SECRET|SESSION_TOKEN)\s*[:=]\s*["']?([^\s"'`#]{6,})["']?/gi,
            replace: (match) => {
                if (match.includes('[REDACTED'))
                    return match;
                const separatorMatch = match.match(/[:=]/);
                if (!separatorMatch || separatorMatch.index === undefined)
                    return match;
                const keyPart = match.slice(0, separatorMatch.index);
                const sep = separatorMatch[0];
                return `${keyPart}${sep}[REDACTED]`;
            },
        },
    ];
    redact(input) {
        if (!input || typeof input !== 'string') {
            return { redacted: input, foundSecrets: false, secretTypes: [] };
        }
        let output = input;
        let found = false;
        const types = [];
        for (const { name, regex, replace } of this.patterns) {
            regex.lastIndex = 0;
            if (regex.test(output)) {
                found = true;
                if (!types.includes(name)) {
                    types.push(name);
                }
                regex.lastIndex = 0;
                output = output.replace(regex, replace);
            }
        }
        return {
            redacted: output,
            foundSecrets: found,
            secretTypes: types,
        };
    }
    containsSecret(input) {
        if (!input || typeof input !== 'string')
            return false;
        for (const { regex } of this.patterns) {
            regex.lastIndex = 0;
            if (regex.test(input)) {
                return true;
            }
        }
        return false;
    }
    extractSecretTypes(input) {
        if (!input || typeof input !== 'string')
            return [];
        const types = [];
        for (const { name, regex } of this.patterns) {
            regex.lastIndex = 0;
            if (regex.test(input) && !types.includes(name)) {
                types.push(name);
            }
        }
        return types;
    }
    redactObject(target) {
        if (target === null || target === undefined) {
            return target;
        }
        if (typeof target === 'string') {
            return this.redact(target).redacted;
        }
        if (Array.isArray(target)) {
            return target.map((item) => this.redactObject(item));
        }
        if (typeof target === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(target)) {
                result[key] = this.redactObject(value);
            }
            return result;
        }
        return target;
    }
}
export const defaultSecretRedactor = new SecretRedactor();
//# sourceMappingURL=redaction.js.map