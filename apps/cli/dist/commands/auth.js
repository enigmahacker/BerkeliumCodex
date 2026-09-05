import * as readline from 'node:readline/promises';
export class AuthCommand {
    static async run(themeManager, authStore, action, provider, keyArg) {
        const fmt = themeManager.getFormatted();
        if (!action || action === 'list') {
            const statuses = await authStore.getAllStatuses();
            console.log();
            console.log(fmt.bold(fmt.primary('AUTHENTICATION STATUS')));
            console.log();
            for (const s of statuses) {
                const icon = s.authenticated ? fmt.success('✓ ') : fmt.dimmed('○ ');
                const nameStr = s.name.padEnd(16, ' ');
                const stateStr = s.authenticated ? fmt.success('authenticated') : fmt.dimmed('not configured');
                const srcStr = s.source !== 'none' ? fmt.dimmed(`[${s.source}${s.maskedKey ? ': ' + s.maskedKey : ''}]`) : '';
                console.log(`  ${icon}${nameStr} ${stateStr.padEnd(20, ' ')} ${srcStr}`);
            }
            console.log();
            console.log(fmt.dimmed('To authenticate: berkelium auth login <provider>'));
            console.log();
            return;
        }
        const targetProvider = (provider?.toLowerCase() === 'hf' ? 'huggingface' : provider?.toLowerCase());
        if (action === 'login') {
            if (!targetProvider) {
                console.log(fmt.error('Please specify provider to login: berkelium auth login <nvidia|openrouter|huggingface|groq>'));
                return;
            }
            let apiKey = keyArg;
            if (!apiKey) {
                const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
                apiKey = await rl.question(fmt.accent(`Enter API Key for ${targetProvider.toUpperCase()}: `));
                rl.close();
            }
            const trimmedKey = apiKey.trim();
            if (!trimmedKey) {
                console.log(fmt.error('Empty API key provided. Aborted.'));
                return;
            }
            await authStore.setApiKey(targetProvider, trimmedKey);
            console.log(fmt.success(`✓ Successfully authenticated ${targetProvider.toUpperCase()} (saved in secure storage).`));
            return;
        }
        if (action === 'logout') {
            if (!targetProvider) {
                console.log(fmt.error('Please specify provider to logout: berkelium auth logout <provider>'));
                return;
            }
            await authStore.removeApiKey(targetProvider);
            console.log(fmt.success(`✓ Logged out ${targetProvider.toUpperCase()}.`));
            return;
        }
        console.log(fmt.error(`Unknown auth action "${action}". Available: list, login, logout`));
    }
}
//# sourceMappingURL=auth.js.map