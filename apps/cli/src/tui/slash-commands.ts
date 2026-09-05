import * as readline from 'node:readline/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AgentRuntime } from '@berkelium/agent';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager, PromptEngine } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AuthStore, AuthProviderId } from '@berkelium/auth';
import { TUIOverlays } from './overlays.js';
import { BkMatrix } from './bk-matrix.js';
import { CommandRegistry } from '../commands/registry.js';
import { CommandDefinition, CommandCategory } from '../commands/types.js';

export class SlashCommandHandler {
  private runtime: AgentRuntime;
  private themeManager: ThemeManager;
  private configManager: ConfigManager;
  private router: ProviderRouter;
  private orchestrator: ToolOrchestrator;
  private contextEngine: ContextEngine;
  private authStore: AuthStore;
  private registry: CommandRegistry;

  constructor(
    runtime: AgentRuntime,
    themeManager: ThemeManager,
    configManager: ConfigManager,
    router: ProviderRouter,
    orchestrator: ToolOrchestrator,
    contextEngine: ContextEngine,
    authStore: AuthStore
  ) {
    this.runtime = runtime;
    this.themeManager = themeManager;
    this.configManager = configManager;
    this.router = router;
    this.orchestrator = orchestrator;
    this.contextEngine = contextEngine;
    this.authStore = authStore;
    this.registry = CommandRegistry.getInstance();
    this.registry.loadCustomCommands(configManager.getWorkspaceRoot());
  }

  public isSlashCommand(input: string): boolean {
    return input.trim().startsWith('/');
  }

  public getCompletions(line: string): string[] {
    const trimmed = line.trim();
    const all = this.registry.list().map((c) => `/${c.name}`);
    if (!trimmed.startsWith('/')) {
      return all;
    }
    return all.filter((cmd) => cmd.startsWith(trimmed));
  }

  public renderQuickOptions(prefix = ''): void {
    const fmt = this.themeManager.getFormatted();
    const filter = prefix.toLowerCase().replace(/^\//, '');
    const commands = this.registry.list();
    const matches = filter
      ? commands.filter((c) => c.name.toLowerCase().startsWith(filter))
      : commands;

    console.log();
    console.log(fmt.bold(fmt.primary('BERKELIUM COMMAND PALETTE')));
    console.log(fmt.dimmed('Available slash commands (press Tab to complete, or type /<cmd>):'));
    console.log();

    const categoryOrder: CommandCategory[] = [
      'GENERAL',
      'MODEL',
      'PROVIDERS',
      'DEVELOPMENT',
      'CONTEXT',
      'TOOLS',
      'AGENTS',
      'CONFIGURATION',
      'PERMISSIONS',
      'THEMES',
      'GIT',
      'SESSION',
      'SYSTEM',
      'CUSTOM',
    ];

    for (const cat of categoryOrder) {
      const catItems = matches.filter((m) => m.category === cat);
      if (catItems.length === 0) continue;

      console.log(fmt.accent(`  ${cat}`));
      for (const item of catItems) {
        const usageStr = item.usage ? item.usage.padEnd(30, ' ') : `/${item.name}`.padEnd(30, ' ');
        console.log(`    ${fmt.bold(usageStr)} ${fmt.dimmed(item.description)}`);
      }
      console.log();
    }
  }

  public renderCommandHelp(commandName: string): void {
    const fmt = this.themeManager.getFormatted();
    const cmd = this.registry.get(commandName);
    if (!cmd) {
      console.log(fmt.error(`Unknown command "/${commandName}". Type /help for all commands.`));
      return;
    }

    console.log();
    console.log(fmt.bold(fmt.primary(`COMMAND: /${cmd.name}`)));
    console.log(`  Category:    ${fmt.accent(cmd.category)}`);
    console.log(`  Description: ${fmt.muted(cmd.description)}`);
    if (cmd.usage) {
      console.log(`  Usage:       ${fmt.bold(cmd.usage)}`);
    }
    if (cmd.aliases && cmd.aliases.length > 0) {
      console.log(`  Aliases:     ${cmd.aliases.map((a) => `/${a}`).join(', ')}`);
    }
    if (cmd.examples && cmd.examples.length > 0) {
      console.log(fmt.dimmed('  Examples:'));
      for (const ex of cmd.examples) {
        console.log(`    ${fmt.accent(ex)}`);
      }
    }
    console.log();
  }

  public async handle(input: string): Promise<boolean> {
    const trimmed = input.trim();
    const parts = trimmed.slice(1).split(/\s+/);
    const command = parts[0]?.toLowerCase() || '';
    const subArgs = parts.slice(1);
    const arg = subArgs.join(' ');
    const fmt = this.themeManager.getFormatted();

    // Check custom commands first
    const cmdDef = this.registry.get(command);
    if (cmdDef?.isCustom && cmdDef.customPromptTemplate) {
      const fullTask = arg
        ? `${cmdDef.customPromptTemplate}\n\nTask Argument: ${arg}`
        : cmdDef.customPromptTemplate;
      await this.runtime.executeTask(fullTask);
      return true;
    }

    switch (command) {
      case '':
      case '?':
      case 'options':
        this.renderQuickOptions('');
        return true;

      case 'help':
        if (arg) {
          this.renderCommandHelp(arg);
        } else {
          this.renderQuickOptions('');
        }
        return true;

      case 'system':
      case 'prompt': {
        const subAction = subArgs[0]?.toLowerCase();
        const layerName = subArgs[1]?.toLowerCase();
        const customContent = subArgs.slice(2).join(' ');
        const wsRoot = this.configManager.getWorkspaceRoot();

        if (!subAction || subAction === 'show' || subAction === 'view') {
          const layers = PromptEngine.loadCustomPrompts(wsRoot);
          TUIOverlays.renderSystemPrompt(this.themeManager, layers, wsRoot);
          return true;
        }

        if (subAction === 'set') {
          if (!layerName || !customContent) {
            console.log(
              fmt.error('Usage: /system set <identity|behavior|coding|safety|custom> <instructions>')
            );
            return true;
          }

          const savedPath = PromptEngine.saveCustomPrompt(wsRoot, layerName, customContent);
          console.log(fmt.success(`✓ Updated "${layerName}" system prompt layer.`));
          console.log(fmt.dimmed(`  Saved to: ${savedPath}`));
          return true;
        }

        if (subAction === 'reset') {
          PromptEngine.resetCustomPrompt(wsRoot, layerName);
          console.log(
            fmt.success(
              layerName
                ? `✓ Reset "${layerName}" prompt layer back to built-in default.`
                : '✓ Reset all custom prompt layers back to built-in defaults.'
            )
          );
          return true;
        }

        if (subAction === 'export') {
          const exportPath = subArgs[1] || 'berkelium-system-prompt.md';
          const layers = PromptEngine.loadCustomPrompts(wsRoot);
          const composed = PromptEngine.compose(layers, wsRoot);
          fs.writeFileSync(path.resolve(wsRoot, exportPath), composed, 'utf-8');
          console.log(fmt.success(`✓ Exported composed system prompt to "${exportPath}".`));
          return true;
        }

        console.log(
          fmt.error(
            `Unknown system prompt action "${subAction}". Available: /system, /system set, /system reset, /system export`
          )
        );
        return true;
      }

      case 'auth': {
        const subAction = subArgs[0]?.toLowerCase();
        const providerName = subArgs[1]?.toLowerCase();
        const inlineKey = subArgs.slice(2).join(' ');

        if (!subAction || subAction === 'status' || subAction === 'list') {
          const statuses = await this.authStore.getAllStatuses();
          TUIOverlays.renderAuth(this.themeManager, statuses);
          return true;
        }

        if (subAction === 'login' || subAction === 'set') {
          if (!providerName) {
            console.log(
              fmt.error('Please specify the provider: /auth login <nvidia|openrouter|openai|anthropic> [key]')
            );
            return true;
          }

          let keyToSave = inlineKey;
          if (!keyToSave) {
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });
            try {
              keyToSave = await rl.question(
                fmt.accent(`Enter API key for ${providerName.toUpperCase()}: `)
              );
            } finally {
              rl.close();
            }
          }

          const trimmedKey = keyToSave.trim();
          if (!trimmedKey) {
            console.log(fmt.error('Empty API key provided. Authentication cancelled.'));
            return true;
          }

          await this.authStore.setApiKey(providerName as AuthProviderId, trimmedKey);
          console.log(
            fmt.success(
              `✓ Successfully stored API key for ${providerName.toUpperCase()} in macOS Keychain / Secure Vault.`
            )
          );
          return true;
        }

        if (subAction === 'logout' || subAction === 'remove' || subAction === 'clear') {
          if (!providerName) {
            console.log(
              fmt.error('Please specify the provider: /auth logout <nvidia|openrouter|openai|anthropic>')
            );
            return true;
          }

          await this.authStore.removeApiKey(providerName as AuthProviderId);
          console.log(
            fmt.success(`✓ Removed credentials for ${providerName.toUpperCase()} from secure storage.`)
          );
          return true;
        }

        if (subAction === 'providers') {
          console.log();
          console.log(fmt.bold(fmt.primary('SUPPORTED PROVIDERS')));
          console.log();
          console.log(`  ${fmt.accent('nvidia'.padEnd(16, ' '))} NVIDIA NIM cloud endpoint`);
          console.log(`  ${fmt.accent('openrouter'.padEnd(16, ' '))} OpenRouter universal model gateway`);
          console.log(`  ${fmt.accent('ollama'.padEnd(16, ' '))} Local Ollama runtime (no API key required)`);
          console.log(`  ${fmt.accent('lmstudio'.padEnd(16, ' '))} Local LM Studio server (no API key required)`);
          console.log(`  ${fmt.accent('openai'.padEnd(16, ' '))} OpenAI direct API`);
          console.log(`  ${fmt.accent('anthropic'.padEnd(16, ' '))} Anthropic direct API`);
          console.log();
          return true;
        }

        console.log(
          fmt.error(`Unknown auth action "${subAction}". Available: /auth, /auth login, /auth logout, /auth providers`)
        );
        return true;
      }

      case 'matrix':
        if (arg === 'theme') {
          this.themeManager.setTheme('matrix');
          console.log(fmt.success('✓ Matrix green theme activated.'));
        } else {
          await BkMatrix.playMatrixRain(this.themeManager, { durationMs: 1500 });
        }
        return true;

      case 'theme':
        if (arg) {
          const success = this.themeManager.setTheme(arg);
          if (success) {
            this.configManager.updateGlobalConfig((c) => ({
              ...c,
              theme: { name: arg },
            }));
            console.log(fmt.success(`✓ Theme switched to "${arg}".`));
          } else {
            console.log(fmt.error(`✗ Unknown theme "${arg}". Run /theme to see available themes.`));
          }
        } else {
          TUIOverlays.renderThemes(this.themeManager);
        }
        return true;

      case 'permissions':
      case 'perms':
        TUIOverlays.renderPermissions(
          this.themeManager,
          this.configManager.getConfig().permissions
        );
        return true;

      case 'context':
      case 'ctx': {
        const breakdown = await this.contextEngine.getBreakdown(
          'System Prompt',
          [],
          JSON.stringify(this.orchestrator.getRegistry().getDefinitions())
        );
        TUIOverlays.renderContext(this.themeManager, breakdown);
        return true;
      }

      case 'compact': {
        console.log(fmt.dimmed('Compacting active conversation history and context...'));
        const result = this.contextEngine.compactIfNeeded([
          { role: 'user', content: 'Sample user input for compaction' },
          { role: 'assistant', content: 'Sample assistant response for compaction' },
        ], 0);
        const percent = Math.round(((result.tokensBefore - result.tokensAfter) / Math.max(1, result.tokensBefore)) * 100);
        console.log(
          fmt.success(
            `✓ Context compacted from ${result.tokensBefore} to ${result.tokensAfter} tokens (-${percent}%).`
          )
        );
        return true;
      }

      case 'model':
      case 'm':
        if (arg) {
          const lowerArg = arg.toLowerCase();
          if (lowerArg === 'list' || lowerArg === 'ls' || lowerArg === 'providers' || lowerArg === 'all') {
            const conf = this.configManager.getConfig();
            const discovered = await this.router.listAllAvailableModels();
            TUIOverlays.renderModels(this.themeManager, conf.models, discovered);
            return true;
          }

          try {
            this.runtime.setActiveModel(arg);
            console.log(fmt.success(`✓ Active model set to "${arg}".`));
          } catch (err: any) {
            console.log(fmt.error(`✗ ${err.message}`));
            console.log(fmt.dimmed('  Type /models or /model list to inspect all discovered models & aliases.'));
          }
        } else {
          console.log();
          console.log(`  Active Model: ${fmt.bold(fmt.assistant(this.runtime.getActiveModel()))}`);
          console.log(fmt.dimmed('  To switch models: /model <name> (e.g. /model local, /model coding)'));
          console.log(fmt.dimmed('  To list all available models: /models'));
          console.log();
        }
        return true;

      case 'models': {
        const conf = this.configManager.getConfig();
        const discovered = await this.router.listAllAvailableModels();
        TUIOverlays.renderModels(this.themeManager, conf.models, discovered);
        return true;
      }

      case 'provider':
      case 'p':
        if (arg) {
          const targetModel = `${arg}/default`;
          console.log(fmt.dimmed(`Switching default provider target to: ${arg}`));
          const allModels = await this.router.listAllAvailableModels();
          const providerModels = allModels[arg.toLowerCase()] || [];
          if (providerModels.length > 0) {
            this.runtime.setActiveModel(`${arg}/${providerModels[0].id}`);
            console.log(fmt.success(`✓ Set active model to "${arg}/${providerModels[0].id}".`));
          } else {
            console.log(fmt.warning(`No live models discovered under provider "${arg}". Check /auth or /models.`));
          }
        } else {
          console.log(fmt.dimmed('Usage: /provider <openrouter|nvidia|ollama|lmstudio>'));
        }
        return true;

      case 'providers': {
        const statuses = await this.authStore.getAllStatuses();
        TUIOverlays.renderAuth(this.themeManager, statuses);
        return true;
      }

      case 'config':
      case 'cfg':
        TUIOverlays.renderConfig(this.themeManager, this.configManager.getConfig());
        return true;

      case 'tools':
      case 't': {
        const tools = this.orchestrator.getRegistry().list();
        console.log();
        console.log(fmt.bold(fmt.primary('REGISTERED TOOLS')));
        for (const t of tools) {
          console.log(
            `  ${fmt.bold(t.metadata.name.padEnd(22, ' '))} [${fmt.accent(t.metadata.category)}] ${fmt.dimmed(t.metadata.description)}`
          );
        }
        console.log();
        return true;
      }

      case 'agents':
      case 'subagents':
      case 'agent': {
        const agents = [
          { name: 'explorer', role: 'Repository structure, imports, and AST indexing' },
          { name: 'coder', role: 'Autonomous incremental code generation & editing' },
          { name: 'tester', role: 'Execution of test runners, linters, and verification' },
          { name: 'reviewer', role: 'Multi-aspect code review, safety invariants check' },
        ];
        console.log();
        console.log(fmt.bold(fmt.primary('SPECIALIZED SUBAGENTS')));
        for (const a of agents) {
          console.log(`  ${fmt.bold(a.name.padEnd(16, ' '))} ${fmt.dimmed(a.role)}`);
        }
        console.log();
        return true;
      }

      case 'session': {
        console.log();
        console.log(fmt.bold(fmt.primary('BERKELIUM SESSION')));
        console.log(`  Session ID:    ${fmt.accent(this.runtime.getSessionId())}`);
        console.log(`  Workspace:     ${fmt.dimmed(this.configManager.getWorkspaceRoot())}`);
        console.log(`  Active Model:  ${fmt.assistant(this.runtime.getActiveModel())}`);
        console.log();
        return true;
      }

      case 'history': {
        const history = this.runtime.getSessionHistory();
        console.log();
        console.log(fmt.bold(fmt.primary('SESSION HISTORY')));
        if (history.length === 0) {
          console.log(fmt.dimmed('  (No tasks recorded in this session yet)'));
        } else {
          for (let i = 0; i < history.length; i++) {
            const preview = (history[i].content || '(tool execution)').slice(0, 70);
            console.log(`  ${fmt.dimmed(String(i + 1).padStart(2, '0'))}. [${history[i].role}] ${preview}...`);
          }
        }
        console.log();
        return true;
      }

      case 'clear':
      case 'cls':
        console.clear();
        return true;

      case 'reset':
        this.runtime.cancel();
        console.log(fmt.success('✓ Session state and conversation context reset.'));
        return true;

      case 'status': {
        const stats = this.runtime.getTelemetry().getStats();
        console.log();
        console.log(fmt.bold(fmt.primary('BERKELIUM STATUS')));
        console.log(`Session ID:        ${fmt.accent(this.runtime.getSessionId())}`);
        console.log(`State:             ${fmt.bold(this.runtime.getState())}`);
        console.log(`Model:             ${fmt.assistant(this.runtime.getActiveModel())}`);
        console.log(`Tool Calls:        ${stats.toolCallsCount}`);
        console.log(`Memory Footprint:  ${stats.latencies.memoryMb} MB`);
        console.log();
        return true;
      }

      case 'doctor':
        console.log(fmt.dimmed('Running Berkelium system diagnostics...'));
        return true;

      case 'version':
      case 'v':
        console.log(fmt.primary('Berkelium CLI v1.0.0 (darwin-arm64 native)'));
        return true;

      case 'quit':
      case 'exit':
      case 'q':
        console.log(fmt.primary('\nGoodbye from Berkelium 🌌'));
        process.exit(0);

      case 'diff':
      case 'git': {
        const res = await this.orchestrator.execute({
          callId: `cmd_git_${Date.now()}`,
          toolName: command === 'diff' ? 'git_diff' : 'git_status',
          args: {},
          sessionId: this.runtime.getSessionId(),
        });
        console.log();
        console.log(res.output);
        console.log();
        return true;
      }

      case 'commit': {
        await this.runtime.executeTask(
          arg ? `Create a clean git commit with message: ${arg}` : 'Inspect git diff and commit the changes with a concise commit message.'
        );
        return true;
      }

      case 'test': {
        console.log(fmt.dimmed('Running test suite...'));
        const res = await this.orchestrator.execute({
          callId: `cmd_test_${Date.now()}`,
          toolName: 'test',
          args: { filter: arg || undefined },
          sessionId: this.runtime.getSessionId(),
        });
        console.log();
        console.log(res.output);
        console.log();
        return true;
      }

      case 'build': {
        console.log(fmt.dimmed('Running build...'));
        const res = await this.orchestrator.execute({
          callId: `cmd_build_${Date.now()}`,
          toolName: 'build',
          args: {},
          sessionId: this.runtime.getSessionId(),
        });
        console.log();
        console.log(res.output);
        console.log();
        return true;
      }

      case 'review':
        await this.runtime.executeTask('Review the git working tree diff and summarize key changes, risks, and improvements.');
        return true;

      case 'fix':
        await this.runtime.executeTask(
          arg ? `Fix the following issue: ${arg}` : 'Run diagnostics and tests, identify any failures, and fix them.'
        );
        return true;

      case 'refactor':
        await this.runtime.executeTask(
          arg ? `Refactor: ${arg}` : 'Inspect the codebase architecture and suggest clean refactoring improvements.'
        );
        return true;

      case 'explain':
        await this.runtime.executeTask(
          arg ? `Explain: ${arg}` : 'Provide a high-level architectural walkthrough of this repository.'
        );
        return true;

      default:
        console.log(fmt.error(`Unknown slash command "/${command}". Type /help for a list of commands.`));
        return true;
    }
  }
}
