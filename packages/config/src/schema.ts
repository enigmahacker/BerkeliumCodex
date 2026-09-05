import { z } from 'zod';

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
});

export type BerkeliumConfig = z.infer<typeof BerkeliumConfigSchema>;
export type ModelAlias = z.infer<typeof ModelAliasSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>;
