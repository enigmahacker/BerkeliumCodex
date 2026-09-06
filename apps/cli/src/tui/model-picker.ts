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
      // ── Google AI Studio (Permanent Free Tier) ───────────────────
      {
        id: 'gemini-3-flash',
        name: 'Gemini 3 Flash (Google AI Studio)',
        category: 'CLOUD',
        details: '🌟 Recommended Default Free-Tier · 1M context · Agentic & Multimodal',
        target: 'cloud/gemini/gemini-3-flash',
      },
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash (Google DeepMind)',
        category: 'CLOUD',
        details: '🆕 Long-Horizon Agentic · 1M context · Multimodal',
        target: 'cloud/gemini/gemini-3.8-flash',
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash-Lite (Google AI Studio)',
        category: 'CLOUD',
        details: 'Permanent Free Tier · Maximum Throughput · 1M context',
        target: 'cloud/gemini/gemini-3.1-flash-lite',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash (Google AI Studio)',
        category: 'CLOUD',
        details: 'Permanent Free Tier with Thinking Mode · 1M context',
        target: 'cloud/gemini/gemini-2.5-flash',
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash (Google AI Studio)',
        category: 'CLOUD',
        details: 'Permanent Free Tier · Fast Multimodal Loops · 1M context',
        target: 'cloud/gemini/gemini-2.0-flash',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro (Google AI Studio)',
        category: 'CLOUD',
        details: 'Experimental Free Cap (~50 req/day) · 2M context · Deep Reasoning',
        target: 'cloud/gemini/gemini-2.5-pro',
      },
      {
        id: 'gemini-3.6-flash',
        name: 'Gemini 3.6 Flash (Google DeepMind)',
        category: 'CLOUD',
        details: 'High-Throughput Coding · 1M context · Multimodal',
        target: 'cloud/gemini/gemini-3.6-flash',
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro (Google DeepMind)',
        category: 'CLOUD',
        details: 'Advanced Intelligence · 2M context · Vibe Coding',
        target: 'cloud/gemini/gemini-3.1-pro-preview',
      },

      // ── Groq (Permanent Free Tier) ───────────────────────────────
      {
        id: 'llama-3.3-70b-groq',
        name: 'Llama 3.3 70B Versatile (Groq LPU)',
        category: 'CLOUD',
        details: 'Permanent Free Tier · Ultra-Fast LPU Inference · 128K',
        target: 'cloud/groq/llama-3.3-70b-versatile',
      },
      {
        id: 'llama-3.1-8b-groq',
        name: 'Llama 3.1 8B Instant (Groq LPU)',
        category: 'CLOUD',
        details: 'Permanent Free Tier · Sub-100ms Latency · 128K',
        target: 'cloud/groq/llama-3.1-8b-instant',
      },
      {
        id: 'llama-3.2-11b-vision-groq',
        name: 'Llama 3.2 11B Vision (Groq LPU)',
        category: 'CLOUD',
        details: 'Permanent Free Tier · Multimodal Visual Reasoning · 128K',
        target: 'cloud/groq/llama-3.2-11b-vision-preview',
      },
      {
        id: 'qwen-2.5-72b-groq',
        name: 'Qwen 2.5 72B (Groq LPU)',
        category: 'CLOUD',
        details: 'Permanent Free Tier · High-Accuracy Reasoning · 131K',
        target: 'cloud/groq/qwen-2.5-72b',
      },
      {
        id: 'gemma-2-27b-groq',
        name: 'Gemma 2 27B (Groq LPU)',
        category: 'CLOUD',
        details: 'Permanent Free Tier · Google Open Weights on LPU · 8K',
        target: 'cloud/groq/gemma-2-27b-it',
      },
      {
        id: 'deepseek-r1-groq',
        name: 'DeepSeek R1 Distill (Groq LPU)',
        category: 'CLOUD',
        details: 'Ultra-Low Latency Reasoning · 128K',
        target: 'cloud/groq/deepseek-r1-distill-llama-70b',
      },

      // ── OpenRouter (Free Endpoints / :free Models) ───────────────
      {
        id: 'openrouter-llama-4-scout-free',
        name: 'Llama 4 Scout :free (OpenRouter)',
        category: 'CLOUD',
        details: 'Community Free Endpoint · Multimodal MoE · 131K',
        target: 'cloud/openrouter/meta-llama/llama-4-scout:free',
      },
      {
        id: 'openrouter-llama-3.3-70b-free',
        name: 'Llama 3.3 70B Instruct :free (OpenRouter)',
        category: 'CLOUD',
        details: 'Community Free Endpoint · Meta 70B Flagship · 131K',
        target: 'cloud/openrouter/meta-llama/llama-3.3-70b-instruct:free',
      },
      {
        id: 'openrouter-nemotron-free',
        name: 'Nemotron 3.5 Lightning :free (OpenRouter)',
        category: 'CLOUD',
        details: 'Community Free Endpoint · NVIDIA High-Throughput Reasoning · 131K',
        target: 'cloud/openrouter/nvidia/nemotron-3.5-lightning:free',
      },
      {
        id: 'openrouter-gemma-3-free',
        name: 'Gemma 3 27B :free (OpenRouter)',
        category: 'CLOUD',
        details: 'Community Free Endpoint · Multimodal Vision & Code · 32K',
        target: 'cloud/openrouter/google/gemma-3-27b-it:free',
      },
      {
        id: 'openrouter-qwen-72b-free',
        name: 'Qwen 2.5 72B :free (OpenRouter)',
        category: 'CLOUD',
        details: 'Community Free Endpoint · Open Coding & Math · 131K',
        target: 'cloud/openrouter/qwen/qwen-2.5-72b-instruct:free',
      },
      {
        id: 'openrouter-mistral-7b-free',
        name: 'Mistral 7B Instruct :free (OpenRouter)',
        category: 'CLOUD',
        details: 'Community Free Endpoint · Native Tool Calling · 32K',
        target: 'cloud/openrouter/mistralai/mistral-7b-instruct:free',
      },

      // ── NVIDIA NIM (1,000 Free Credits upon Sign-up) ─────────────
      {
        id: 'nvidia-nemotron-3.5-lightning',
        name: 'Nemotron 3.5 Lightning 30B (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · High-Throughput MoE · 131K',
        target: 'cloud/nvidia/nvidia/nemotron-3.5-lightning-30b-a3b',
      },
      {
        id: 'nvidia-deepseek-v4-pro',
        name: 'DeepSeek V4 Pro (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · Frontier Reasoning Checkpoint · 163K',
        target: 'cloud/nvidia/deepseek-ai/deepseek-v4-pro-0813',
      },
      {
        id: 'nvidia-deepseek-r1',
        name: 'DeepSeek R1 (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · 671B Frontier Reasoning · 128K',
        target: 'cloud/nvidia/deepseek-ai/deepseek-r1',
      },
      {
        id: 'nvidia-deepseek-v3',
        name: 'DeepSeek V3 (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · 671B MoE Coding Workhorse · 128K',
        target: 'cloud/nvidia/deepseek-ai/deepseek-v3',
      },
      {
        id: 'nvidia-llama-3.3-70b',
        name: 'Llama 3.3 70B Instruct (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · TensorRT-LLM Accelerated · 128K',
        target: 'cloud/nvidia/meta/llama-3.3-70b-instruct',
      },
      {
        id: 'nvidia-llama-3.1-405b',
        name: 'Llama 3.1 405B Instruct (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · Pinnacle Open Frontier Model · 128K',
        target: 'cloud/nvidia/meta/llama-3.1-405b-instruct',
      },
      {
        id: 'nvidia-nemotron-70b',
        name: 'Llama 3.1 Nemotron 70B (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · NVIDIA Aligned Intelligence · 128K',
        target: 'cloud/nvidia/nvidia/llama-3.1-nemotron-70b-instruct',
      },
      {
        id: 'nvidia-qwen-coder',
        name: 'Qwen 2.5 Coder 32B (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · Premier Open Coding Engine · 128K',
        target: 'cloud/nvidia/qwen/qwen2.5-coder-32b-instruct',
      },
      {
        id: 'nvidia-codestral',
        name: 'Codestral 22B (NVIDIA NIM)',
        category: 'CLOUD',
        details: '1,000 Free Credits · Mistral Code Generation Engine · 32K',
        target: 'cloud/nvidia/mistralai/codestral-22b-instruct-v0.1',
      },

      // ── Hugging Face Inference API (Serverless Free Tier) ────────
      {
        id: 'hf-llama-3.1-8b',
        name: 'Llama 3.1 8B Instruct (HF Serverless)',
        category: 'CLOUD',
        details: 'Serverless Free Tier (<10B) · Low Memory Footprint · 131K',
        target: 'cloud/huggingface/meta-llama/Llama-3.1-8B-Instruct',
      },
      {
        id: 'hf-gemma-2-9b',
        name: 'Gemma 2 9B IT (HF Serverless)',
        category: 'CLOUD',
        details: 'Serverless Free Tier (<10B) · Google Open Assistant · 8K',
        target: 'cloud/huggingface/google/gemma-2-9b-it',
      },
      {
        id: 'hf-qwen-coder-7b',
        name: 'Qwen 2.5 Coder 7B (HF Serverless)',
        category: 'CLOUD',
        details: 'Serverless Free Tier (<10B) · Dedicated Coding Assistant · 32K',
        target: 'cloud/huggingface/Qwen/Qwen2.5-Coder-7B',
      },
      {
        id: 'hf-mistral-7b',
        name: 'Mistral 7B Instruct (HF Serverless)',
        category: 'CLOUD',
        details: 'Serverless Free Tier (<10B) · Native Tool Calling · 32K',
        target: 'cloud/huggingface/mistralai/Mistral-7B-Instruct-v0.3',
      },

      // ── Anthropic Claude (Paid / Requires Account Billing) ────────
      {
        id: 'claude-3-7-sonnet',
        name: 'Claude 3.7 Sonnet (Anthropic)',
        category: 'CLOUD',
        details: 'Hybrid Reasoning & Software Engineering · Paid Billed API · 200K',
        target: 'cloud/openrouter/anthropic/claude-3.7-sonnet',
      },
      {
        id: 'claude-3-7-sonnet-thinking',
        name: 'Claude 3.7 Sonnet Thinking (Anthropic)',
        category: 'CLOUD',
        details: 'Extended Deliberation Mode · Paid Billed API · 200K',
        target: 'cloud/openrouter/anthropic/claude-3.7-sonnet:thinking',
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet (Anthropic)',
        category: 'CLOUD',
        details: 'Industry Standard Coding Agent · Paid Billed API · 200K',
        target: 'cloud/openrouter/anthropic/claude-3.5-sonnet',
      },
      {
        id: 'claude-3-5-haiku',
        name: 'Claude 3.5 Haiku (Anthropic)',
        category: 'CLOUD',
        details: 'Ultra-Fast Triage & High-Speed Edits · Paid Billed API · 200K',
        target: 'cloud/openrouter/anthropic/claude-3.5-haiku',
      },

      // ── OpenAI (Paid / Requires Account Billing) ──────────────────
      {
        id: 'gpt-4o',
        name: 'OpenAI GPT-4o',
        category: 'CLOUD',
        details: 'Multimodal Flagship · High Throughput · Paid Billed API · 128K',
        target: 'cloud/openrouter/openai/gpt-4o',
      },
      {
        id: 'o3-mini',
        name: 'OpenAI o3-mini',
        category: 'CLOUD',
        details: 'Frontier STEM & Code Reasoning · Paid Billed API · 200K',
        target: 'cloud/openrouter/openai/o3-mini',
      },
      {
        id: 'o1',
        name: 'OpenAI o1',
        category: 'CLOUD',
        details: 'Deliberate Architectural Reasoning · Paid Billed API · 200K',
        target: 'cloud/openrouter/openai/o1',
      },
      {
        id: 'gpt-4o-mini',
        name: 'OpenAI GPT-4o Mini',
        category: 'CLOUD',
        details: 'Fast Multimodal Loops · Paid Billed API · 128K',
        target: 'cloud/openrouter/openai/gpt-4o-mini',
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
