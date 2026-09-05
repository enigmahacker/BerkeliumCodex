import * as readline from 'node:readline';
import { TUIRenderer } from './renderer.js';
import { SlashCommandHandler } from './slash-commands.js';
import { InputStateMachine } from './input-state-machine.js';
import { CommandPaletteRenderer } from './command-palette.js';
export class InteractiveSession {
    runtime;
    themeManager;
    renderer;
    slashHandler;
    configManager;
    router;
    orchestrator;
    contextEngine;
    authStore;
    hackathonMode;
    rl = null;
    isProcessing = false;
    ctrlCCount = 0;
    inputStateMachine;
    paletteRenderer;
    constructor(options) {
        this.runtime = options.runtime;
        this.themeManager = options.themeManager;
        this.renderer = new TUIRenderer(options.themeManager);
        this.configManager = options.configManager;
        this.router = options.router;
        this.orchestrator = options.orchestrator;
        this.contextEngine = options.contextEngine;
        this.authStore = options.authStore;
        this.hackathonMode = options.hackathonMode || false;
        const execContext = {
            runtime: this.runtime,
            themeManager: this.themeManager,
            configManager: this.configManager,
            router: this.router,
            orchestrator: this.orchestrator,
            contextEngine: this.contextEngine,
            authStore: this.authStore,
        };
        this.inputStateMachine = new InputStateMachine(execContext);
        this.paletteRenderer = new CommandPaletteRenderer({
            themeManager: this.themeManager,
            maxVisibleItems: 10,
        });
        this.slashHandler = new SlashCommandHandler(this.runtime, this.themeManager, this.configManager, this.router, this.orchestrator, this.contextEngine, this.authStore);
        // Subscribe renderer to all agent events
        options.eventBus.on('*', (event) => {
            this.renderer.handleEvent(event);
        });
    }
    async start() {
        const target = this.router.resolveTarget(this.runtime.getActiveModel());
        this.renderer.renderHeader(this.runtime.getActiveModel(), target.provider.name, this.configManager.getWorkspaceRoot());
        const isTTY = Boolean(process.stdin.isTTY);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: isTTY,
            prompt: this.renderer.renderPromptSymbol(),
            completer: (line) => {
                const completions = this.slashHandler.getCompletions(line);
                return [completions, line];
            },
        });
        this.setupKeybindings();
        this.promptUser();
    }
    setupKeybindings() {
        if (!this.rl)
            return;
        if (process.stdin.isTTY) {
            readline.emitKeypressEvents(process.stdin);
            if (process.stdin.setRawMode) {
                try {
                    process.stdin.setRawMode(true);
                }
                catch {
                    // Ignore raw mode errors in non-standard TTY
                }
            }
            process.stdin.on('keypress', async (char, key) => {
                if (this.isProcessing)
                    return;
                const res = await this.inputStateMachine.handleKeypress(char, key);
                if (res.cancelled) {
                    this.ctrlCCount = 0;
                    this.promptUser();
                    return;
                }
                if (res.submittedInput !== undefined) {
                    // Handled via on('line') or direct submission
                    if (res.submittedInput.trim()) {
                        await this.processInputLine(res.submittedInput);
                    }
                    else {
                        this.promptUser();
                    }
                    return;
                }
                if (res.shouldRenderPalette) {
                    // Update readline buffer
                    if (this.rl) {
                        this.rl.line = res.buffer;
                        this.rl.cursor = res.cursorPosition;
                    }
                    let paletteLines = [];
                    if (res.mode === 'SlashCommand') {
                        paletteLines = this.paletteRenderer.renderCommandSuggestions(res.commandMatches, res.selectedIndex, res.scrollOffset, res.buffer);
                    }
                    else if (res.mode === 'SlashArgument' && res.activeCommand) {
                        const parts = res.buffer.trimStart().split(/\s+/);
                        const argQuery = parts.slice(1).join(' ');
                        const argName = res.activeCommand.arguments?.[0]?.name || 'option';
                        paletteLines = this.paletteRenderer.renderArgumentSuggestions(res.activeCommand.name, argName, res.argumentMatches, res.selectedIndex, res.scrollOffset, argQuery);
                    }
                    if (paletteLines.length > 0) {
                        console.log();
                        for (const line of paletteLines) {
                            console.log(line);
                        }
                        if (this.rl) {
                            this.rl.prompt(true);
                        }
                    }
                }
                else {
                    // Normal mode buffer synchronization
                    if (this.rl && this.inputStateMachine.getMode() !== 'Normal') {
                        this.rl.line = res.buffer;
                        this.rl.cursor = res.cursorPosition;
                    }
                }
            });
        }
        // Handle Ctrl+C gracefully
        this.rl.on('SIGINT', () => {
            this.ctrlCCount++;
            const fmt = this.themeManager.getFormatted();
            if (this.isProcessing) {
                console.log(fmt.warning('\nCancelling current task...'));
                this.runtime.cancel();
                this.isProcessing = false;
                this.ctrlCCount = 0;
                this.promptUser();
            }
            else {
                if (this.ctrlCCount === 1) {
                    console.log(fmt.dimmed('\nPress Ctrl+C again to exit Berkelium.'));
                    setTimeout(() => {
                        this.ctrlCCount = 0;
                    }, 1500);
                    this.promptUser();
                }
                else {
                    console.log(fmt.primary('\nGoodbye from Berkelium 🌌'));
                    process.exit(0);
                }
            }
        });
        this.rl.on('line', async (line) => {
            if (this.isProcessing)
                return;
            const trimmed = line.trim();
            if (!trimmed) {
                this.promptUser();
                return;
            }
            await this.processInputLine(trimmed);
        });
    }
    async processInputLine(input) {
        const trimmed = input.trim();
        if (!trimmed) {
            this.promptUser();
            return;
        }
        this.ctrlCCount = 0;
        const fmt = this.themeManager.getFormatted();
        // 1. Auto-detect pasted API keys
        const detectedProvider = this.detectApiKeyProvider(trimmed);
        if (detectedProvider) {
            await this.authStore.setApiKey(detectedProvider, trimmed);
            console.log();
            console.log(fmt.success(`✓ Detected and registered ${detectedProvider.toUpperCase()} API key in macOS Keychain / Vault!`));
            console.log(fmt.dimmed(`  Provider "${detectedProvider}" is now authenticated. Ready to code!`));
            console.log();
            this.promptUser();
            return;
        }
        // 2. Check for slash command or alias without leading slash
        const slashFormatted = this.formatAsSlashCommand(trimmed);
        if (slashFormatted) {
            await this.slashHandler.handle(slashFormatted);
            this.promptUser();
            return;
        }
        // 3. Normal Autonomous Task Execution
        this.isProcessing = true;
        const start = performance.now();
        try {
            await this.runtime.executeTask(trimmed);
        }
        catch (err) {
            console.log(fmt.error(`\nTask error: ${err.message}`));
            // If an authentication error occurred, show helpful action hints
            if (err.message.includes('API key not found')) {
                console.log();
                console.log(fmt.warning('  Tip: You can authenticate by pasting your API key directly or typing:'));
                console.log(`    ${fmt.accent('/auth login <provider> <key>')}`);
                console.log();
                console.log(fmt.dimmed('  Or switch to a local model (no API key required):'));
                console.log(`    ${fmt.accent('/model ollama/qwen2.5:14b')} or ${fmt.accent('/models')}`);
                console.log();
            }
        }
        finally {
            this.renderer.flushStream();
            this.isProcessing = false;
            const durationSec = (performance.now() - start) / 1000;
            const stats = this.runtime.getTelemetry().getStats();
            const breakdown = await this.contextEngine.getBreakdown('System Prompt', []);
            this.renderer.renderTelemetryBar({
                model: this.runtime.getActiveModel(),
                provider: this.router.resolveTarget(this.runtime.getActiveModel()).provider.name,
                contextUsed: breakdown.totalTokens,
                contextLimit: breakdown.limit,
                totalTokens: stats.tokenUsage.totalTokens,
                latencySeconds: durationSec,
                hackathonMode: this.hackathonMode,
            });
            this.promptUser();
        }
    }
    detectApiKeyProvider(input) {
        if (input.startsWith('sk-or-v1-'))
            return 'openrouter';
        if (input.startsWith('nvapi-'))
            return 'nvidia';
        if (input.startsWith('sk-ant-'))
            return 'anthropic';
        if (input.startsWith('sk-proj-') || (input.startsWith('sk-') && input.length >= 40 && !input.includes(' '))) {
            return 'openai';
        }
        return null;
    }
    formatAsSlashCommand(input) {
        if (input.startsWith('/'))
            return input;
        const lower = input.toLowerCase();
        const slashKeywords = [
            'auth',
            'model',
            'models',
            'provider',
            'providers',
            'theme',
            'permissions',
            'context',
            'compact',
            'tools',
            'agents',
            'config',
            'system',
            'status',
            'matrix',
            'help',
            'clear',
            'reset',
            'session',
            'history',
            'doctor',
            'version',
            'git',
            'diff',
            'commit',
            'test',
            'build',
            'review',
            'fix',
            'refactor',
            'explain',
            'quit',
            'exit',
        ];
        const clean = input.replace(/^berkelium\s+/, '');
        const firstWord = clean.split(/\s+/)[0]?.toLowerCase();
        if (firstWord && slashKeywords.includes(firstWord)) {
            return '/' + clean;
        }
        return null;
    }
    promptUser() {
        if (this.rl) {
            this.inputStateMachine.reset();
            this.rl.setPrompt(this.renderer.renderPromptSymbol());
            this.rl.prompt();
        }
    }
}
//# sourceMappingURL=interactive-session.js.map