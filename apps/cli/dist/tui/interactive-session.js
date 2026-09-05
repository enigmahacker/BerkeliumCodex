import * as readline from 'node:readline';
import { stripAnsi } from '@berkelium/themes';
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
    lastPopupHeight = 0;
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
        if (process.stdin.isTTY) {
            readline.emitKeypressEvents(process.stdin);
            if (process.stdin.setRawMode) {
                try {
                    process.stdin.setRawMode(true);
                }
                catch {
                    // Ignore raw mode error if unavailable
                }
            }
            process.stdin.resume();
            process.stdin.on('keypress', async (char, key) => {
                await this.handleTTYKeypress(char, key);
            });
            this.promptUser();
        }
        else {
            // Non-TTY / piped input fallback
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: false,
            });
            this.rl.on('line', async (line) => {
                const trimmed = line.trim();
                if (!trimmed)
                    return;
                await this.processInputLine(trimmed);
            });
        }
    }
    async handleTTYKeypress(char, key) {
        if (this.isProcessing) {
            // Handle Ctrl+C to cancel running task
            if (key?.ctrl && key?.name === 'c') {
                const fmt = this.themeManager.getFormatted();
                console.log(fmt.warning('\nCancelling current task...'));
                this.runtime.cancel();
                this.isProcessing = false;
                this.ctrlCCount = 0;
                this.promptUser();
            }
            return;
        }
        // Handle Ctrl+C when idle
        if (key?.ctrl && key?.name === 'c') {
            this.ctrlCCount++;
            const fmt = this.themeManager.getFormatted();
            // If user has text in buffer, first Ctrl+C just clears the buffer
            if (this.inputStateMachine.getBuffer().length > 0) {
                this.inputStateMachine.reset();
                this.ctrlCCount = 0;
                this.clearPopup();
                this.renderTTYPrompt([]);
                return;
            }
            if (this.ctrlCCount === 1) {
                this.clearPopup();
                process.stdout.write(fmt.dimmed('\nPress Ctrl+C again to exit Berkelium.\n'));
                setTimeout(() => {
                    this.ctrlCCount = 0;
                }, 1500);
                this.promptUser();
            }
            else {
                this.clearPopup();
                process.stdout.write(fmt.primary('\nGoodbye from Berkelium 🌌\n'));
                process.exit(0);
            }
            return;
        }
        // Handle Ctrl+L (Clear screen)
        if (key?.ctrl && key?.name === 'l') {
            process.stdout.write('\x1b[2J\x1b[H');
            const target = this.router.resolveTarget(this.runtime.getActiveModel());
            this.renderer.renderHeader(this.runtime.getActiveModel(), target.provider.name, this.configManager.getWorkspaceRoot());
            this.lastPopupHeight = 0;
            this.renderCurrentState();
            return;
        }
        // Delegate to InputStateMachine
        const res = await this.inputStateMachine.handleKeypress(char, key);
        if (res.submittedInput !== undefined) {
            const submitted = res.submittedInput;
            this.clearPopup();
            const promptSymbol = this.renderer.renderPromptSymbol();
            process.stdout.write('\r\x1b[2K' + promptSymbol + submitted + '\n');
            if (submitted.trim()) {
                await this.processInputLine(submitted.trim());
            }
            else {
                this.promptUser();
            }
            return;
        }
        this.renderCurrentState(res);
    }
    renderCurrentState(res) {
        if (this.isProcessing)
            return;
        let paletteLines = [];
        const mode = res ? res.mode : this.inputStateMachine.getMode();
        const shouldRender = res ? res.shouldRenderPalette : false;
        if (shouldRender) {
            if (mode === 'SlashCommand' && res?.commandMatches) {
                paletteLines = this.paletteRenderer.renderCommandSuggestions(res.commandMatches, res.selectedIndex, res.scrollOffset, res.buffer);
            }
            else if (mode === 'SlashArgument' && res?.activeCommand) {
                const parts = res.buffer.trimStart().split(/\s+/);
                const argQuery = parts.slice(1).join(' ');
                const argName = res.activeCommand.arguments?.[0]?.name || 'option';
                paletteLines = this.paletteRenderer.renderArgumentSuggestions(res.activeCommand.name, argName, res.argumentMatches, res.selectedIndex, res.scrollOffset, argQuery);
            }
        }
        this.renderTTYPrompt(paletteLines);
    }
    renderTTYPrompt(paletteLines = []) {
        if (this.isProcessing)
            return;
        const promptSymbol = this.renderer.renderPromptSymbol();
        const promptLen = stripAnsi(promptSymbol).length;
        const buffer = this.inputStateMachine.getBuffer();
        const cursorPos = this.inputStateMachine.getCursorPosition();
        // 1. Move to column 0, clear prompt line, write prompt and input buffer
        let out = '\r\x1b[2K' + promptSymbol + buffer;
        // 2. Render popup box directly below prompt line
        if (paletteLines.length > 0) {
            for (const line of paletteLines) {
                out += '\n\x1b[2K' + line;
            }
            // If previous popup had more lines, clear the remaining bottom lines
            if (this.lastPopupHeight > paletteLines.length) {
                const diff = this.lastPopupHeight - paletteLines.length;
                for (let i = 0; i < diff; i++) {
                    out += '\n\x1b[2K';
                }
                out += `\x1b[${diff}A`;
            }
            // Move cursor back UP to prompt line
            out += `\x1b[${paletteLines.length}A`;
            // Position cursor at exact column on prompt line
            out += `\x1b[${promptLen + cursorPos + 1}G`;
            this.lastPopupHeight = paletteLines.length;
        }
        else {
            // Clear previous popup lines below if any
            if (this.lastPopupHeight > 0) {
                for (let i = 0; i < this.lastPopupHeight; i++) {
                    out += '\n\x1b[2K';
                }
                out += `\x1b[${this.lastPopupHeight}A`;
                this.lastPopupHeight = 0;
            }
            out += `\x1b[${promptLen + cursorPos + 1}G`;
        }
        process.stdout.write(out);
    }
    clearPopup() {
        if (this.lastPopupHeight > 0) {
            let clearOut = '';
            for (let i = 0; i < this.lastPopupHeight; i++) {
                clearOut += '\n\x1b[2K';
            }
            clearOut += `\x1b[${this.lastPopupHeight}A`;
            this.lastPopupHeight = 0;
            process.stdout.write(clearOut);
        }
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
        // 2. Check for explicit slash command or exact standalone utility command
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
        if (input.startsWith('AIzaSy') || (input.startsWith('AIza') && input.length >= 35))
            return 'gemini';
        if (input.startsWith('gsk_'))
            return 'groq';
        if (input.startsWith('hf_'))
            return 'huggingface';
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
        // Only format standalone single-word utility commands without slash
        const standaloneKeywords = [
            'help',
            'clear',
            'cls',
            'reset',
            'doctor',
            'models',
            'providers',
            'matrix',
            'version',
            'status',
            'quit',
            'exit',
            'q',
        ];
        const lower = input.toLowerCase();
        if (standaloneKeywords.includes(lower)) {
            return '/' + lower;
        }
        return null;
    }
    promptUser() {
        this.inputStateMachine.reset();
        this.lastPopupHeight = 0;
        if (process.stdin.isTTY) {
            this.renderTTYPrompt([]);
        }
        else if (this.rl) {
            this.rl.setPrompt(this.renderer.renderPromptSymbol());
            this.rl.prompt();
        }
    }
}
//# sourceMappingURL=interactive-session.js.map