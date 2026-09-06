import { z } from 'zod';
export declare const RuntimeModeSchema: z.ZodDefault<z.ZodEnum<["local", "cloud", "hybrid", "auto"]>>;
export declare const PrivacyModeSchema: z.ZodDefault<z.ZodEnum<["local", "balanced", "hybrid", "cloud"]>>;
export declare const RuntimeConfigSchema: z.ZodDefault<z.ZodObject<{
    default: z.ZodDefault<z.ZodEnum<["mlx", "gguf", "cpu", "auto"]>>;
    mlx: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        python_path: z.ZodOptional<z.ZodString>;
        server_port: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        server_port: number;
        python_path?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        python_path?: string | undefined;
        server_port?: number | undefined;
    }>>;
    gguf: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        llama_server_path: z.ZodOptional<z.ZodString>;
        server_port: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        server_port: number;
        llama_server_path?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        server_port?: number | undefined;
        llama_server_path?: string | undefined;
    }>>;
    cpu: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
    }, {
        enabled?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    mlx: {
        enabled: boolean;
        server_port: number;
        python_path?: string | undefined;
    };
    gguf: {
        enabled: boolean;
        server_port: number;
        llama_server_path?: string | undefined;
    };
    cpu: {
        enabled: boolean;
    };
    default: "auto" | "mlx" | "gguf" | "cpu";
}, {
    mlx?: {
        enabled?: boolean | undefined;
        python_path?: string | undefined;
        server_port?: number | undefined;
    } | undefined;
    gguf?: {
        enabled?: boolean | undefined;
        server_port?: number | undefined;
        llama_server_path?: string | undefined;
    } | undefined;
    cpu?: {
        enabled?: boolean | undefined;
    } | undefined;
    default?: "auto" | "mlx" | "gguf" | "cpu" | undefined;
}>>;
export declare const ModelStorageConfigSchema: z.ZodDefault<z.ZodObject<{
    models_dir: z.ZodOptional<z.ZodString>;
    max_storage_gb: z.ZodOptional<z.ZodNumber>;
    auto_prune: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    auto_prune: boolean;
    models_dir?: string | undefined;
    max_storage_gb?: number | undefined;
}, {
    models_dir?: string | undefined;
    max_storage_gb?: number | undefined;
    auto_prune?: boolean | undefined;
}>>;
export declare const CostControlConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    session_budget_usd: z.ZodOptional<z.ZodNumber>;
    daily_budget_usd: z.ZodOptional<z.ZodNumber>;
    monthly_budget_usd: z.ZodOptional<z.ZodNumber>;
    max_tokens_per_request: z.ZodOptional<z.ZodNumber>;
    warn_threshold_percent: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    warn_threshold_percent: number;
    session_budget_usd?: number | undefined;
    daily_budget_usd?: number | undefined;
    monthly_budget_usd?: number | undefined;
    max_tokens_per_request?: number | undefined;
}, {
    enabled?: boolean | undefined;
    session_budget_usd?: number | undefined;
    daily_budget_usd?: number | undefined;
    monthly_budget_usd?: number | undefined;
    max_tokens_per_request?: number | undefined;
    warn_threshold_percent?: number | undefined;
}>>;
export declare const PrivacyConfigSchema: z.ZodDefault<z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<["local", "balanced", "hybrid", "cloud"]>>;
    cloud_escalation_prompt: z.ZodDefault<z.ZodBoolean>;
    sensitive_patterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    mode: "local" | "cloud" | "hybrid" | "balanced";
    cloud_escalation_prompt: boolean;
    sensitive_patterns: string[];
}, {
    mode?: "local" | "cloud" | "hybrid" | "balanced" | undefined;
    cloud_escalation_prompt?: boolean | undefined;
    sensitive_patterns?: string[] | undefined;
}>>;
export declare const CloudConfigSchema: z.ZodDefault<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    default_provider: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    default_provider?: string | undefined;
}, {
    enabled?: boolean | undefined;
    default_provider?: string | undefined;
}>>;
export declare const ModelAliasSchema: z.ZodObject<{
    provider: z.ZodString;
    model: z.ZodString;
    context_length: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    max_tokens: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    model: string;
    context_length?: number | undefined;
    temperature?: number | undefined;
    max_tokens?: number | undefined;
}, {
    provider: string;
    model: string;
    context_length?: number | undefined;
    temperature?: number | undefined;
    max_tokens?: number | undefined;
}>;
export declare const ProviderConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    base_url: z.ZodOptional<z.ZodString>;
    api_key: z.ZodOptional<z.ZodString>;
    models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeout_ms: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    timeout_ms: number;
    base_url?: string | undefined;
    api_key?: string | undefined;
    models?: string[] | undefined;
}, {
    enabled?: boolean | undefined;
    base_url?: string | undefined;
    api_key?: string | undefined;
    models?: string[] | undefined;
    timeout_ms?: number | undefined;
}>;
export declare const PermissionActionPolicySchema: z.ZodEnum<["allow", "ask", "deny"]>;
export declare const PermissionPolicySchema: z.ZodObject<{
    filesystem: z.ZodDefault<z.ZodObject<{
        read: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
        write: z.ZodDefault<z.ZodObject<{
            workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            outside_workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
        }, "strip", z.ZodTypeAny, {
            workspace: "allow" | "ask" | "deny";
            outside_workspace: "allow" | "ask" | "deny";
        }, {
            workspace?: "allow" | "ask" | "deny" | undefined;
            outside_workspace?: "allow" | "ask" | "deny" | undefined;
        }>>;
        delete: z.ZodDefault<z.ZodObject<{
            workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            outside_workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
        }, "strip", z.ZodTypeAny, {
            workspace: "allow" | "ask" | "deny";
            outside_workspace: "allow" | "ask" | "deny";
        }, {
            workspace?: "allow" | "ask" | "deny" | undefined;
            outside_workspace?: "allow" | "ask" | "deny" | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        read: "allow" | "ask" | "deny";
        write: {
            workspace: "allow" | "ask" | "deny";
            outside_workspace: "allow" | "ask" | "deny";
        };
        delete: {
            workspace: "allow" | "ask" | "deny";
            outside_workspace: "allow" | "ask" | "deny";
        };
    }, {
        read?: "allow" | "ask" | "deny" | undefined;
        write?: {
            workspace?: "allow" | "ask" | "deny" | undefined;
            outside_workspace?: "allow" | "ask" | "deny" | undefined;
        } | undefined;
        delete?: {
            workspace?: "allow" | "ask" | "deny" | undefined;
            outside_workspace?: "allow" | "ask" | "deny" | undefined;
        } | undefined;
    }>>;
    shell: z.ZodDefault<z.ZodObject<{
        safe: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
        destructive: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
        privileged: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
    }, "strip", z.ZodTypeAny, {
        safe: "allow" | "ask" | "deny";
        destructive: "allow" | "ask" | "deny";
        privileged: "allow" | "ask" | "deny";
    }, {
        safe?: "allow" | "ask" | "deny" | undefined;
        destructive?: "allow" | "ask" | "deny" | undefined;
        privileged?: "allow" | "ask" | "deny" | undefined;
    }>>;
    network: z.ZodDefault<z.ZodObject<{
        default: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
        allowed_domains: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        default: "allow" | "ask" | "deny";
        allowed_domains: string[];
    }, {
        default?: "allow" | "ask" | "deny" | undefined;
        allowed_domains?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    filesystem: {
        read: "allow" | "ask" | "deny";
        write: {
            workspace: "allow" | "ask" | "deny";
            outside_workspace: "allow" | "ask" | "deny";
        };
        delete: {
            workspace: "allow" | "ask" | "deny";
            outside_workspace: "allow" | "ask" | "deny";
        };
    };
    shell: {
        safe: "allow" | "ask" | "deny";
        destructive: "allow" | "ask" | "deny";
        privileged: "allow" | "ask" | "deny";
    };
    network: {
        default: "allow" | "ask" | "deny";
        allowed_domains: string[];
    };
}, {
    filesystem?: {
        read?: "allow" | "ask" | "deny" | undefined;
        write?: {
            workspace?: "allow" | "ask" | "deny" | undefined;
            outside_workspace?: "allow" | "ask" | "deny" | undefined;
        } | undefined;
        delete?: {
            workspace?: "allow" | "ask" | "deny" | undefined;
            outside_workspace?: "allow" | "ask" | "deny" | undefined;
        } | undefined;
    } | undefined;
    shell?: {
        safe?: "allow" | "ask" | "deny" | undefined;
        destructive?: "allow" | "ask" | "deny" | undefined;
        privileged?: "allow" | "ask" | "deny" | undefined;
    } | undefined;
    network?: {
        default?: "allow" | "ask" | "deny" | undefined;
        allowed_domains?: string[] | undefined;
    } | undefined;
}>;
export declare const BerkeliumConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodNumber>;
    default_model: z.ZodDefault<z.ZodString>;
    routing: z.ZodDefault<z.ZodObject<{
        primary: z.ZodDefault<z.ZodString>;
        fallback: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        primary: string;
        fallback: string[];
    }, {
        primary?: string | undefined;
        fallback?: string[] | undefined;
    }>>;
    models: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        provider: z.ZodString;
        model: z.ZodString;
        context_length: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        max_tokens: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        model: string;
        context_length?: number | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    }, {
        provider: string;
        model: string;
        context_length?: number | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    }>>>;
    providers: z.ZodDefault<z.ZodObject<{
        openrouter: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            base_url: z.ZodOptional<z.ZodString>;
            api_key: z.ZodOptional<z.ZodString>;
            models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        }>>;
        nvidia: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            base_url: z.ZodOptional<z.ZodString>;
            api_key: z.ZodOptional<z.ZodString>;
            models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        }>>;
        gemini: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            base_url: z.ZodOptional<z.ZodString>;
            api_key: z.ZodOptional<z.ZodString>;
            models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        }>>;
        huggingface: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            base_url: z.ZodOptional<z.ZodString>;
            api_key: z.ZodOptional<z.ZodString>;
            models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        }>>;
        groq: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            base_url: z.ZodOptional<z.ZodString>;
            api_key: z.ZodOptional<z.ZodString>;
            models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        }>>;
        ollama: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            base_url: z.ZodOptional<z.ZodString>;
            api_key: z.ZodOptional<z.ZodString>;
            models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        }>>;
        lmstudio: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            base_url: z.ZodOptional<z.ZodString>;
            api_key: z.ZodOptional<z.ZodString>;
            models: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            timeout_ms: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        }, {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        openrouter: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        ollama: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        lmstudio: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        nvidia: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        groq: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        gemini: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        huggingface: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
    }, {
        openrouter?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        ollama?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        lmstudio?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        nvidia?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        groq?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        gemini?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        huggingface?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
    }>>;
    agent: z.ZodDefault<z.ZodObject<{
        max_iterations: z.ZodDefault<z.ZodNumber>;
        max_tool_retries: z.ZodDefault<z.ZodNumber>;
        auto_compact: z.ZodDefault<z.ZodBoolean>;
        verify_changes: z.ZodDefault<z.ZodBoolean>;
        timeout_seconds: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        max_iterations: number;
        max_tool_retries: number;
        auto_compact: boolean;
        verify_changes: boolean;
        timeout_seconds: number;
    }, {
        max_iterations?: number | undefined;
        max_tool_retries?: number | undefined;
        auto_compact?: boolean | undefined;
        verify_changes?: boolean | undefined;
        timeout_seconds?: number | undefined;
    }>>;
    tools: z.ZodDefault<z.ZodObject<{
        shell: z.ZodDefault<z.ZodBoolean>;
        filesystem: z.ZodDefault<z.ZodBoolean>;
        git: z.ZodDefault<z.ZodBoolean>;
        web: z.ZodDefault<z.ZodBoolean>;
        diagnostics: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        filesystem: boolean;
        shell: boolean;
        git: boolean;
        web: boolean;
        diagnostics: boolean;
    }, {
        filesystem?: boolean | undefined;
        shell?: boolean | undefined;
        git?: boolean | undefined;
        web?: boolean | undefined;
        diagnostics?: boolean | undefined;
    }>>;
    permissions: z.ZodDefault<z.ZodObject<{
        filesystem: z.ZodDefault<z.ZodObject<{
            read: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            write: z.ZodDefault<z.ZodObject<{
                workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
                outside_workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            }, "strip", z.ZodTypeAny, {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            }, {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            }>>;
            delete: z.ZodDefault<z.ZodObject<{
                workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
                outside_workspace: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            }, "strip", z.ZodTypeAny, {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            }, {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            read: "allow" | "ask" | "deny";
            write: {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            };
            delete: {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            };
        }, {
            read?: "allow" | "ask" | "deny" | undefined;
            write?: {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            } | undefined;
            delete?: {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            } | undefined;
        }>>;
        shell: z.ZodDefault<z.ZodObject<{
            safe: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            destructive: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            privileged: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
        }, "strip", z.ZodTypeAny, {
            safe: "allow" | "ask" | "deny";
            destructive: "allow" | "ask" | "deny";
            privileged: "allow" | "ask" | "deny";
        }, {
            safe?: "allow" | "ask" | "deny" | undefined;
            destructive?: "allow" | "ask" | "deny" | undefined;
            privileged?: "allow" | "ask" | "deny" | undefined;
        }>>;
        network: z.ZodDefault<z.ZodObject<{
            default: z.ZodDefault<z.ZodEnum<["allow", "ask", "deny"]>>;
            allowed_domains: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            default: "allow" | "ask" | "deny";
            allowed_domains: string[];
        }, {
            default?: "allow" | "ask" | "deny" | undefined;
            allowed_domains?: string[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        filesystem: {
            read: "allow" | "ask" | "deny";
            write: {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            };
            delete: {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            };
        };
        shell: {
            safe: "allow" | "ask" | "deny";
            destructive: "allow" | "ask" | "deny";
            privileged: "allow" | "ask" | "deny";
        };
        network: {
            default: "allow" | "ask" | "deny";
            allowed_domains: string[];
        };
    }, {
        filesystem?: {
            read?: "allow" | "ask" | "deny" | undefined;
            write?: {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            } | undefined;
            delete?: {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            } | undefined;
        } | undefined;
        shell?: {
            safe?: "allow" | "ask" | "deny" | undefined;
            destructive?: "allow" | "ask" | "deny" | undefined;
            privileged?: "allow" | "ask" | "deny" | undefined;
        } | undefined;
        network?: {
            default?: "allow" | "ask" | "deny" | undefined;
            allowed_domains?: string[] | undefined;
        } | undefined;
    }>>;
    theme: z.ZodDefault<z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name?: string | undefined;
    }>>;
    ui: z.ZodDefault<z.ZodObject<{
        launch_animation: z.ZodDefault<z.ZodBoolean>;
        launch_animation_duration_ms: z.ZodDefault<z.ZodNumber>;
        launch_matrix: z.ZodDefault<z.ZodBoolean>;
        hackathon_mode: z.ZodDefault<z.ZodBoolean>;
        density: z.ZodDefault<z.ZodEnum<["compact", "normal", "relaxed"]>>;
        unicode: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        launch_animation: boolean;
        launch_animation_duration_ms: number;
        launch_matrix: boolean;
        hackathon_mode: boolean;
        density: "compact" | "normal" | "relaxed";
        unicode: boolean;
    }, {
        launch_animation?: boolean | undefined;
        launch_animation_duration_ms?: number | undefined;
        launch_matrix?: boolean | undefined;
        hackathon_mode?: boolean | undefined;
        density?: "compact" | "normal" | "relaxed" | undefined;
        unicode?: boolean | undefined;
    }>>;
    prompt: z.ZodDefault<z.ZodObject<{
        system: z.ZodOptional<z.ZodString>;
        identity: z.ZodOptional<z.ZodString>;
        behavior: z.ZodOptional<z.ZodString>;
        coding: z.ZodOptional<z.ZodString>;
        tools: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        coding?: string | undefined;
        tools?: string | undefined;
        system?: string | undefined;
        identity?: string | undefined;
        behavior?: string | undefined;
    }, {
        coding?: string | undefined;
        tools?: string | undefined;
        system?: string | undefined;
        identity?: string | undefined;
        behavior?: string | undefined;
    }>>;
    runtime: z.ZodDefault<z.ZodObject<{
        default: z.ZodDefault<z.ZodEnum<["mlx", "gguf", "cpu", "auto"]>>;
        mlx: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            python_path: z.ZodOptional<z.ZodString>;
            server_port: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            server_port: number;
            python_path?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            python_path?: string | undefined;
            server_port?: number | undefined;
        }>>;
        gguf: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            llama_server_path: z.ZodOptional<z.ZodString>;
            server_port: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            server_port: number;
            llama_server_path?: string | undefined;
        }, {
            enabled?: boolean | undefined;
            server_port?: number | undefined;
            llama_server_path?: string | undefined;
        }>>;
        cpu: z.ZodDefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
        }, {
            enabled?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        mlx: {
            enabled: boolean;
            server_port: number;
            python_path?: string | undefined;
        };
        gguf: {
            enabled: boolean;
            server_port: number;
            llama_server_path?: string | undefined;
        };
        cpu: {
            enabled: boolean;
        };
        default: "auto" | "mlx" | "gguf" | "cpu";
    }, {
        mlx?: {
            enabled?: boolean | undefined;
            python_path?: string | undefined;
            server_port?: number | undefined;
        } | undefined;
        gguf?: {
            enabled?: boolean | undefined;
            server_port?: number | undefined;
            llama_server_path?: string | undefined;
        } | undefined;
        cpu?: {
            enabled?: boolean | undefined;
        } | undefined;
        default?: "auto" | "mlx" | "gguf" | "cpu" | undefined;
    }>>;
    model_storage: z.ZodDefault<z.ZodObject<{
        models_dir: z.ZodOptional<z.ZodString>;
        max_storage_gb: z.ZodOptional<z.ZodNumber>;
        auto_prune: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        auto_prune: boolean;
        models_dir?: string | undefined;
        max_storage_gb?: number | undefined;
    }, {
        models_dir?: string | undefined;
        max_storage_gb?: number | undefined;
        auto_prune?: boolean | undefined;
    }>>;
    privacy: z.ZodDefault<z.ZodObject<{
        mode: z.ZodDefault<z.ZodEnum<["local", "balanced", "hybrid", "cloud"]>>;
        cloud_escalation_prompt: z.ZodDefault<z.ZodBoolean>;
        sensitive_patterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        mode: "local" | "cloud" | "hybrid" | "balanced";
        cloud_escalation_prompt: boolean;
        sensitive_patterns: string[];
    }, {
        mode?: "local" | "cloud" | "hybrid" | "balanced" | undefined;
        cloud_escalation_prompt?: boolean | undefined;
        sensitive_patterns?: string[] | undefined;
    }>>;
    cost: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        session_budget_usd: z.ZodOptional<z.ZodNumber>;
        daily_budget_usd: z.ZodOptional<z.ZodNumber>;
        monthly_budget_usd: z.ZodOptional<z.ZodNumber>;
        max_tokens_per_request: z.ZodOptional<z.ZodNumber>;
        warn_threshold_percent: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        warn_threshold_percent: number;
        session_budget_usd?: number | undefined;
        daily_budget_usd?: number | undefined;
        monthly_budget_usd?: number | undefined;
        max_tokens_per_request?: number | undefined;
    }, {
        enabled?: boolean | undefined;
        session_budget_usd?: number | undefined;
        daily_budget_usd?: number | undefined;
        monthly_budget_usd?: number | undefined;
        max_tokens_per_request?: number | undefined;
        warn_threshold_percent?: number | undefined;
    }>>;
    cloud: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        default_provider: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        default_provider?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        default_provider?: string | undefined;
    }>>;
    mode: z.ZodDefault<z.ZodEnum<["local", "cloud", "hybrid", "auto"]>>;
}, "strip", z.ZodTypeAny, {
    cloud: {
        enabled: boolean;
        default_provider?: string | undefined;
    };
    mode: "local" | "cloud" | "hybrid" | "auto";
    models: Record<string, {
        provider: string;
        model: string;
        context_length?: number | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    }>;
    version: number;
    default_model: string;
    routing: {
        primary: string;
        fallback: string[];
    };
    providers: {
        openrouter: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        ollama: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        lmstudio: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        nvidia: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        groq: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        gemini: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
        huggingface: {
            enabled: boolean;
            timeout_ms: number;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
        };
    };
    agent: {
        max_iterations: number;
        max_tool_retries: number;
        auto_compact: boolean;
        verify_changes: boolean;
        timeout_seconds: number;
    };
    tools: {
        filesystem: boolean;
        shell: boolean;
        git: boolean;
        web: boolean;
        diagnostics: boolean;
    };
    permissions: {
        filesystem: {
            read: "allow" | "ask" | "deny";
            write: {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            };
            delete: {
                workspace: "allow" | "ask" | "deny";
                outside_workspace: "allow" | "ask" | "deny";
            };
        };
        shell: {
            safe: "allow" | "ask" | "deny";
            destructive: "allow" | "ask" | "deny";
            privileged: "allow" | "ask" | "deny";
        };
        network: {
            default: "allow" | "ask" | "deny";
            allowed_domains: string[];
        };
    };
    theme: {
        name: string;
    };
    ui: {
        launch_animation: boolean;
        launch_animation_duration_ms: number;
        launch_matrix: boolean;
        hackathon_mode: boolean;
        density: "compact" | "normal" | "relaxed";
        unicode: boolean;
    };
    prompt: {
        coding?: string | undefined;
        tools?: string | undefined;
        system?: string | undefined;
        identity?: string | undefined;
        behavior?: string | undefined;
    };
    runtime: {
        mlx: {
            enabled: boolean;
            server_port: number;
            python_path?: string | undefined;
        };
        gguf: {
            enabled: boolean;
            server_port: number;
            llama_server_path?: string | undefined;
        };
        cpu: {
            enabled: boolean;
        };
        default: "auto" | "mlx" | "gguf" | "cpu";
    };
    model_storage: {
        auto_prune: boolean;
        models_dir?: string | undefined;
        max_storage_gb?: number | undefined;
    };
    privacy: {
        mode: "local" | "cloud" | "hybrid" | "balanced";
        cloud_escalation_prompt: boolean;
        sensitive_patterns: string[];
    };
    cost: {
        enabled: boolean;
        warn_threshold_percent: number;
        session_budget_usd?: number | undefined;
        daily_budget_usd?: number | undefined;
        monthly_budget_usd?: number | undefined;
        max_tokens_per_request?: number | undefined;
    };
}, {
    cloud?: {
        enabled?: boolean | undefined;
        default_provider?: string | undefined;
    } | undefined;
    mode?: "local" | "cloud" | "hybrid" | "auto" | undefined;
    models?: Record<string, {
        provider: string;
        model: string;
        context_length?: number | undefined;
        temperature?: number | undefined;
        max_tokens?: number | undefined;
    }> | undefined;
    version?: number | undefined;
    default_model?: string | undefined;
    routing?: {
        primary?: string | undefined;
        fallback?: string[] | undefined;
    } | undefined;
    providers?: {
        openrouter?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        ollama?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        lmstudio?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        nvidia?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        groq?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        gemini?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
        huggingface?: {
            enabled?: boolean | undefined;
            base_url?: string | undefined;
            api_key?: string | undefined;
            models?: string[] | undefined;
            timeout_ms?: number | undefined;
        } | undefined;
    } | undefined;
    agent?: {
        max_iterations?: number | undefined;
        max_tool_retries?: number | undefined;
        auto_compact?: boolean | undefined;
        verify_changes?: boolean | undefined;
        timeout_seconds?: number | undefined;
    } | undefined;
    tools?: {
        filesystem?: boolean | undefined;
        shell?: boolean | undefined;
        git?: boolean | undefined;
        web?: boolean | undefined;
        diagnostics?: boolean | undefined;
    } | undefined;
    permissions?: {
        filesystem?: {
            read?: "allow" | "ask" | "deny" | undefined;
            write?: {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            } | undefined;
            delete?: {
                workspace?: "allow" | "ask" | "deny" | undefined;
                outside_workspace?: "allow" | "ask" | "deny" | undefined;
            } | undefined;
        } | undefined;
        shell?: {
            safe?: "allow" | "ask" | "deny" | undefined;
            destructive?: "allow" | "ask" | "deny" | undefined;
            privileged?: "allow" | "ask" | "deny" | undefined;
        } | undefined;
        network?: {
            default?: "allow" | "ask" | "deny" | undefined;
            allowed_domains?: string[] | undefined;
        } | undefined;
    } | undefined;
    theme?: {
        name?: string | undefined;
    } | undefined;
    ui?: {
        launch_animation?: boolean | undefined;
        launch_animation_duration_ms?: number | undefined;
        launch_matrix?: boolean | undefined;
        hackathon_mode?: boolean | undefined;
        density?: "compact" | "normal" | "relaxed" | undefined;
        unicode?: boolean | undefined;
    } | undefined;
    prompt?: {
        coding?: string | undefined;
        tools?: string | undefined;
        system?: string | undefined;
        identity?: string | undefined;
        behavior?: string | undefined;
    } | undefined;
    runtime?: {
        mlx?: {
            enabled?: boolean | undefined;
            python_path?: string | undefined;
            server_port?: number | undefined;
        } | undefined;
        gguf?: {
            enabled?: boolean | undefined;
            server_port?: number | undefined;
            llama_server_path?: string | undefined;
        } | undefined;
        cpu?: {
            enabled?: boolean | undefined;
        } | undefined;
        default?: "auto" | "mlx" | "gguf" | "cpu" | undefined;
    } | undefined;
    model_storage?: {
        models_dir?: string | undefined;
        max_storage_gb?: number | undefined;
        auto_prune?: boolean | undefined;
    } | undefined;
    privacy?: {
        mode?: "local" | "cloud" | "hybrid" | "balanced" | undefined;
        cloud_escalation_prompt?: boolean | undefined;
        sensitive_patterns?: string[] | undefined;
    } | undefined;
    cost?: {
        enabled?: boolean | undefined;
        session_budget_usd?: number | undefined;
        daily_budget_usd?: number | undefined;
        monthly_budget_usd?: number | undefined;
        max_tokens_per_request?: number | undefined;
        warn_threshold_percent?: number | undefined;
    } | undefined;
}>;
export type BerkeliumConfig = z.infer<typeof BerkeliumConfigSchema>;
export type ModelAlias = z.infer<typeof ModelAliasSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>;
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;
export type ModelStorageConfig = z.infer<typeof ModelStorageConfigSchema>;
export type CostControlConfig = z.infer<typeof CostControlConfigSchema>;
export type PrivacyConfig = z.infer<typeof PrivacyConfigSchema>;
export type CloudConfig = z.infer<typeof CloudConfigSchema>;
export type RuntimeMode = z.infer<typeof RuntimeModeSchema>;
export type PrivacyMode = z.infer<typeof PrivacyModeSchema>;
//# sourceMappingURL=schema.d.ts.map