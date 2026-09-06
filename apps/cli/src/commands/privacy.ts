import { ThemeManager } from '@berkelium/themes';
import { ConfigManager, PrivacyMode, PrivacyEngine } from '@berkelium/config';

export class PrivacyCommand {
  public static async run(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    newMode?: string
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const config = configManager.getConfig();
    const engine = new PrivacyEngine(config.privacy);

    const descriptions: Record<PrivacyMode, string> = {
      local: 'STRICT LOCAL: No external network inference. Prompts, code, and context never leave localhost.',
      balanced: 'BALANCED: Local inference prioritized. User confirmation required before sending data to cloud.',
      hybrid: 'HYBRID: Local for context scanning and embeddings; cloud permitted for deep reasoning.',
      cloud: 'CLOUD-FIRST: Full cloud provider execution permitted without additional confirmation barriers.',
    };

    if (!newMode) {
      console.log();
      console.log(fmt.bold(fmt.primary('BERKELIUM DATA PRIVACY GOVERNANCE')));
      console.log(`Current Mode: ${fmt.bold(fmt.accent(config.privacy.mode.toUpperCase()))}`);
      console.log(fmt.dimmed(descriptions[config.privacy.mode]));
      console.log();
      console.log('Available privacy policies:');
      for (const [m, desc] of Object.entries(descriptions)) {
        const marker = m === config.privacy.mode ? '● ' : '○ ';
        console.log(`  ${marker}${fmt.bold(m.padEnd(10))} ${fmt.dimmed(desc)}`);
      }
      console.log();
      console.log(`To switch policy: ${fmt.accent('berkelium privacy <local|balanced|hybrid|cloud>')}`);
      console.log();
      return;
    }

    const lower = newMode.toLowerCase() as PrivacyMode;
    if (!['local', 'balanced', 'hybrid', 'cloud'].includes(lower)) {
      console.log(fmt.error(`Invalid privacy mode "${newMode}". Must be one of: local, balanced, hybrid, cloud`));
      return;
    }

    configManager.setSessionOverride({ privacy: { ...config.privacy, mode: lower } });
    engine.setMode(lower);
    console.log();
    console.log(fmt.success(`✓ Privacy mode set to: ${lower.toUpperCase()}`));
    console.log(fmt.dimmed(descriptions[lower]));
    console.log();
  }
}
