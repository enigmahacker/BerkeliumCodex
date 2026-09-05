import { PromptEngine } from '@berkelium/config';
export class TUIOverlays {
    static renderAuth(themeManager, statuses) {
        const fmt = themeManager.getFormatted();
        console.log();
        console.log(fmt.bold(fmt.primary('PROVIDER AUTHENTICATION MATRIX')));
        console.log(fmt.dimmed('Secure credential isolation (macOS Keychain & encrypted vault fallback)'));
        console.log();
        for (const s of statuses) {
            const icon = s.authenticated ? fmt.success('✓ ') : fmt.dimmed('○ ');
            const nameStr = fmt.bold(s.name.padEnd(14, ' '));
            const stateStr = s.authenticated ? fmt.success('AUTHENTICATED') : fmt.dimmed('NOT CONFIGURED');
            const srcStr = s.source !== 'none'
                ? fmt.dimmed(`[${s.source}${s.maskedKey ? ': ' + fmt.muted(s.maskedKey) : ''}]`)
                : '';
            console.log(`  ${icon}${nameStr} ${stateStr.padEnd(24, ' ')} ${srcStr}`);
        }
        console.log();
        console.log(fmt.dimmed('Registration & Management:'));
        console.log(`  ${fmt.accent('/auth login <provider> [key]')}  ${fmt.dimmed('Register API key into Keychain/Vault')}`);
        console.log(`  ${fmt.accent('/auth logout <provider>')}        ${fmt.dimmed('Remove provider credentials')}`);
        console.log(`  ${fmt.accent('/auth status')}                 ${fmt.dimmed('Inspect current authentication states')}`);
        console.log();
    }
    static renderSystemPrompt(themeManager, layers, workspaceRoot) {
        const fmt = themeManager.getFormatted();
        const composed = PromptEngine.compose(layers, workspaceRoot);
        console.log();
        console.log(fmt.bold(fmt.primary('ACTIVE SYSTEM PROMPT & LAYERS')));
        console.log(fmt.dimmed('Hierarchically composed prompt sent to active model'));
        console.log();
        const layerItems = [
            { name: 'identity', content: layers.identity, isCustom: Boolean(layers.identity) },
            { name: 'behavior', content: layers.behavior, isCustom: Boolean(layers.behavior) },
            { name: 'coding', content: layers.coding, isCustom: Boolean(layers.coding) },
            { name: 'safety', content: layers.safety, isCustom: Boolean(layers.safety) },
            { name: 'tools', content: layers.tools, isCustom: Boolean(layers.tools) },
            { name: 'custom / AGENTS.md', content: layers.custom, isCustom: Boolean(layers.custom) },
        ];
        console.log(fmt.accent('PROMPT LAYERS:'));
        for (const item of layerItems) {
            const statusStr = item.isCustom ? fmt.success('[Customized]') : fmt.dimmed('[Default]');
            const lenStr = item.content ? `${item.content.length} chars` : 'built-in template';
            console.log(`  • ${fmt.bold(item.name.padEnd(22, ' '))} ${statusStr.padEnd(20, ' ')} ${fmt.dimmed(lenStr)}`);
        }
        console.log();
        console.log(fmt.accent('COMPOSED SYSTEM PROMPT PREVIEW (First 25 lines):'));
        console.log(fmt.border('────────────────────────────────────────────────────────────'));
        const lines = composed.split('\n');
        for (let i = 0; i < Math.min(25, lines.length); i++) {
            const lineNum = String(i + 1).padStart(2, '0');
            console.log(`${fmt.dimmed(lineNum)} │ ${fmt.muted(lines[i])}`);
        }
        if (lines.length > 25) {
            console.log(`${fmt.dimmed('..')} │ ${fmt.dimmed(`... and ${lines.length - 25} more lines`)}`);
        }
        console.log(fmt.border('────────────────────────────────────────────────────────────'));
        console.log();
        console.log(fmt.dimmed('Commands:'));
        console.log(`  ${fmt.accent('/system set <layer> <text>')}    ${fmt.dimmed('Customize a prompt layer (e.g. /system set coding ...)')}`);
        console.log(`  ${fmt.accent('/system reset [layer]')}         ${fmt.dimmed('Reset prompt layer back to defaults')}`);
        console.log(`  ${fmt.accent('/system export [filepath]')}     ${fmt.dimmed('Export full composed prompt to file')}`);
        console.log();
    }
    static renderPermissions(themeManager, policy) {
        const fmt = themeManager.getFormatted();
        console.log();
        console.log(fmt.border('╭──────────── BERKELIUM PERMISSIONS ─────────────╮'));
        console.log(fmt.border('│                                                │'));
        console.log(fmt.border('│ ') + fmt.bold(fmt.primary('Filesystem')) + ' '.repeat(37) + fmt.border('│'));
        console.log(fmt.border('│                                                │'));
        console.log(fmt.border('│ ') + 'Read workspace'.padEnd(32, ' ') + fmt.success(policy.filesystem.read.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│ ') + 'Write workspace'.padEnd(32, ' ') + fmt.success(policy.filesystem.write.workspace.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│ ') + 'Delete workspace'.padEnd(32, ' ') + fmt.warning(policy.filesystem.delete.workspace.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│ ') + 'Outside workspace'.padEnd(32, ' ') + fmt.error(policy.filesystem.write.outside_workspace.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│                                                │'));
        console.log(fmt.border('│ ') + fmt.bold(fmt.primary('Shell')) + ' '.repeat(42) + fmt.border('│'));
        console.log(fmt.border('│ ') + 'Safe commands'.padEnd(32, ' ') + fmt.success(policy.shell.safe.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│ ') + 'Destructive commands'.padEnd(32, ' ') + fmt.warning(policy.shell.destructive.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│ ') + 'Privileged commands'.padEnd(32, ' ') + fmt.error(policy.shell.privileged.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│                                                │'));
        console.log(fmt.border('│ ') + fmt.bold(fmt.primary('Network')) + ' '.repeat(40) + fmt.border('│'));
        console.log(fmt.border('│ ') + 'HTTP requests'.padEnd(32, ' ') + fmt.warning(policy.network.default.toUpperCase().padEnd(13, ' ')) + fmt.border('│'));
        console.log(fmt.border('│                                                │'));
        console.log(fmt.border('╰────────────────────────────────────────────────╯'));
        console.log();
    }
    static renderContext(themeManager, bd) {
        const fmt = themeManager.getFormatted();
        console.log();
        console.log(fmt.bold(fmt.primary('Context Utilization')));
        console.log(fmt.border('────────────────────────────'));
        console.log(`System          ${fmt.muted((bd.systemTokens / 1000).toFixed(1) + 'k').padStart(18, ' ')}`);
        console.log(`Project         ${fmt.muted((bd.projectTokens / 1000).toFixed(1) + 'k').padStart(18, ' ')}`);
        console.log(`Conversation    ${fmt.muted((bd.conversationTokens / 1000).toFixed(1) + 'k').padStart(18, ' ')}`);
        console.log(`Tools           ${fmt.muted((bd.toolsTokens / 1000).toFixed(1) + 'k').padStart(18, ' ')}`);
        console.log(`Files           ${fmt.muted((bd.filesTokens / 1000).toFixed(1) + 'k').padStart(18, ' ')}`);
        console.log(fmt.border('────────────────────────────'));
        console.log(fmt.bold(`Total           ${fmt.primary((bd.totalTokens / 1000).toFixed(1) + 'k').padStart(18, ' ')}`));
        console.log(`Limit           ${fmt.dimmed((bd.limit / 1000).toFixed(1) + 'k').padStart(18, ' ')}`);
        console.log(`Remaining       ${fmt.success((bd.remaining / 1000).toFixed(1) + 'k').padStart(18, ' ')}`);
        console.log();
    }
    static renderModels(themeManager, aliases, discovered) {
        const fmt = themeManager.getFormatted();
        console.log();
        console.log(fmt.bold(fmt.primary('AVAILABLE MODELS & ALIASES')));
        console.log();
        console.log(fmt.accent('ALIASES'));
        for (const [alias, conf] of Object.entries(aliases)) {
            console.log(`  ${fmt.bold(alias.padEnd(14, ' '))} → ${fmt.assistant(conf.provider)} / ${fmt.muted(conf.model)}`);
        }
        console.log();
        for (const [providerId, models] of Object.entries(discovered)) {
            console.log(fmt.accent(providerId.toUpperCase()));
            if (models.length === 0) {
                console.log(fmt.dimmed('  (no local models discovered or not running)'));
            }
            else {
                for (const m of models.slice(0, 8)) {
                    const ctxStr = m.context_length ? ` [${Math.round(m.context_length / 1000)}k]` : '';
                    console.log(`  ├─ ${fmt.primary(m.id)}${fmt.dimmed(ctxStr)}`);
                }
                if (models.length > 8) {
                    console.log(`  └─ ${fmt.dimmed(`... and ${models.length - 8} more`)}`);
                }
            }
            console.log();
        }
    }
    static renderThemes(themeManager) {
        const fmt = themeManager.getFormatted();
        const active = themeManager.getActiveTheme().name;
        const list = themeManager.listThemes();
        console.log();
        console.log(fmt.bold(fmt.primary('AVAILABLE THEMES')));
        console.log(fmt.dimmed('Switch live with: /theme <name> or berkelium -t <name>'));
        console.log();
        for (const t of list) {
            const isCurrent = t.name === active;
            const marker = isCurrent ? fmt.success('● ') : '  ';
            const nameStr = isCurrent ? fmt.bold(fmt.primary(t.name)) : t.name;
            const descStr = fmt.dimmed(`- ${t.description || ''}`);
            console.log(`${marker}${nameStr.padEnd(20, ' ')} ${descStr}`);
        }
        console.log();
    }
    static renderConfig(themeManager, config) {
        const fmt = themeManager.getFormatted();
        console.log();
        console.log(fmt.bold(fmt.primary('BERKELIUM CONFIGURATION')));
        console.log();
        console.log(`Default Model:     ${fmt.assistant(config.default_model)}`);
        console.log(`Active Theme:      ${fmt.accent(config.theme.name)}`);
        console.log(`Launch Animation:  ${config.ui.launch_animation ? fmt.success('enabled') : fmt.dimmed('disabled')}`);
        console.log(`Hackathon Mode:    ${config.ui.hackathon_mode ? fmt.accent('enabled') : fmt.dimmed('disabled')}`);
        console.log(`Auto Compact:      ${config.agent.auto_compact ? fmt.success('enabled') : fmt.dimmed('disabled')}`);
        console.log(`Verify Changes:    ${config.agent.verify_changes ? fmt.success('enabled') : fmt.dimmed('disabled')}`);
        console.log();
    }
}
//# sourceMappingURL=overlays.js.map