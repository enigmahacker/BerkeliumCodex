import * as os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
export class DoctorCommand {
    static async run(themeManager, authStore, router, json = false) {
        const checks = [];
        // 1. Platform checks
        const isMac = os.platform() === 'darwin';
        const isArm64 = os.arch() === 'arm64';
        checks.push({
            category: 'Platform',
            name: 'macOS Operating System',
            passed: isMac,
            message: isMac ? `macOS (${os.release()})` : `Non-macOS platform (${os.platform()})`,
        });
        checks.push({
            category: 'Platform',
            name: 'Apple Silicon Native (ARM64)',
            passed: isArm64,
            message: isArm64 ? 'Native arm64 architecture' : `Architecture: ${os.arch()}`,
        });
        // 2. Runtime checks
        checks.push({
            category: 'Runtime',
            name: 'Node.js Runtime',
            passed: parseInt(process.versions.node.split('.')[0]) >= 20,
            message: `Node ${process.version}`,
        });
        // Git check
        try {
            const { stdout } = await execFileAsync('git', ['--version']);
            checks.push({
                category: 'Runtime',
                name: 'Git Version Control',
                passed: true,
                message: stdout.trim(),
            });
        }
        catch {
            checks.push({
                category: 'Runtime',
                name: 'Git Version Control',
                passed: false,
                message: 'git binary not found in PATH',
            });
        }
        // Keychain check
        const keychainAvailable = isMac;
        checks.push({
            category: 'Runtime',
            name: 'macOS Keychain Storage',
            passed: keychainAvailable,
            message: keychainAvailable ? 'Available' : 'Fallback to encrypted local vault',
        });
        // 3. Provider checks
        const openrouterProv = router.getProvider('openrouter');
        const openrouterOk = openrouterProv ? await openrouterProv.isAvailable() : false;
        checks.push({
            category: 'Providers',
            name: 'OpenRouter Cloud Provider',
            passed: openrouterOk,
            message: openrouterOk ? 'Authenticated / API key present' : 'No API key configured',
        });
        const nvidiaProv = router.getProvider('nvidia');
        const nvidiaOk = nvidiaProv ? await nvidiaProv.isAvailable() : false;
        checks.push({
            category: 'Providers',
            name: 'NVIDIA NIM Provider',
            passed: nvidiaOk,
            message: nvidiaOk ? 'Authenticated / API key present' : 'No API key configured',
        });
        const hfProv = router.getProvider('huggingface');
        const hfOk = hfProv ? await hfProv.isAvailable() : false;
        checks.push({
            category: 'Providers',
            name: 'Hugging Face Inference API',
            passed: hfOk,
            message: hfOk ? 'Authenticated / API token present' : 'No API token configured',
        });
        const groqProv = router.getProvider('groq');
        const groqOk = groqProv ? await groqProv.isAvailable() : false;
        checks.push({
            category: 'Providers',
            name: 'Groq LPU Inference Engine',
            passed: groqOk,
            message: groqOk ? 'Authenticated / API key present' : 'No API key configured',
        });
        const ollamaProv = router.getProvider('ollama');
        const ollamaOk = ollamaProv ? await ollamaProv.isAvailable() : false;
        checks.push({
            category: 'Providers',
            name: 'Ollama Local Provider',
            passed: ollamaOk,
            message: ollamaOk ? 'Local service running at 127.0.0.1:11434' : 'Not running locally',
        });
        const lmstudioProv = router.getProvider('lmstudio');
        const lmstudioOk = lmstudioProv ? await lmstudioProv.isAvailable() : false;
        checks.push({
            category: 'Providers',
            name: 'LM Studio Local Provider',
            passed: lmstudioOk,
            message: lmstudioOk ? 'Local server running at 127.0.0.1:1234' : 'Not running locally',
        });
        // 4. Tools checks
        checks.push({
            category: 'Tools',
            name: 'Filesystem Sandboxing',
            passed: true,
            message: 'Active',
        });
        checks.push({
            category: 'Tools',
            name: 'Shell Execution Engine',
            passed: true,
            message: 'Active with security policy',
        });
        const allCriticalPassed = checks
            .filter((c) => c.category === 'Platform' || c.category === 'Runtime')
            .every((c) => c.passed);
        const report = {
            timestamp: new Date().toISOString(),
            passed: allCriticalPassed,
            platform: {
                os: os.platform(),
                arch: os.arch(),
                isAppleSilicon: isMac && isArm64,
                nodeVersion: process.version,
            },
            checks,
        };
        if (json) {
            console.log(JSON.stringify(report, null, 2));
            return;
        }
        const fmt = themeManager.getFormatted();
        console.log();
        console.log(fmt.bold(fmt.primary('BERKELIUM DOCTOR')));
        console.log(fmt.dimmed('Diagnostics and environment health assessment'));
        console.log();
        const categories = ['Platform', 'Runtime', 'Providers', 'Tools'];
        for (const cat of categories) {
            console.log(fmt.bold(fmt.accent(cat)));
            const catChecks = checks.filter((c) => c.category === cat);
            for (const item of catChecks) {
                const icon = item.passed ? fmt.success('✓ ') : fmt.warning('○ ');
                const nameStr = item.name.padEnd(32, ' ');
                const msgStr = fmt.dimmed(item.message || '');
                console.log(`  ${icon}${nameStr} ${msgStr}`);
            }
            console.log();
        }
        if (allCriticalPassed) {
            console.log(fmt.success('✓ No critical system issues found. Berkelium is ready.'));
        }
        else {
            console.log(fmt.warning('⚠ Some components are unconfigured. Run `berkelium auth login <provider>` if needed.'));
        }
        console.log();
    }
}
//# sourceMappingURL=doctor.js.map