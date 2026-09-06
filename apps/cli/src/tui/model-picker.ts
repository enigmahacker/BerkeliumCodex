import * as readline from 'node:readline';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ModelStore } from '@berkelium/runtime';

export interface ModelPickerItem {
  id: string;
  name: string;
  category: 'LOCAL' | 'CLOUD';
  details?: string;
  target: string;
}

export class ModelPicker {
  private themeManager: ThemeManager;
  private configManager: ConfigManager;
  private router: ProviderRouter;
  private items: ModelPickerItem[] = [];

  constructor(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    router: ProviderRouter,
    modelsDir?: string
  ) {
    this.themeManager = themeManager;
    this.configManager = configManager;
    this.router = router;
    this.loadItems(modelsDir);
  }

  private loadItems(modelsDir?: string): void {
    const store = new ModelStore(modelsDir);
    const localStored = store.list();

    const items: ModelPickerItem[] = [];

    // Local items
    if (localStored.length > 0) {
      for (const s of localStored) {
        const m = s.descriptor;
        const sizeGB = ((s.disk_size_bytes || m.file_size_bytes || 0) / 1024 ** 3).toFixed(1);
        const runtimeStr = m.runtime.toUpperCase();
        const ctxK = m.context_length ? Math.round(m.context_length / 1024) + 'K' : '128K';
        items.push({
          id: m.id,
          name: m.name || m.id,
          category: 'LOCAL',
          details: `${runtimeStr} · ${m.parameters || sizeGB + ' GB'} · ${ctxK}`,
          target: `local/${m.id}`,
        });
      }
    } else {
      // Default recommended local models
      items.push(
        {
          id: 'qwen3-coder:30b',
          name: 'qwen3-coder:30b',
          category: 'LOCAL',
          details: 'MLX · 30B · 128K',
          target: 'local/qwen3-coder:30b',
        },
        {
          id: 'berkelium-coder:3b',
          name: 'berkelium-coder:3b',
          category: 'LOCAL',
          details: 'MLX · 3B · 32K',
          target: 'local/berkelium-coder:3b',
        },
        {
          id: 'deepseek-coder:6.7b',
          name: 'deepseek-coder:6.7b',
          category: 'LOCAL',
          details: 'GGUF · 6.7B · Q4_K_M',
          target: 'local/deepseek-coder:6.7b',
        }
      );
    }

    // Cloud items
    items.push(
      {
        id: 'gemini-3.6-flash',
        name: 'Gemini (Google DeepMind)',
        category: 'CLOUD',
        details: 'Gemini 3.6 Flash · 1M context · Multimodal',
        target: 'cloud/gemini/gemini-3.6-flash',
      },
      {
        id: 'claude-3-7-sonnet',
        name: 'Anthropic (Claude)',
        category: 'CLOUD',
        details: 'Claude 3.7 Sonnet · Hybrid Reasoning · 200K',
        target: 'cloud/openrouter/anthropic/claude-3.7-sonnet',
      },
      {
        id: 'gpt-4o',
        name: 'OpenAI',
        category: 'CLOUD',
        details: 'GPT-4o · 128K context · High Throughput',
        target: 'cloud/openrouter/openai/gpt-4o',
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek R1 (Groq LPU)',
        category: 'CLOUD',
        details: 'DeepSeek R1 Distill · Ultra-Low Latency',
        target: 'cloud/groq/deepseek-r1-distill-llama-70b',
      },
      {
        id: 'meta/llama-3.3-70b',
        name: 'NVIDIA NIM',
        category: 'CLOUD',
        details: 'Llama 3.3 70B Instruct · Enterprise NIM',
        target: 'cloud/nvidia/meta/llama-3.3-70b-instruct',
      }
    );

    this.items = items;
  }

  public getItems(): ModelPickerItem[] {
    return this.items;
  }

  public renderStatic(): void {
    const fmt = this.themeManager.getFormatted();
    const activeModel = this.configManager.getConfig().default_model;

    console.log();
    console.log(fmt.bold(fmt.primary('SELECT MODEL')));
    console.log();

    const local = this.items.filter((i) => i.category === 'LOCAL');
    const cloud = this.items.filter((i) => i.category === 'CLOUD');

    console.log(fmt.accent('LOCAL'));
    for (const item of local) {
      const isSelected = item.id === activeModel || activeModel.includes(item.id);
      const mark = isSelected ? fmt.success('● ') : fmt.dimmed('○ ');
      console.log(`  ${mark}${fmt.bold(item.name)}`);
      if (item.details) {
        console.log(`    ${fmt.dimmed(item.details)}`);
      }
    }

    console.log();
    console.log(fmt.accent('CLOUD'));
    for (const item of cloud) {
      const isSelected = item.id === activeModel || activeModel.includes(item.id);
      const mark = isSelected ? fmt.success('● ') : fmt.dimmed('○ ');
      console.log(`  ${mark}${fmt.bold(item.name)}`);
      if (item.details) {
        console.log(`    ${fmt.dimmed(item.details)}`);
      }
    }

    console.log();
    console.log(fmt.dimmed('To switch active model: berkelium model use <model> or /model <name>'));
    console.log();
  }

  public async promptInteractive(): Promise<ModelPickerItem | null> {
    if (!process.stdin.isTTY) {
      this.renderStatic();
      return null;
    }

    const fmt = this.themeManager.getFormatted();
    const activeModel = this.configManager.getConfig().default_model;

    // Find initial index matching activeModel or default to 0
    let selectedIndex = this.items.findIndex(
      (i) => i.id === activeModel || activeModel.includes(i.id)
    );
    if (selectedIndex < 0) selectedIndex = 0;

    readline.emitKeypressEvents(process.stdin);
    const wasRaw = process.stdin.isRaw;
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    // Hide cursor
    process.stdout.write('\x1b[?25l');

    let renderedLineCount = 0;

    const render = () => {
      // Clear previously rendered lines
      if (renderedLineCount > 0) {
        process.stdout.write(`\x1b[${renderedLineCount}A\r\x1b[0J`);
      }

      const lines: string[] = [];
      lines.push(fmt.bold(fmt.primary('SELECT MODEL')));
      lines.push('');

      let itemIndex = 0;

      // Render LOCAL group
      lines.push(fmt.accent('LOCAL'));
      for (const item of this.items.filter((i) => i.category === 'LOCAL')) {
        const isCursor = itemIndex === selectedIndex;
        const mark = isCursor ? fmt.primary('● ') : fmt.dimmed('○ ');
        const nameStr = isCursor ? fmt.bold(fmt.primary(item.name)) : item.name;
        lines.push(`  ${mark}${nameStr}`);
        if (item.details) {
          lines.push(`    ${fmt.dimmed(item.details)}`);
        }
        itemIndex++;
      }

      lines.push('');
      // Render CLOUD group
      lines.push(fmt.accent('CLOUD'));
      for (const item of this.items.filter((i) => i.category === 'CLOUD')) {
        const isCursor = itemIndex === selectedIndex;
        const mark = isCursor ? fmt.primary('● ') : fmt.dimmed('○ ');
        const nameStr = isCursor ? fmt.bold(fmt.primary(item.name)) : item.name;
        lines.push(`  ${mark}${nameStr}`);
        if (item.details) {
          lines.push(`    ${fmt.dimmed(item.details)}`);
        }
        itemIndex++;
      }

      lines.push('');
      lines.push(fmt.dimmed('↑ ↓ Navigate   Enter Select   Esc Cancel'));

      process.stdout.write(lines.join('\n') + '\n');
      renderedLineCount = lines.length;
    };

    render();

    return new Promise<ModelPickerItem | null>((resolve) => {
      const cleanup = () => {
        process.stdin.removeListener('keypress', onKeypress);
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(wasRaw ?? false);
        }
        process.stdout.write('\x1b[?25h'); // restore cursor
      };

      const onKeypress = (_str: string | undefined, key: any) => {
        if (!key) return;

        if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
          cleanup();
          console.log(fmt.dimmed('\nModel selection cancelled.'));
          resolve(null);
          return;
        }

        if (key.name === 'up') {
          selectedIndex = (selectedIndex - 1 + this.items.length) % this.items.length;
          render();
          return;
        }

        if (key.name === 'down') {
          selectedIndex = (selectedIndex + 1) % this.items.length;
          render();
          return;
        }

        if (key.name === 'return' || key.name === 'enter') {
          cleanup();
          const selected = this.items[selectedIndex];
          this.configManager.setSessionOverride({ default_model: selected.id });
          console.log();
          console.log(
            fmt.success(`✓ Active model switched to "${selected.name}" (${selected.target})`)
          );
          console.log();
          resolve(selected);
          return;
        }
      };

      process.stdin.on('keypress', onKeypress);
    });
  }
}
