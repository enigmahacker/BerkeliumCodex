import * as fs from 'node:fs';
import * as path from 'node:path';
export class CommandRegistry {
    static instance = null;
    commands = new Map();
    aliasMap = new Map();
    constructor() {
        this.registerBuiltIns();
    }
    static getInstance() {
        if (!CommandRegistry.instance) {
            CommandRegistry.instance = new CommandRegistry();
        }
        return CommandRegistry.instance;
    }
    register(def) {
        const cleanName = def.name.replace(/^\//, '').toLowerCase();
        const normalized = {
            ...def,
            name: cleanName,
            aliases: def.aliases?.map((a) => a.replace(/^\//, '').toLowerCase()) || [],
        };
        this.commands.set(cleanName, normalized);
        if (normalized.aliases) {
            for (const alias of normalized.aliases) {
                this.aliasMap.set(alias, cleanName);
            }
        }
    }
    unregister(name) {
        const clean = name.replace(/^\//, '').toLowerCase();
        const def = this.commands.get(clean);
        if (!def)
            return false;
        if (def.aliases) {
            for (const alias of def.aliases) {
                this.aliasMap.delete(alias);
            }
        }
        return this.commands.delete(clean);
    }
    get(nameOrAlias) {
        const clean = nameOrAlias.replace(/^\//, '').toLowerCase();
        if (this.commands.has(clean)) {
            return this.commands.get(clean);
        }
        const resolvedName = this.aliasMap.get(clean);
        if (resolvedName && this.commands.has(resolvedName)) {
            return this.commands.get(resolvedName);
        }
        return undefined;
    }
    list() {
        return Array.from(this.commands.values());
    }
    listByCategory(category) {
        const all = this.list();
        if (!category)
            return all;
        return all.filter((c) => c.category === category);
    }
    getCategories() {
        const set = new Set();
        for (const cmd of this.commands.values()) {
            set.add(cmd.category);
        }
        return Array.from(set);
    }
    loadCustomCommands(workspaceRoot) {
        const customDir = path.resolve(workspaceRoot, '.berkelium', 'commands');
        if (!fs.existsSync(customDir))
            return;
        try {
            const files = fs.readdirSync(customDir);
            for (const file of files) {
                if (!file.endsWith('.md'))
                    continue;
                const cmdName = path.basename(file, '.md').toLowerCase();
                const filePath = path.join(customDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                // Extract first line or description
                const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
                const firstLine = lines[0] || '';
                const description = firstLine.startsWith('#')
                    ? firstLine.replace(/^#+\s*/, '')
                    : `Custom workflow: ${cmdName}`;
                this.register({
                    name: cmdName,
                    description,
                    category: 'CUSTOM',
                    usage: `/${cmdName} [args]`,
                    examples: [`/${cmdName}`],
                    isCustom: true,
                    customPromptTemplate: content,
                    arguments: [
                        {
                            name: 'prompt',
                            description: 'Custom command arguments or context',
                            required: false,
                        },
                    ],
                });
            }
        }
        catch {
            // Ignore directory read issues
        }
    }
    registerPluginCommand(pluginName, def) {
        const cmdWithCategory = {
            ...def,
            category: def.category || 'CUSTOM',
            description: `[${pluginName}] ${def.description}`,
        };
        this.register(cmdWithCategory);
    }
    registerBuiltIns() {
        // 1. GENERAL
        this.register({
            name: 'help',
            aliases: ['?'],
            description: 'Display all slash commands and capabilities',
            category: 'GENERAL',
            usage: '/help [command]',
            examples: ['/help', '/help model'],
            arguments: [
                {
                    name: 'command',
                    description: 'Specific command name to inspect',
                    required: false,
                },
            ],
        });
        this.register({
            name: 'clear',
            aliases: ['cls'],
            description: 'Clear terminal screen',
            category: 'GENERAL',
            usage: '/clear',
            examples: ['/clear'],
        });
        this.register({
            name: 'reset',
            description: 'Reset current conversation session context',
            category: 'GENERAL',
            usage: '/reset',
            examples: ['/reset'],
        });
        this.register({
            name: 'quit',
            aliases: ['exit', 'q'],
            description: 'Exit Berkelium CLI',
            category: 'GENERAL',
            usage: '/quit',
            examples: ['/quit'],
        });
        // 2. MODEL
        this.register({
            name: 'model',
            aliases: ['m'],
            description: 'Change active model target or alias',
            category: 'MODEL',
            usage: '/model <model_name>',
            examples: ['/model coding', '/model ollama/qwen2.5:14b', '/model local'],
            arguments: [
                {
                    name: 'model_name',
                    description: 'Model alias or provider model ID',
                    required: true,
                    dynamicProvider: 'model',
                },
            ],
        });
        this.register({
            name: 'models',
            description: 'List discovered local and cloud models across providers',
            category: 'MODEL',
            usage: '/models',
            examples: ['/models'],
        });
        // 3. PROVIDERS
        this.register({
            name: 'provider',
            aliases: ['p'],
            description: 'Change active default provider',
            category: 'PROVIDERS',
            usage: '/provider <name>',
            examples: ['/provider openrouter', '/provider ollama', '/provider nvidia'],
            arguments: [
                {
                    name: 'provider_name',
                    description: 'Provider identifier',
                    required: true,
                    dynamicProvider: 'provider',
                },
            ],
        });
        this.register({
            name: 'providers',
            description: 'List supported model providers and endpoints',
            category: 'PROVIDERS',
            usage: '/providers',
            examples: ['/providers'],
        });
        this.register({
            name: 'auth',
            description: 'Manage API keys in Keychain / Vault',
            category: 'PROVIDERS',
            usage: '/auth [login|logout|status|providers]',
            examples: ['/auth status', '/auth login nvidia', '/auth logout openrouter'],
            arguments: [
                {
                    name: 'action',
                    description: 'Auth operation to execute',
                    required: false,
                    staticOptions: ['status', 'login', 'logout', 'providers'],
                },
                {
                    name: 'provider',
                    description: 'Provider name for login or logout',
                    required: false,
                    dynamicProvider: 'provider',
                },
            ],
        });
        // 4. CONTEXT
        this.register({
            name: 'context',
            aliases: ['ctx'],
            description: 'Inspect token budget breakdown & context utilization',
            category: 'CONTEXT',
            usage: '/context',
            examples: ['/context'],
        });
        this.register({
            name: 'compact',
            description: 'Losslessly compact conversation history and tokens',
            category: 'CONTEXT',
            usage: '/compact',
            examples: ['/compact'],
        });
        this.register({
            name: 'tokens',
            aliases: ['cost', 'token', 'economy'],
            description: 'Inspect real-time token savings, prompt cache hits & economy metrics',
            category: 'CONTEXT',
            usage: '/tokens',
            examples: ['/tokens', '/cost'],
        });
        // 5. TOOLS
        this.register({
            name: 'tools',
            aliases: ['t'],
            description: 'List all registered native tools & MCP servers',
            category: 'TOOLS',
            usage: '/tools [tool_name]',
            examples: ['/tools', '/tools read_file'],
            arguments: [
                {
                    name: 'tool_name',
                    description: 'Inspect specific tool schema',
                    required: false,
                    dynamicProvider: 'tool',
                },
            ],
        });
        // 6. AGENTS
        this.register({
            name: 'agents',
            aliases: ['subagents', 'agent'],
            description: 'Inspect and manage specialized subagents',
            category: 'AGENTS',
            usage: '/agents [agent_name]',
            examples: ['/agents', '/agents coder'],
            arguments: [
                {
                    name: 'agent_name',
                    description: 'Target subagent name',
                    required: false,
                    dynamicProvider: 'agent',
                },
            ],
        });
        // 7. CONFIGURATION
        this.register({
            name: 'config',
            aliases: ['cfg'],
            description: 'Inspect active hierarchical configuration',
            category: 'CONFIGURATION',
            usage: '/config',
            examples: ['/config'],
        });
        this.register({
            name: 'system',
            aliases: ['prompt'],
            description: 'Inspect & customize layered system prompt (text, file, Finder selector)',
            category: 'CONFIGURATION',
            usage: '/system [view|file|set|load|reset|export]',
            examples: [
                '/system view',
                '/system file',
                '/system file coding',
                '/system file custom ./prompt.txt',
                '/system set coding "..."',
                '/system reset',
            ],
            arguments: [
                {
                    name: 'action',
                    description: 'System prompt action',
                    required: false,
                    staticOptions: ['view', 'file', 'load', 'set', 'import', 'reset', 'export'],
                },
                {
                    name: 'layer',
                    description: 'Layer name to configure',
                    required: false,
                    dynamicProvider: 'system-layer',
                },
                {
                    name: 'path',
                    description: 'Optional file path (opens Finder selector if omitted)',
                    required: false,
                },
            ],
        });
        // 8. PERMISSIONS & SECURITY
        this.register({
            name: 'security',
            aliases: ['sec', 'guard'],
            description: 'Inspect security posture, sandbox protections, or run security audit',
            category: 'PERMISSIONS',
            usage: '/security [status|audit]',
            examples: ['/security', '/security audit'],
            arguments: [
                {
                    name: 'action',
                    description: 'Security operation',
                    required: false,
                    staticOptions: ['status', 'audit'],
                },
            ],
        });
        this.register({
            name: 'permissions',
            aliases: ['perms'],
            description: 'Inspect security & filesystem/shell policies',
            category: 'PERMISSIONS',
            usage: '/permissions',
            examples: ['/permissions'],
        });
        // 9. THEMES
        this.register({
            name: 'theme',
            description: 'Live-switch terminal color theme',
            category: 'THEMES',
            usage: '/theme [name]',
            examples: ['/theme matrix', '/theme dracula', '/theme nord'],
            arguments: [
                {
                    name: 'theme_name',
                    description: 'Theme name to activate',
                    required: false,
                    dynamicProvider: 'theme',
                },
            ],
        });
        this.register({
            name: 'matrix',
            description: 'Trigger live Matrix neural digital rain stream',
            category: 'THEMES',
            usage: '/matrix [theme]',
            examples: ['/matrix', '/matrix theme'],
        });
        // 10. GIT
        this.register({
            name: 'git',
            description: 'Show working tree git status',
            category: 'GIT',
            usage: '/git',
            examples: ['/git'],
        });
        this.register({
            name: 'diff',
            description: 'Show current git working diff',
            category: 'GIT',
            usage: '/diff',
            examples: ['/diff'],
        });
        this.register({
            name: 'commit',
            description: 'Create git commit with automated AI message',
            category: 'GIT',
            usage: '/commit [message]',
            examples: ['/commit', '/commit "feat: add user auth"'],
            arguments: [
                {
                    name: 'message',
                    description: 'Commit message',
                    required: false,
                },
            ],
        });
        // 11. SESSION
        this.register({
            name: 'session',
            description: 'Session management and persistence',
            category: 'SESSION',
            usage: '/session [list|resume|clear]',
            examples: ['/session list', '/session resume <id>'],
            arguments: [
                {
                    name: 'action',
                    description: 'Session operation',
                    required: false,
                    staticOptions: ['list', 'resume', 'clear'],
                    dynamicProvider: 'session',
                },
            ],
        });
        this.register({
            name: 'history',
            description: 'View session command and task history',
            category: 'SESSION',
            usage: '/history',
            examples: ['/history'],
        });
        // 12. DEVELOPMENT
        this.register({
            name: 'test',
            description: 'Run workspace test suite',
            category: 'DEVELOPMENT',
            usage: '/test [filter]',
            examples: ['/test', '/test auth'],
            arguments: [
                {
                    name: 'filter',
                    description: 'Filter test files or suite names',
                    required: false,
                },
            ],
        });
        this.register({
            name: 'build',
            description: 'Run workspace build scripts',
            category: 'DEVELOPMENT',
            usage: '/build',
            examples: ['/build'],
        });
        this.register({
            name: 'review',
            description: 'Ask Berkelium to review current changes',
            category: 'DEVELOPMENT',
            usage: '/review',
            examples: ['/review'],
        });
        this.register({
            name: 'fix',
            description: 'Diagnose failures and apply automated fixes',
            category: 'DEVELOPMENT',
            usage: '/fix [issue]',
            examples: ['/fix', '/fix "vitest build failure"'],
            arguments: [
                {
                    name: 'issue',
                    description: 'Specific issue or error description',
                    required: false,
                },
            ],
        });
        this.register({
            name: 'refactor',
            description: 'Refactor codebase architecture cleanly',
            category: 'DEVELOPMENT',
            usage: '/refactor [target]',
            examples: ['/refactor', '/refactor "auth middleware"'],
            arguments: [
                {
                    name: 'target',
                    description: 'Target component or pattern to refactor',
                    required: false,
                },
            ],
        });
        this.register({
            name: 'explain',
            description: 'Provide architectural walkthrough',
            category: 'DEVELOPMENT',
            usage: '/explain [topic]',
            examples: ['/explain', '/explain "state machine"'],
            arguments: [
                {
                    name: 'topic',
                    description: 'Codebase area or topic to explain',
                    required: false,
                },
            ],
        });
        // 13. SYSTEM
        this.register({
            name: 'status',
            description: 'View runtime state machine & telemetry stats',
            category: 'SYSTEM',
            usage: '/status',
            examples: ['/status'],
        });
        this.register({
            name: 'doctor',
            description: 'Diagnose local environment, providers & tools',
            category: 'SYSTEM',
            usage: '/doctor',
            examples: ['/doctor'],
        });
        this.register({
            name: 'version',
            aliases: ['v'],
            description: 'Show Berkelium CLI version and platform',
            category: 'SYSTEM',
            usage: '/version',
            examples: ['/version'],
        });
    }
}
//# sourceMappingURL=registry.js.map