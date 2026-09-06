import * as path from 'node:path';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';

export class ConfigCommand {
  public static async run(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    subaction?: string,
    key?: string,
    value?: string
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const action = (subaction || 'list').toLowerCase();
    const config = configManager.getConfig();

    switch (action) {
      case 'path': {
        const wsRoot = configManager.getWorkspaceRoot();
        console.log();
        console.log(fmt.bold(fmt.primary('CONFIGURATION PATHS')));
        console.log(`  Workspace Root:  ${fmt.bold(wsRoot)}`);
        console.log(`  Project Config:  ${fmt.dimmed(path.join(wsRoot, '.berkelium', 'config.json'))}`);
        console.log(`  Prompts Dir:     ${fmt.dimmed(path.join(wsRoot, '.berkelium', 'prompts'))}`);
        console.log(`  Sessions Dir:    ${fmt.dimmed(path.join(wsRoot, '.berkelium', 'sessions'))}`);
        console.log();
        break;
      }

      case 'get': {
        if (!key) {
          console.log(fmt.error('Usage: berkelium config get <key>'));
          console.log(fmt.dimmed('Example: berkelium config get default_model'));
          return;
        }
        const val = (config as any)[key];
        console.log();
        if (val !== undefined) {
          console.log(`${fmt.bold(key)}: ${typeof val === 'object' ? JSON.stringify(val, null, 2) : fmt.primary(String(val))}`);
        } else {
          console.log(fmt.error(`Config key "${key}" not found.`));
        }
        console.log();
        break;
      }

      case 'set': {
        if (!key || value === undefined) {
          console.log(fmt.error('Usage: berkelium config set <key> <value>'));
          console.log(fmt.dimmed('Example: berkelium config set default_model qwen3-coder:30b'));
          return;
        }
        configManager.setSessionOverride({ [key]: value });
        console.log();
        console.log(fmt.success(`✓ Set "${key}" to "${value}" for this session.`));
        console.log();
        break;
      }

      case 'list':
      default: {
        console.log();
        console.log(fmt.bold(fmt.primary('ACTIVE BERKELIUM CONFIGURATION')));
        console.log();
        console.log(fmt.accent('MODEL & RUNTIME'));
        console.log(`  • Default Model:    ${fmt.bold(fmt.assistant(config.default_model))}`);
        console.log(`  • Runtime Engine:   ${fmt.primary((config as any).runtime?.default || 'mlx')}`);
        console.log(`  • Runtime Mode:     ${fmt.bold((config as any).runtime?.mode || 'local')}`);
        console.log();
        console.log(fmt.accent('SECURITY & PRIVACY'));
        console.log(`  • Privacy Tier:     ${fmt.bold((config as any).privacy?.mode || 'local')}`);
        console.log(`  • Cost Hard Limit:  $${(config as any).cost_control?.hard_limit_usd ?? 10.0}`);
        console.log(`  • Confirmations:    ${fmt.dimmed((config.permissions as any)?.risk_threshold || 'medium')}`);
        console.log();
        console.log(fmt.accent('UI & SYSTEM'));
        console.log(`  • Theme:            ${fmt.bold(config.theme.name)}`);
        console.log(`  • Launch Matrix:    ${config.ui.launch_matrix ? fmt.success('YES') : fmt.dimmed('NO')}`);
        console.log(`  • Max Iterations:   ${config.agent.max_iterations}`);
        console.log();
        console.log(fmt.dimmed('Commands:'));
        console.log('  berkelium config get <key>       Get configuration value');
        console.log('  berkelium config set <key> <val> Set configuration value');
        console.log('  berkelium config path            Show config directory paths');
        console.log();
      }
    }
  }
}
