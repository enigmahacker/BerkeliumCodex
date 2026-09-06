import { RuntimeManager, HardwareDetector } from '@berkelium/runtime';
export class RuntimeCommand {
    static async run(themeManager, subcommand = 'list') {
        const fmt = themeManager.getFormatted();
        const runtimeManager = new RuntimeManager();
        const hardware = new HardwareDetector();
        await runtimeManager.initialize();
        console.log();
        console.log(fmt.bold(fmt.primary('BERKELIUM LOCAL RUNTIMES')));
        console.log();
        if (subcommand === 'status' || subcommand === 'info') {
            console.log(fmt.bold(fmt.accent('HARDWARE PROFILE')));
            console.log(hardware.formatSummary());
            console.log();
        }
        const statuses = await runtimeManager.getStatuses();
        const header = 'RUNTIME'.padEnd(20) +
            'STATUS'.padEnd(16) +
            'VERSION'.padEnd(16) +
            'LOADED';
        console.log(fmt.bold(header));
        console.log('─'.repeat(60));
        for (const s of statuses) {
            const icon = s.available ? fmt.success('● READY') : fmt.warning('○ UNAVAILABLE');
            const name = s.name.padEnd(20);
            const statusStr = icon.padEnd(16);
            const version = (s.version || 'unknown').padEnd(16);
            const loaded = s.models_loaded > 0 ? `${s.models_loaded} models` : 'none';
            console.log(`${name}${statusStr}${version}${loaded}`);
        }
        console.log();
    }
}
//# sourceMappingURL=runtime.js.map