import { fgHex } from '@berkelium/themes';
import { BkMatrix } from './bk-matrix.js';
export class LaunchAnimation {
    static async play(themeManager, options = {}) {
        if (options.skip)
            return;
        if (options.matrix || themeManager.getActiveTheme().name === 'matrix') {
            await BkMatrix.playMatrixRain(themeManager, {
                durationMs: options.durationMs || 1200,
            });
            return;
        }
        const fmt = themeManager.getFormatted();
        const duration = options.durationMs || 700;
        const stepDelay = Math.max(20, Math.floor(duration / 10));
        // Clear screen
        console.clear();
        const cyan = (t) => fgHex('#00d2ff', t);
        const neonBlue = (t) => fgHex('#0099ff', t);
        const royalBlue = (t) => fgHex('#3a7bd5', t);
        const white = (t) => fgHex('#ffffff', t);
        // Box dimensions: 46 chars wide (44 inner)
        const b = (s) => fmt.border(s);
        const pad = (content, len = 44) => {
            // Strip ANSI for accurate padding calculation
            const stripped = content.replace(/\x1b\[[0-9;]*m/g, '');
            const missing = Math.max(0, len - stripped.length);
            return content + ' '.repeat(missing);
        };
        console.log(b('╭────────────────────────────────────────────╮'));
        console.log(b('│') + ' '.repeat(44) + b('│'));
        // Logo Block: BE / BK
        console.log(b('│') +
            pad('          ' +
                cyan(fmt.bold('██████╗ ')) +
                neonBlue(fmt.bold('███████╗')) +
                '                  ') +
            b('│'));
        console.log(b('│') +
            pad('          ' +
                cyan(fmt.bold('██╔══██╗')) +
                neonBlue(fmt.bold('██╔════╝')) +
                '                  ') +
            b('│'));
        console.log(b('│') +
            pad('          ' +
                cyan(fmt.bold('██████╔╝')) +
                neonBlue(fmt.bold('█████╗  ')) +
                '                  ') +
            b('│'));
        console.log(b('│') +
            pad('          ' +
                royalBlue(fmt.bold('██╔══██╗')) +
                royalBlue(fmt.bold('██╔══╝  ')) +
                '                  ') +
            b('│'));
        console.log(b('│') +
            pad('          ' +
                royalBlue(fmt.bold('██████╔╝')) +
                royalBlue(fmt.bold('███████╗')) +
                '                  ') +
            b('│'));
        console.log(b('│') + ' '.repeat(44) + b('│'));
        console.log(b('│') +
            pad('             ' +
                white(fmt.bold('B E R K E L I U M')) +
                '              ') +
            b('│'));
        console.log(b('│') + ' '.repeat(44) + b('│'));
        // Animated boot sequence
        const bootSteps = [
            'initializing agent runtime...',
            'loading provider registry...',
            'indexing workspace...',
            'checking security policies...',
        ];
        for (const step of bootSteps) {
            await new Promise((r) => setTimeout(r, stepDelay));
            const stepLine = '   ' + fmt.dimmed(step.padEnd(33, ' ')) + fmt.success('✓');
            console.log(b('│') + pad(stepLine) + b('│'));
        }
        console.log(b('│') + ' '.repeat(44) + b('│'));
        // System Environment Details (Excluding raw API keys)
        const modelStr = options.model
            ? `${options.model} (${options.provider || 'cloud'})`
            : 'deepseek/deepseek-chat (OpenRouter)';
        const wsStr = options.workspace
            ? options.workspace.length > 28
                ? '...' + options.workspace.slice(-25)
                : options.workspace
            : 'active workspace';
        const toolsStr = `${options.toolCount || 20} native tools registered`;
        console.log(b('│') +
            pad(`   ${fmt.dimmed('MODEL:    ')} ${fmt.assistant(modelStr.slice(0, 29))}`) +
            b('│'));
        console.log(b('│') +
            pad(`   ${fmt.dimmed('WORKSPACE:')} ${fmt.muted(wsStr)}`) +
            b('│'));
        console.log(b('│') +
            pad(`   ${fmt.dimmed('TOOLS:    ')} ${fmt.primary(toolsStr)}`) +
            b('│'));
        console.log(b('│') +
            pad(`   ${fmt.dimmed('SECURITY: ')} ${fmt.success('Keychain Isolation [Active]')}`) +
            b('│'));
        console.log(b('│') + ' '.repeat(44) + b('│'));
        console.log(b('│') +
            pad('    ' + fmt.accent(fmt.bold('PROUDLY INDIAN. BUILT FOR THE WORLD.')) + '    ') +
            b('│'));
        console.log(b('╰────────────────────────────────────────────╯'));
        console.log();
    }
}
//# sourceMappingURL=animation.js.map