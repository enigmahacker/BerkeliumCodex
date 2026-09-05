import { z } from 'zod';
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
}, "strip", z.ZodTypeAny, {
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
}, {
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
}>;
export type BerkeliumConfig = z.infer<typeof BerkeliumConfigSchema>;
export type ModelAlias = z.infer<typeof ModelAliasSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>;
//# sourceMappingURL=schema.d.ts.map