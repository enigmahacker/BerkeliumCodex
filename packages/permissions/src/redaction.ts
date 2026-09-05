export interface RedactionResult {
  redacted: string;
  foundSecrets: boolean;
  secretTypes: string[];
}

export class SecretRedactor {
  private patterns: Array<{ name: string; regex: RegExp; replace: (match: string) => string }> = [
    // NVIDIA API Key
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
    // OpenAI API Key
    {
      name: 'OpenAI API Key',
      regex: /sk-(?:proj-|live-)?[A-Za-z0-9_-]{32,}/g,
      replace: () => 'sk-[REDACTED]',
    },
    // Anthropic API Key
    {
      name: 'Anthropic API Key',
      regex: /sk-ant-[A-Za-z0-9_-]{40,}/g,
      replace: () => 'sk-ant-[REDACTED]',
    },
    // GitHub Token
    {
      name: 'GitHub Token',
      regex: /gh[pousr]-[A-Za-z0-9_]{36,}/g,
      replace: () => 'gh*-[REDACTED]',
    },
    // AWS Access Key
    {
      name: 'AWS Access Key',
      regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
      replace: () => 'AKIA[REDACTED]',
    },
    // Generic Private Key
    {
      name: 'Private Key',
      regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
      replace: () => '[REDACTED_PRIVATE_KEY]',
    },
    // Password / Secret in assignment or env
    {
      name: 'Env Secret',
      regex: /(?:API_KEY|SECRET|PASSWORD|TOKEN|AUTH_TOKEN|PRIVATE_KEY)\s*[:=]\s*["']?([A-Za-z0-9_\-\.]{8,})["']?/gi,
      replace: (match) => {
        const parts = match.split(/[:=]/);
        if (parts.length >= 2) {
          return `${parts[0]}=[REDACTED]`;
        }
        return match;
      },
    },
  ];

  public redact(input: string): RedactionResult {
    if (!input || typeof input !== 'string') {
      return { redacted: input, foundSecrets: false, secretTypes: [] };
    }

    let output = input;
    let found = false;
    const types: string[] = [];

    for (const { name, regex, replace } of this.patterns) {
      if (regex.test(output)) {
        found = true;
        types.push(name);
        output = output.replace(regex, replace);
      }
    }

    return {
      redacted: output,
      foundSecrets: found,
      secretTypes: types,
    };
  }
}

export const defaultSecretRedactor = new SecretRedactor();
