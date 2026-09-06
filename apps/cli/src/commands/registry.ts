import * as fs from 'node:fs';
import * as path from 'node:path';
import { CommandDefinition, CommandCategory } from './types.js';

export class CommandRegistry {
  private static instance: CommandRegistry | null = null;
  private commands: Map<string, CommandDefinition> = new Map();
  private aliasMap: Map<string, string> = new Map();

  constructor() {
    this.registerBuiltIns();
  }

  public static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  public register(def: CommandDefinition): void {
    const cleanName = def.name.replace(/^\//, '').toLowerCase();
    const normalized: CommandDefinition = {
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

  public unregister(name: string): boolean {
    const clean = name.replace(/^\//, '').toLowerCase();
    const def = this.commands.get(clean);
    if (!def) return false;

    if (def.aliases) {
      for (const alias of def.aliases) {
        this.aliasMap.delete(alias);
      }
    }
    return this.commands.delete(clean);
  }

  public get(nameOrAlias: string): CommandDefinition | undefined {
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

  public list(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  public listByCategory(category?: CommandCategory): CommandDefinition[] {
    const all = this.list();
    if (!category) return all;
    return all.filter((c) => c.category === category);
  }

  public getCategories(): CommandCategory[] {
    const set = new Set<CommandCategory>();
    for (const cmd of this.commands.values()) {
      set.add(cmd.category);
    }
    return Array.from(set);
  }

  public loadCustomCommands(workspaceRoot: string): void {
    const customDir = path.resolve(workspaceRoot, '.berkelium', 'commands');
    if (!fs.existsSync(customDir)) return;

    try {
      const files = fs.readdirSync(customDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
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
    } catch {
      // Ignore directory read issues
    }
  }

  public registerPluginCommand(pluginName: string, def: CommandDefinition): void {
    const cmdWithCategory: CommandDefinition = {
      ...def,
      category: def.category || 'CUSTOM',
      description: `[${pluginName}] ${def.description}`,
    };
    this.register(cmdWithCategory);
  }

  private registerBuiltIns(): void {
    // 0. NAVIGATION
    this.register({
      name: 'pwd',
      description: 'Print current working directory, repository name, branch, and project stack',
      category: 'NAVIGATION',
      usage: '/pwd',
      examples: ['/pwd'],
    });

    this.register({
      name: 'ls',
      aliases: ['dir'],
      description: 'List files and subdirectories with sizes, types, and counts',
      category: 'NAVIGATION',
      usage: '/ls [path]',
      examples: ['/ls', '/ls src', '/ls packages'],
      arguments: [
        {
          name: 'path',
          description: 'Subdirectory path to inspect',
          required: false,
        },
      ],
    });

    this.register({
      name: 'cd',
      description: 'Safely change working directory, refresh repository intelligence & detect Git root',
      category: 'NAVIGATION',
      usage: '/cd <path>',
      examples: ['/cd ..', '/cd packages/agent', '/cd ~/Projects/app'],
      arguments: [
        {
          name: 'path',
          description: 'Target directory path',
          required: true,
        },
      ],
    });

    // 1. GENERAL
    this.register({
      name: 'stop',
      aliases: ['cancel', 'abort'],
      description: 'Stop active model generation, cancel queued work, and terminate running child processes',
      category: 'GENERAL',
      usage: '/stop',
      examples: ['/stop'],
    });

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

    this.register({
      name: 'cloud',
      description: 'Manage cloud providers, login credentials, and usage',
      category: 'PROVIDERS',
      usage: '/cloud [providers|models|login|logout|status|usage|use]',
      examples: ['/cloud providers', '/cloud login openrouter', '/cloud status'],
      arguments: [
        {
          name: 'action',
          description: 'Cloud action',
          required: false,
          staticOptions: ['providers', 'models', 'login', 'logout', 'status', 'usage', 'use'],
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

    this.register({
      name: 'search',
      aliases: ['find'],
      description: 'Search codebase symbols, functions, and text',
      category: 'CONTEXT',
      usage: '/search <query>',
      examples: ['/search AuthStore', '/search "handleKeypress"'],
      arguments: [
        {
          name: 'query',
          description: 'Symbol or search query',
          required: true,
        },
      ],
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

    this.register({
      name: 'tasks',
      aliases: ['jobs', 'bg'],
      description: 'List or manage active background tasks and processes',
      category: 'TOOLS',
      usage: '/tasks [list|stop <id>]',
      examples: ['/tasks', '/tasks stop #1'],
      arguments: [
        {
          name: 'action',
          description: 'Task operation (list, stop)',
          required: false,
          staticOptions: ['list', 'stop'],
        },
      ],
    });

    this.register({
      name: 'background',
      description: 'Run long-running operation in the background without blocking interactive session',
      category: 'TOOLS',
      usage: '/background <command>',
      examples: ['/background npm test', '/background cargo build'],
      arguments: [
        {
          name: 'command',
          description: 'Shell command to run in background',
          required: true,
        },
      ],
    });

    this.register({
      name: 'network',
      description: 'Inspect or control outbound network access at the tool layer',
      category: 'TOOLS',
      usage: '/network [status|allow|deny]',
      examples: ['/network', '/network allow', '/network deny'],
      arguments: [
        {
          name: 'action',
          description: 'Network policy action (status, allow, deny)',
          required: false,
          staticOptions: ['status', 'allow', 'deny'],
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
      name: 'mode',
      description: 'Change runtime execution mode (local, cloud, hybrid, auto)',
      category: 'CONFIGURATION',
      usage: '/mode [local|cloud|hybrid|auto]',
      examples: ['/mode', '/mode hybrid', '/mode local'],
      arguments: [
        {
          name: 'target_mode',
          description: 'Runtime execution mode',
          required: false,
          staticOptions: ['local', 'cloud', 'hybrid', 'auto'],
        },
      ],
    });

    this.register({
      name: 'privacy',
      description: 'Inspect or change data privacy policy tier',
      category: 'CONFIGURATION',
      usage: '/privacy [local|balanced|hybrid|cloud]',
      examples: ['/privacy', '/privacy local', '/privacy balanced'],
      arguments: [
        {
          name: 'policy_tier',
          description: 'Privacy policy tier',
          required: false,
          staticOptions: ['local', 'balanced', 'hybrid', 'cloud'],
        },
      ],
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

    this.register({
      name: 'permission',
      description: 'Set permission level (ask, auto, full) or grant capability',
      category: 'PERMISSIONS',
      usage: '/permission [ask|auto|full]',
      examples: ['/permission ask', '/permission auto', '/permission full'],
      arguments: [
        {
          name: 'level',
          description: 'Permission level (ask, auto, full)',
          required: false,
          staticOptions: ['ask', 'auto', 'full'],
        },
      ],
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
      name: 'checkpoint',
      aliases: ['cp'],
      description: 'Create safe Git-aware snapshot of current working tree',
      category: 'GIT',
      usage: '/checkpoint [name]',
      examples: ['/checkpoint', '/checkpoint "before refactor"'],
      arguments: [
        {
          name: 'name',
          description: 'Optional label for checkpoint',
          required: false,
        },
      ],
    });

    this.register({
      name: 'checkpoints',
      description: 'List all saved Git checkpoints and snapshots',
      category: 'GIT',
      usage: '/checkpoints',
      examples: ['/checkpoints'],
    });

    this.register({
      name: 'restore',
      description: 'Safely restore working tree from a previous checkpoint',
      category: 'GIT',
      usage: '/restore [checkpoint_id]',
      examples: ['/restore', '/restore cp_1700000000_abc'],
      arguments: [
        {
          name: 'checkpoint_id',
          description: 'Checkpoint ID to restore',
          required: false,
        },
      ],
    });

    this.register({
      name: 'undo',
      description: 'Undo recent modifications by restoring the most recent checkpoint',
      category: 'GIT',
      usage: '/undo',
      examples: ['/undo'],
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
      name: 'mission',
      aliases: ['task', 'goal'],
      description: 'Autonomous goal execution decomposed into sequential verified subtasks with retry limits',
      category: 'DEVELOPMENT',
      usage: '/mission <goal>',
      examples: ['/mission Fix all failing tests', '/mission Refactor auth layer'],
      arguments: [
        {
          name: 'goal',
          description: 'High-level objective or mission goal',
          required: true,
        },
      ],
    });

    this.register({
      name: 'ask',
      description: 'Direct Q&A mode: ask questions, discuss architecture, without modifying files',
      category: 'DEVELOPMENT',
      usage: '/ask [question]',
      examples: ['/ask How does the permission engine work?'],
      arguments: [
        {
          name: 'question',
          description: 'Question or design topic',
          required: false,
        },
      ],
    });

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
      name: 'plan',
      description: 'Create an architectural implementation plan for a task',
      category: 'DEVELOPMENT',
      usage: '/plan <task>',
      examples: ['/plan "Implement caching layer"', '/plan "Refactor auth middleware"'],
      arguments: [
        {
          name: 'task',
          description: 'Task or feature to plan',
          required: true,
        },
      ],
    });

    this.register({
      name: 'debug',
      description: 'Debug an issue or inspect failure',
      category: 'DEVELOPMENT',
      usage: '/debug [issue]',
      examples: ['/debug "test failure in router"', '/debug'],
      arguments: [
        {
          name: 'issue',
          description: 'Failure description or error log',
          required: false,
        },
      ],
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
      name: 'scan',
      description: 'Deep project intelligence scan (files, AST, circular dependencies, Git, tests, security)',
      category: 'SYSTEM',
      usage: '/scan [project|deep|security|dependencies|git|tests]',
      examples: ['/scan', '/scan deep', '/scan security', '/scan tests'],
      arguments: [
        {
          name: 'type',
          description: 'Scan scope and analysis depth',
          required: false,
          staticOptions: ['project', 'deep', 'security', 'dependencies', 'git', 'tests'],
        },
      ],
    });

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
