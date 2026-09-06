import { z } from 'zod';
// ── Runtime & Model Storage ──────────────────────────────────────────────
export const RuntimeModeSchema = z.enum(['local', 'cloud', 'hybrid', 'auto']).default('auto');
export const PrivacyModeSchema = z.enum(['local', 'balanced', 'hybrid', 'cloud']).default('balanced');
export const RuntimeConfigSchema = z.object({
    default: z.enum(['mlx', 'gguf', 'cpu', 'auto']).default('auto'),
    mlx: z.object({
        enabled: z.boolean().default(true),
        python_path: z.string().optional(),
        server_port: z.number().default(8321),
    }).default({ enabled: true, server_port: 8321 }),
    gguf: z.object({
        enabled: z.boolean().default(true),
        llama_server_path: z.string().optional(),
        server_port: z.number().default(8322),
    }).default({ enabled: true, server_port: 8322 }),
    cpu: z.object({
        enabled: z.boolean().default(true),
    }).default({ enabled: true }),
}).default({
    default: 'auto',
    mlx: { enabled: true, server_port: 8321 },
    gguf: { enabled: true, server_port: 8322 },
    cpu: { enabled: true },
});
export const ModelStorageConfigSchema = z.object({
    models_dir: z.string().optional(),
    max_storage_gb: z.number().optional(),
    auto_prune: z.boolean().default(false),
}).default({
    auto_prune: false,
});
export const CostControlConfigSchema = z.object({
    enabled: z.boolean().default(false),
    session_budget_usd: z.number().optional(),
    daily_budget_usd: z.number().optional(),
    monthly_budget_usd: z.number().optional(),
    max_tokens_per_request: z.number().optional(),
    warn_threshold_percent: z.number().default(80),
}).default({
    enabled: false,
    warn_threshold_percent: 80,
});
export const PrivacyConfigSchema = z.object({
    mode: PrivacyModeSchema,
    cloud_escalation_prompt: z.boolean().default(true),
    sensitive_patterns: z.array(z.string()).default([]),
}).default({
    mode: 'balanced',
    cloud_escalation_prompt: true,
    sensitive_patterns: [],
});
export const CloudConfigSchema = z.object({
    enabled: z.boolean().default(true),
    default_provider: z.string().optional(),
}).default({
    enabled: true,
});
export const ModelAliasSchema = z.object({
    provider: z.string(),
    model: z.string(),
    context_length: z.number().optional(),
    temperature: z.number().optional(),
    max_tokens: z.number().optional(),
});
export const ProviderConfigSchema = z.object({
    enabled: z.boolean().default(true),
    base_url: z.string().optional(),
    api_key: z.string().optional(),
    models: z.array(z.string()).optional(),
    timeout_ms: z.number().default(60000),
});
export const PermissionActionPolicySchema = z.enum(['allow', 'ask', 'deny']);
export const PermissionPolicySchema = z.object({
    filesystem: z.object({
        read: PermissionActionPolicySchema.default('allow'),
        write: z.object({
            workspace: PermissionActionPolicySchema.default('allow'),
            outside_workspace: PermissionActionPolicySchema.default('ask'),
        }).default({ workspace: 'allow', outside_workspace: 'ask' }),
        delete: z.object({
            workspace: PermissionActionPolicySchema.default('ask'),
            outside_workspace: PermissionActionPolicySchema.default('deny'),
        }).default({ workspace: 'ask', outside_workspace: 'deny' }),
    }).default({
        read: 'allow',
        write: { workspace: 'allow', outside_workspace: 'ask' },
        delete: { workspace: 'ask', outside_workspace: 'deny' },
    }),
    shell: z.object({
        safe: PermissionActionPolicySchema.default('allow'),
        destructive: PermissionActionPolicySchema.default('ask'),
        privileged: PermissionActionPolicySchema.default('deny'),
    }).default({
        safe: 'allow',
        destructive: 'ask',
        privileged: 'deny',
    }),
    network: z.object({
        default: PermissionActionPolicySchema.default('ask'),
        allowed_domains: z.array(z.string()).default([]),
    }).default({
        default: 'ask',
        allowed_domains: [],
    }),
});
export const BerkeliumConfigSchema = z.object({
    version: z.number().default(1),
    default_model: z.string().default('coding'),
    routing: z.object({
        primary: z.string().default('openrouter/coding'),
        fallback: z.array(z.string()).default([
            'nvidia/coding',
            'ollama/local',
            'lmstudio/workstation',
        ]),
    }).default({
        primary: 'openrouter/coding',
        fallback: ['nvidia/coding', 'ollama/local', 'lmstudio/workstation'],
    }),
    models: z.record(ModelAliasSchema).default({
        coding: {
            provider: 'openrouter',
            model: 'deepseek/deepseek-chat',
            context_length: 65536,
            max_tokens: 2048,
        },
        local: {
            provider: 'ollama',
            model: 'qwen2.5:14b-instruct-q4_K_M',
            context_length: 32768,
        },
        workstation: {
            provider: 'lmstudio',
            model: 'deepseek-coder-v2',
            context_length: 65536,
        },
        cloud: {
            provider: 'nvidia',
            model: 'meta/llama-3.3-70b-instruct',
            context_length: 131072,
        },
        fast: {
            provider: 'openrouter',
            model: 'google/gemini-2.0-flash-001',
            context_length: 1048576,
        },
        reasoning: {
            provider: 'openrouter',
            model: 'deepseek/deepseek-r1',
            context_length: 163840,
        },
        lmstudio: {
            provider: 'lmstudio',
            model: 'deepseek-coder-v2',
            context_length: 65536,
        },
        ollama: {
            provider: 'ollama',
            model: 'qwen2.5:14b-instruct-q4_K_M',
            context_length: 32768,
        },
        groq: {
            provider: 'groq',
            model: 'llama-3.3-70b-versatile',
            context_length: 128000,
        },
        gemini: {
            provider: 'gemini',
            model: 'gemini-3.6-flash',
            context_length: 1048576,
        },
        google: {
            provider: 'gemini',
            model: 'gemini-3.6-flash',
            context_length: 1048576,
        },
        'gemini-flash': {
            provider: 'gemini',
            model: 'gemini-3.6-flash',
            context_length: 1048576,
        },
        'gemini-pro': {
            provider: 'gemini',
            model: 'gemini-2.5-pro',
            context_length: 2097152,
        },
        'gemini-flash-thinking': {
            provider: 'gemini',
            model: 'gemini-3.7-flash',
            context_length: 1048576,
        },
        huggingface: {
            provider: 'huggingface',
            model: 'meta-llama/Llama-3.3-70B-Instruct',
            context_length: 131072,
        },
        hf: {
            provider: 'huggingface',
            model: 'meta-llama/Llama-3.3-70B-Instruct',
            context_length: 131072,
        },
        nvidia: {
            provider: 'nvidia',
            model: 'meta/llama-3.3-70b-instruct',
            context_length: 131072,
        },
    }),
    providers: z.object({
        openrouter: ProviderConfigSchema.default({
            enabled: true,
            base_url: 'https://openrouter.ai/api/v1',
        }),
        nvidia: ProviderConfigSchema.default({
            enabled: true,
            base_url: 'https://integrate.api.nvidia.com/v1',
        }),
        gemini: ProviderConfigSchema.default({
            enabled: true,
            base_url: 'https://generativelanguage.googleapis.com/v1beta/openai',
        }),
        huggingface: ProviderConfigSchema.default({
            enabled: true,
            base_url: 'https://router.huggingface.co/hf-inference/v1',
        }),
        groq: ProviderConfigSchema.default({
            enabled: true,
            base_url: 'https://api.groq.com/openai/v1',
        }),
        ollama: ProviderConfigSchema.default({
            enabled: true,
            base_url: 'http://127.0.0.1:11434',
        }),
        lmstudio: ProviderConfigSchema.default({
            enabled: true,
            base_url: 'http://127.0.0.1:1234/v1',
        }),
    }).default({
        openrouter: { enabled: true, base_url: 'https://openrouter.ai/api/v1', timeout_ms: 60000 },
        nvidia: { enabled: true, base_url: 'https://integrate.api.nvidia.com/v1', timeout_ms: 60000 },
        gemini: { enabled: true, base_url: 'https://generativelanguage.googleapis.com/v1beta/openai', timeout_ms: 60000 },
        huggingface: { enabled: true, base_url: 'https://router.huggingface.co/hf-inference/v1', timeout_ms: 60000 },
        groq: { enabled: true, base_url: 'https://api.groq.com/openai/v1', timeout_ms: 60000 },
        ollama: { enabled: true, base_url: 'http://127.0.0.1:11434', timeout_ms: 60000 },
        lmstudio: { enabled: true, base_url: 'http://127.0.0.1:1234/v1', timeout_ms: 60000 },
    }),
    agent: z.object({
        max_iterations: z.number().default(40),
        max_tool_retries: z.number().default(3),
        auto_compact: z.boolean().default(true),
        verify_changes: z.boolean().default(true),
        timeout_seconds: z.number().default(300),
    }).default({
        max_iterations: 40,
        max_tool_retries: 3,
        auto_compact: true,
        verify_changes: true,
        timeout_seconds: 300,
    }),
    tools: z.object({
        shell: z.boolean().default(true),
        filesystem: z.boolean().default(true),
        git: z.boolean().default(true),
        web: z.boolean().default(true),
        diagnostics: z.boolean().default(true),
    }).default({
        shell: true,
        filesystem: true,
        git: true,
        web: true,
        diagnostics: true,
    }),
    permissions: PermissionPolicySchema.default({}),
    theme: z.object({
        name: z.string().default('berkelium-dark'),
    }).default({
        name: 'berkelium-dark',
    }),
    ui: z.object({
        launch_animation: z.boolean().default(true),
        launch_animation_duration_ms: z.number().default(1200),
        launch_matrix: z.boolean().default(true),
        hackathon_mode: z.boolean().default(false),
        density: z.enum(['compact', 'normal', 'relaxed']).default('compact'),
        unicode: z.boolean().default(true),
    }).default({
        launch_animation: true,
        launch_animation_duration_ms: 1200,
        launch_matrix: true,
        hackathon_mode: false,
        density: 'compact',
        unicode: true,
    }),
    prompt: z.object({
        system: z.string().optional(),
        identity: z.string().optional(),
        behavior: z.string().optional(),
        coding: z.string().optional(),
        tools: z.string().optional(),
    }).default({}),
    // ── New: Runtime, Privacy, Cost, Model Storage, Cloud ──────────────
    runtime: RuntimeConfigSchema,
    model_storage: ModelStorageConfigSchema,
    privacy: PrivacyConfigSchema,
    cost: CostControlConfigSchema,
    cloud: CloudConfigSchema,
    mode: RuntimeModeSchema,
});
//# sourceMappingURL=schema.js.map