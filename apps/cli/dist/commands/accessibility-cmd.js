export class AccessibilityCommand {
    static async run(themeManager, configManager, action) {
        const fmt = themeManager.getFormatted();
        const subaction = (action || 'status').toLowerCase();
        switch (subaction) {
            case 'enable':
            case 'on': {
                configManager.setSessionOverride({
                    ui: {
                        launch_animation: false,
                        launch_matrix: false,
                        plain_mode: true,
                        high_contrast: true,
                    },
                });
                themeManager.setTheme('high-contrast');
                console.log();
                console.log(fmt.success('✓ Accessibility mode enabled:'));
                console.log('  • High-contrast theme (maximum visibility)');
                console.log('  • Screen-reader friendly outputs');
                console.log('  • Animated sequences disabled');
                console.log();
                break;
            }
            case 'disable':
            case 'off': {
                configManager.setSessionOverride({
                    ui: {
                        launch_animation: true,
                        launch_matrix: true,
                        plain_mode: false,
                        high_contrast: false,
                    },
                });
                themeManager.setTheme('berkelium-dark');
                console.log();
                console.log(fmt.success('✓ Accessibility mode disabled (standard terminal theme restored).'));
                console.log();
                break;
            }
            case 'status':
            default: {
                const activeTheme = themeManager.getActiveTheme().name;
                const isAccessible = activeTheme === 'high-contrast' || configManager.getConfig().ui?.plain_mode;
                console.log();
                console.log(fmt.bold(fmt.primary('ACCESSIBILITY CONFIGURATION')));
                console.log(`  Status:               ${isAccessible ? fmt.success('ENABLED') : fmt.dimmed('DISABLED')}`);
                console.log(`  Active Theme:         ${fmt.bold(activeTheme)}`);
                console.log(`  Launch Animations:    ${configManager.getConfig().ui.launch_animation ? fmt.dimmed('ENABLED') : fmt.success('DISABLED')}`);
                console.log(`  Screen Reader Cues:   ${isAccessible ? fmt.success('OPTIMIZED') : fmt.dimmed('STANDARD')}`);
                console.log();
                console.log(fmt.dimmed('Commands:'));
                console.log('  berkelium accessibility enable     Enable screen-reader friendly plain mode');
                console.log('  berkelium accessibility disable    Restore standard terminal presentation');
                console.log('  berkelium --plain                  Run single command without ANSI formatting');
                console.log();
                break;
            }
        }
    }
}
//# sourceMappingURL=accessibility-cmd.js.map