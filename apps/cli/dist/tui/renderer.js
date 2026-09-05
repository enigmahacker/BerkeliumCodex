export class TUIRenderer {
    themeManager;
    currentStreamLine = '';
    isInReasoning = false;
    hasActiveStream = false;
    constructor(themeManager) {
        this.themeManager = themeManager;
    }
    renderHeader(model, provider, workspace) {
        const fmt = this.themeManager.getFormatted();
        console.log();
        console.log(fmt.border('╭─ BERKELIUM ─────────────────────────────────────────────╮'));
        console.log(fmt.border('│ ') +
            fmt.bold(fmt.primary('MODEL   ')) +
            fmt.assistant(`${model} / ${provider}`).padEnd(46, ' ') +
            fmt.border('│'));
        console.log(fmt.border('│ ') +
            fmt.dimmed('WORKSPACE ') +
            fmt.muted(workspace.slice(-42)).padEnd(46, ' ') +
            fmt.border('│'));
        console.log(fmt.border('╰─────────────────────────────────────────────────────────╯'));
        console.log();
    }
    renderPromptSymbol() {
        const fmt = this.themeManager.getFormatted();
        return fmt.accent('berkelium') + fmt.dimmed(' > ');
    }
    flushStream() {
        if (this.hasActiveStream) {
            process.stdout.write('\n');
            this.hasActiveStream = false;
            this.currentStreamLine = '';
        }
    }
    handleEvent(event) {
        const fmt = this.themeManager.getFormatted();
        switch (event.type) {
            case 'message_started':
                this.flushStream();
                if (event.role === 'assistant') {
                    console.log();
                    console.log(fmt.assistant(fmt.bold('Berkelium:')));
                    this.currentStreamLine = '';
                }
                else if (event.role === 'user' && event.content) {
                    console.log();
                    console.log(fmt.user(fmt.bold('You:')));
                    console.log(event.content);
                }
                break;
            case 'token_received':
                process.stdout.write(event.token);
                this.currentStreamLine += event.token;
                this.hasActiveStream = true;
                break;
            case 'reasoning_token_received':
                if (!this.isInReasoning) {
                    this.isInReasoning = true;
                    console.log(fmt.dimmed('\n╭─ Thinking ──────────────────────────────────────────'));
                }
                process.stdout.write(fmt.dimmed(event.token));
                break;
            case 'reasoning_finished':
                if (this.isInReasoning) {
                    this.isInReasoning = false;
                    console.log(fmt.dimmed('\n╰─────────────────────────────────────────────────────\n'));
                }
                break;
            case 'tool_started':
                this.flushStream();
                console.log();
                console.log(fmt.border('  ● ') +
                    fmt.tool(`[${event.toolName}]`) +
                    fmt.dimmed(` ${JSON.stringify(event.args).slice(0, 70)}...`));
                break;
            case 'tool_completed':
                this.flushStream();
                console.log(fmt.success('  ✓ ') +
                    fmt.dimmed(`Completed ${event.toolName} in ${event.durationMs}ms`));
                break;
            case 'tool_failed':
                this.flushStream();
                console.log(fmt.error('  ✗ ') +
                    fmt.error(`Failed ${event.toolName}: ${event.error} (${event.durationMs}ms)`));
                break;
            case 'state_changed':
                if (event.description && !this.hasActiveStream) {
                    console.log(fmt.dimmed(`  ● ${event.description}`));
                }
                break;
            case 'permission_requested':
                this.flushStream();
                console.log();
                console.log(fmt.warning('  ⚠ Permission Required: ') + fmt.bold(event.action));
                console.log(fmt.dimmed(`    Target: ${event.target} (Risk: ${event.risk.toUpperCase()})`));
                break;
            case 'verification_started':
                this.flushStream();
                console.log();
                console.log(fmt.accent('  ● Starting autonomous verification pipeline...'));
                break;
            case 'verification_completed':
                this.flushStream();
                if (event.passed) {
                    console.log(fmt.success('  ✓ TASK COMPLETE: All verification criteria satisfied.'));
                }
                else {
                    console.log(fmt.warning('  ⚠ Verification issues detected. Initiating automated remediation...'));
                }
                break;
            case 'error':
                this.flushStream();
                console.log();
                console.log(fmt.error(`[Error] ${event.message}`));
                break;
        }
    }
    renderTelemetryBar(props) {
        this.flushStream();
        const fmt = this.themeManager.getFormatted();
        const usedK = (props.contextUsed / 1000).toFixed(1);
        const limitK = (props.contextLimit / 1000).toFixed(0);
        const timeStr = `${props.latencySeconds.toFixed(1)}s`;
        console.log();
        console.log(fmt.border('─'.repeat(60)));
        const parts = [
            `${fmt.dimmed('Model:')} ${fmt.assistant(props.model)}`,
            `${fmt.dimmed('Context:')} ${fmt.primary(`${usedK}k/${limitK}k`)}`,
            `${fmt.dimmed('Tokens:')} ${fmt.muted(props.totalTokens.toLocaleString())}`,
            `${fmt.dimmed('Latency:')} ${fmt.dimmed(timeStr)}`,
        ];
        if (props.hackathonMode) {
            parts.push(fmt.accent('⚡ HACKATHON'));
        }
        console.log(parts.join('  |  '));
        console.log(fmt.border('─'.repeat(60)));
        console.log();
    }
}
//# sourceMappingURL=renderer.js.map