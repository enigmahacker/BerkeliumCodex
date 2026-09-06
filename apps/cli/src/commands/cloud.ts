import { ThemeManager } from '@berkelium/themes';
import { ConfigManager, CostController } from '@berkelium/config';
import { AuthStore } from '@berkelium/auth';
import { ProviderRouter } from '@berkelium/providers';
import { AuthCommand } from './auth.js';

export class CloudCommand {
  public static async run(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    authStore: AuthStore,
    router: ProviderRouter,
    subcommand: string = 'status',
    arg1?: string,
    arg2?: string
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const config = configManager.getConfig();

    switch (subcommand.toLowerCase()) {
      case 'providers':
      case 'status': {
        console.log();
        console.log(fmt.bold(fmt.primary('CLOUD PROVIDERS STATUS')));
        console.log();

        const cloudProviderIds = ['openrouter', 'gemini', 'nvidia', 'groq', 'huggingface'];
        const header = 'PROVIDER'.padEnd(20) + 'STATUS'.padEnd(20) + 'BASE URL';
        console.log(fmt.bold(header));
        console.log('─'.repeat(70));

        for (const id of cloudProviderIds) {
          const prov = router.getProvider(id);
          const available = prov ? await prov.isAvailable() : false;
          const statusStr = available
            ? fmt.success('✓ CONNECTED')
            : fmt.warning('○ NO API KEY');
          const provConf = (config.providers as any)[id];
          const url = provConf?.base_url || 'default';
          console.log(`${id.padEnd(20)}${statusStr.padEnd(20)}${url}`);
        }
        console.log();
        break;
      }

      case 'models': {
        console.log();
        console.log(fmt.bold(fmt.primary('AVAILABLE CLOUD MODELS')));
        console.log();

        const all = await router.listAllAvailableModels();
        for (const [provId, models] of Object.entries(all)) {
          if (models.length > 0) {
            console.log(fmt.bold(fmt.accent(provId.toUpperCase())));
            for (const m of models) {
              const ctx = m.context_length ? `${Math.round(m.context_length / 1024)}k ctx` : '';
              console.log(`  ${m.id.padEnd(45)} ${fmt.dimmed(ctx)}`);
            }
            console.log();
          }
        }
        break;
      }

      case 'login': {
        await AuthCommand.run(themeManager, authStore, 'login', arg1, arg2);
        break;
      }

      case 'logout': {
        await AuthCommand.run(themeManager, authStore, 'logout', arg1);
        break;
      }

      case 'usage': {
        const costController = new CostController(config.cost);
        console.log();
        console.log(fmt.bold(fmt.primary('CLOUD USAGE & EXPENDITURE')));
        console.log();
        console.log(costController.formatSummary());
        console.log();
        break;
      }

      case 'use': {
        if (!arg1) {
          console.log(fmt.error('Usage: berkelium cloud use <model>'));
          console.log(fmt.dimmed('Example: berkelium cloud use gemini-3.6-flash'));
          return;
        }
        try {
          const target = router.resolveTarget(arg1);
          console.log(
            fmt.success(`✓ Active cloud model set to ${target.providerId}/${target.modelId}`)
          );
        } catch (err: any) {
          console.log(fmt.error(err.message));
        }
        break;
      }

      default: {
        console.log(fmt.bold(fmt.primary('BERKELIUM CLOUD COMMANDS')));
        console.log('  berkelium cloud status           Check cloud provider connectivity');
        console.log('  berkelium cloud providers        List all configured cloud providers');
        console.log('  berkelium cloud models           List all models from connected providers');
        console.log('  berkelium cloud login <provider> Authenticate cloud provider');
        console.log('  berkelium cloud logout <prov>    Remove stored credentials');
        console.log('  berkelium cloud usage            View token usage and cost metrics');
        console.log('  berkelium cloud use <model>      Switch default model');
        console.log();
      }
    }
  }
}
