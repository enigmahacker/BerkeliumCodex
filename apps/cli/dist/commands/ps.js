import { RuntimeManager } from '@berkelium/runtime';
export class PsCommand {
    static async run(themeManager) {
        const fmt = themeManager.getFormatted();
        const runtimeManager = new RuntimeManager();
        await runtimeManager.initialize();
        const loaded = runtimeManager.getAllLoadedModels();
        console.log();
        console.log(fmt.bold(fmt.primary('RUNNING MODELS')));
        console.log();
        if (loaded.length === 0) {
            console.log(fmt.dimmed('No local model processes currently active.'));
        }
        else {
            const header = 'NAME'.padEnd(30) +
                'RUNTIME'.padEnd(12) +
                'PID'.padEnd(10) +
                'MEMORY'.padEnd(14) +
                'REQUESTS';
            console.log(header);
            console.log('─'.repeat(72));
            for (const m of loaded) {
                const name = m.descriptor.id.padEnd(30);
                const runtime = m.descriptor.runtime.toUpperCase().padEnd(12);
                const pid = String(m.process_pid || 'N/A').padEnd(10);
                const memGB = (m.memory_used_bytes / 1024 ** 3).toFixed(1) + ' GB';
                const reqs = String(m.requests_served);
                console.log(`${name}${runtime}${pid}${memGB.padEnd(14)}${reqs}`);
            }
        }
        console.log();
    }
}
//# sourceMappingURL=ps.js.map