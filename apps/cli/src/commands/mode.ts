import { ThemeManager } from '@berkelium/themes';
import { ConfigManager, RuntimeMode } from '@berkelium/config';

export class ModeCommand {
  public static async run(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    newMode?: string
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const config = configManager.getConfig();

    const descriptions: Record<RuntimeMode, string> = {
      local: 'Exclusively local inference (MLX on Apple Silicon, GGUF, local Ollama/LM Studio). Zero cloud calls.',
      cloud: 'Cloud-first inference using external APIs (Gemini, OpenRouter, Groq, NVIDIA, Hugging Face).',
      hybrid: 'Intelligent split: Local model handles repo indexing & context prep; Cloud handles complex reasoning.',
      auto: 'Dynamic selection: Auto-detects local hardware memory and selects local model if fit, otherwise cloud.',
    };

    if (!newMode) {
      console.log();
      console.log(fmt.bold(fmt.primary('BERKELIUM RUNTIME INFERENCE MODE')));
      console.log(`Current Mode: ${fmt.bold(fmt.accent((config.mode || 'auto').toUpperCase()))}`);
      console.log(fmt.dimmed(descriptions[config.mode || 'auto']));
      console.log();
      console.log('Available modes:');
      for (const [m, desc] of Object.entries(descriptions)) {
        const marker = m === config.mode ? '● ' : '○ ';
        console.log(`  ${marker}${fmt.bold(m.padEnd(8))} ${fmt.dimmed(desc)}`);
      }
      console.log();
      console.log(`To change mode: ${fmt.accent('berkelium mode <local|cloud|hybrid|auto>')}`);
      console.log();
      return;
    }

    const lower = newMode.toLowerCase() as RuntimeMode;
    if (!['local', 'cloud', 'hybrid', 'auto'].includes(lower)) {
      console.log(fmt.error(`Invalid mode "${newMode}". Must be one of: local, cloud, hybrid, auto`));
      return;
    }

    configManager.setSessionOverride({ mode: lower });
    console.log();
    console.log(fmt.success(`✓ Runtime mode set to: ${lower.toUpperCase()}`));
    console.log(fmt.dimmed(descriptions[lower]));
    console.log();
  }
}
