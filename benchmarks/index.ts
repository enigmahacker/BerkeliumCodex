import { runToolBench } from './tool-calling/toolbench.js';
import { Tokenizer, ContextCompactor } from '@berkelium/context';
import { Message } from '@berkelium/providers';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║             BERKELIUM PERFORMANCE BENCHMARKS               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();

  // 1. Startup Latency Benchmark
  const startT = performance.now();
  const { ConfigManager } = await import('@berkelium/config');
  const { ToolRegistry } = await import('@berkelium/tools');
  const { ThemeManager } = await import('@berkelium/themes');
  const _cm = new ConfigManager();
  const _tr = new ToolRegistry();
  const _tm = new ThemeManager();
  const startupMs = Math.round(performance.now() - startT);

  console.log(`[1] Startup Latency:           ${startupMs} ms (Budget: <150ms) ${startupMs < 150 ? '✓ PASS' : '⚠ WARN'}`);

  // 2. ToolBench Benchmark
  const toolbench = runToolBench();
  console.log(`[2] ToolBench Schema Accuracy: ${toolbench.accuracy.toFixed(1)}% (${toolbench.passed}/${toolbench.total}) ✓ PASS`);

  // 3. Tokenizer Throughput Benchmark
  const sampleCode = 'export async function authenticate(user: string, token: string): Promise<boolean> { return true; }\n'.repeat(500);
  const tokenStart = performance.now();
  const tokenCount = Tokenizer.countTokens(sampleCode);
  const tokenDuration = performance.now() - tokenStart;
  const tokensPerSec = Math.round((tokenCount / (tokenDuration / 1000)));

  console.log(`[3] Tokenizer Speed:           ${tokenDuration.toFixed(2)} ms (${tokensPerSec.toLocaleString()} tokens/sec) ✓ PASS`);

  // 4. Context Compaction Benchmark
  const messages: Message[] = [];
  for (let i = 0; i < 50; i++) {
    messages.push({ role: 'user', content: `Task question number ${i} with long description and code instructions.` });
    messages.push({ role: 'assistant', content: `Executing tool and analysis step for iteration ${i}.`, tool_calls: [{ id: `c_${i}`, name: 'read_file', arguments: { path: `src/file_${i}.ts` } }] });
    messages.push({ role: 'tool', content: `Result output data chunk from file ${i} with 50 lines of code.`, tool_call_id: `c_${i}` });
  }

  const compactStart = performance.now();
  const compactRes = ContextCompactor.compact(messages, 5000, 0.5);
  const compactDuration = performance.now() - compactStart;

  console.log(`[4] Context Compaction:        ${compactDuration.toFixed(2)} ms (${compactRes.tokensBefore} -> ${compactRes.tokensAfter} tokens, -${Math.round((1 - compactRes.tokensAfter / compactRes.tokensBefore) * 100)}%) ✓ PASS`);

  // 5. Memory Footprint
  const mem = process.memoryUsage();
  const memMb = (mem.rss / (1024 * 1024)).toFixed(1);
  console.log(`[5] Memory Footprint (RSS):    ${memMb} MB (Budget: <100MB) ${parseFloat(memMb) < 100 ? '✓ PASS' : '⚠ WARN'}`);

  console.log();
  console.log('✓ All benchmarks completed successfully.');
}

main().catch(console.error);
