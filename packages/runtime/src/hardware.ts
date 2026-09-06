/**
 * @berkelium/runtime — Apple Silicon Hardware Detection
 *
 * Detects hardware capabilities on macOS (Apple Silicon or Intel),
 * calculates memory budgets for model loading, and provides
 * pre-flight checks before attempting to load a model.
 *
 * Uses macOS sysctl/system_profiler where available, with safe
 * fallbacks for non-macOS or sandboxed environments.
 */

import * as os from 'node:os';
import { execSync } from 'node:child_process';
import type { HardwareInfo, MemoryBudget, ModelDescriptor, AppleSiliconChip } from './types.js';

/** Percentage of total memory reserved for the OS and system services */
const SYSTEM_RESERVE_PERCENT = 0.20;
/** Fixed memory reserved for the Berkelium agent runtime overhead */
const AGENT_RESERVE_BYTES = 256 * 1024 * 1024; // 256 MB
/** Safety margin for KV cache and context overhead */
const KV_CACHE_OVERHEAD_FACTOR = 1.15;

export class HardwareDetector {
  private cachedInfo: HardwareInfo | null = null;

  /**
   * Detect full hardware profile. Results are cached after first call.
   */
  public detect(): HardwareInfo {
    if (this.cachedInfo) return this.cachedInfo;

    const arch = os.arch();
    const platform = os.platform();
    const isAppleSilicon = platform === 'darwin' && arch === 'arm64';
    const totalMem = os.totalmem();

    let chip: AppleSiliconChip = 'unknown';
    let gpuCores = 0;
    let neuralEngine = false;
    let performanceCores = 0;
    let efficiencyCores = 0;
    let availableMemory = totalMem;
    let osVersion = '';

    if (platform === 'darwin') {
      chip = this.detectAppleChip();
      gpuCores = this.detectGPUCores();
      neuralEngine = isAppleSilicon;
      const coreInfo = this.detectCoreTopology();
      performanceCores = coreInfo.performance;
      efficiencyCores = coreInfo.efficiency;
      availableMemory = this.getAvailableMemory();
      osVersion = this.getMacOSVersion();
    } else {
      availableMemory = os.freemem();
      osVersion = `${platform} ${os.release()}`;
    }

    this.cachedInfo = {
      chip,
      is_apple_silicon: isAppleSilicon,
      total_memory_bytes: totalMem,
      available_memory_bytes: availableMemory,
      cpu_cores: os.cpus().length,
      performance_cores: performanceCores || os.cpus().length,
      efficiency_cores: efficiencyCores,
      gpu_cores: gpuCores,
      neural_engine: neuralEngine,
      os_version: osVersion,
      arch,
    };

    return this.cachedInfo;
  }

  /**
   * Calculate memory budget for model loading.
   * Returns how much memory is available for models after system and agent reservations.
   */
  public calculateBudget(currentlyLoadedBytes: number = 0): MemoryBudget {
    const hw = this.detect();
    const systemReserved = Math.floor(hw.total_memory_bytes * SYSTEM_RESERVE_PERCENT);
    const totalAvailable = hw.total_memory_bytes - systemReserved - AGENT_RESERVE_BYTES;
    const remaining = Math.max(0, totalAvailable - currentlyLoadedBytes);

    return {
      total_available_bytes: totalAvailable,
      system_reserved_bytes: systemReserved,
      agent_reserved_bytes: AGENT_RESERVE_BYTES,
      max_model_bytes: totalAvailable,
      currently_used_bytes: currentlyLoadedBytes,
      remaining_bytes: remaining,
    };
  }

  /**
   * Pre-flight check: Can the given model be loaded with current hardware?
   * Returns null if OK, or an error message explaining why not.
   */
  public canLoadModel(model: ModelDescriptor, currentlyLoadedBytes: number = 0): string | null {
    const budget = this.calculateBudget(currentlyLoadedBytes);
    const hw = this.detect();

    // Estimate memory needed including KV cache overhead
    const estimatedModelMem = model.hardware_requirements.min_memory_bytes * KV_CACHE_OVERHEAD_FACTOR;

    if (estimatedModelMem > budget.remaining_bytes) {
      const modelGB = (estimatedModelMem / (1024 ** 3)).toFixed(1);
      const availGB = (budget.remaining_bytes / (1024 ** 3)).toFixed(1);
      const totalGB = (hw.total_memory_bytes / (1024 ** 3)).toFixed(0);

      // Suggest a smaller quantization if possible
      let suggestion = '';
      if (model.quantization && !model.quantization.includes('4bit') && !model.quantization.includes('q4')) {
        suggestion = `\nTry: berkelium pull ${model.id.split(':')[0]}:${model.parameters.toLowerCase()}-q4`;
      }
      const smallerParam = suggestSmallerModel(model.parameters);
      if (smallerParam) {
        suggestion += `\nOr:  berkelium pull ${model.id.split(':')[0]}:${smallerParam}`;
      }

      return (
        `Insufficient memory to load ${model.id}.\n` +
        `Required: ~${modelGB} GB (including KV cache overhead)\n` +
        `Available: ${availGB} GB (of ${totalGB} GB total)` +
        suggestion
      );
    }

    // Check GPU requirement
    if (model.hardware_requirements.gpu_required && hw.gpu_cores === 0) {
      return `Model ${model.id} requires GPU acceleration, but no GPU was detected.`;
    }

    // Check runtime compatibility
    if (model.hardware_requirements.compatible_runtimes.length > 0) {
      const hasMLX = hw.is_apple_silicon;
      const compatible = model.hardware_requirements.compatible_runtimes.some(rt => {
        if (rt === 'mlx') return hasMLX;
        if (rt === 'gguf') return true; // GGUF runs on any platform
        if (rt === 'cpu') return true;
        return false;
      });
      if (!compatible) {
        return `No compatible runtime found for ${model.id}. Requires: ${model.hardware_requirements.compatible_runtimes.join(', ')}`;
      }
    }

    return null; // All clear
  }

  /**
   * Format hardware info for display (berkelium doctor / berkelium status).
   */
  public formatSummary(): string {
    const hw = this.detect();
    const budget = this.calculateBudget();
    const memTotal = formatBytes(hw.total_memory_bytes);
    const memAvail = formatBytes(hw.available_memory_bytes);
    const budgetAvail = formatBytes(budget.total_available_bytes);

    const lines: string[] = [];
    if (hw.is_apple_silicon) {
      lines.push(`Chip:           ${hw.chip}`);
      lines.push(`CPU:            ${hw.performance_cores}P + ${hw.efficiency_cores}E cores`);
      lines.push(`GPU:            ${hw.gpu_cores} cores`);
      lines.push(`Neural Engine:  ${hw.neural_engine ? 'Available' : 'N/A'}`);
    } else {
      lines.push(`Architecture:   ${hw.arch}`);
      lines.push(`CPU:            ${hw.cpu_cores} cores`);
    }
    lines.push(`Memory:         ${memAvail} available / ${memTotal} total`);
    lines.push(`Model Budget:   ${budgetAvail}`);
    lines.push(`OS:             ${hw.os_version}`);

    return lines.join('\n');
  }

  // ── Private Detection Methods ────────────────────────────────────────

  private detectAppleChip(): AppleSiliconChip {
    try {
      const brand = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf-8' }).trim();
      const chipMap: Record<string, AppleSiliconChip> = {
        'Apple M1': 'M1',
        'Apple M1 Pro': 'M1 Pro',
        'Apple M1 Max': 'M1 Max',
        'Apple M1 Ultra': 'M1 Ultra',
        'Apple M2': 'M2',
        'Apple M2 Pro': 'M2 Pro',
        'Apple M2 Max': 'M2 Max',
        'Apple M2 Ultra': 'M2 Ultra',
        'Apple M3': 'M3',
        'Apple M3 Pro': 'M3 Pro',
        'Apple M3 Max': 'M3 Max',
        'Apple M3 Ultra': 'M3 Ultra',
        'Apple M4': 'M4',
        'Apple M4 Pro': 'M4 Pro',
        'Apple M4 Max': 'M4 Max',
        'Apple M4 Ultra': 'M4 Ultra',
      };
      return chipMap[brand] || (brand.startsWith('Apple M') ? 'unknown' : 'unknown');
    } catch {
      return 'unknown';
    }
  }

  private detectGPUCores(): number {
    const chip = this.detectAppleChip();
    const gpuEstimates: Partial<Record<AppleSiliconChip, number>> = {
      'M1': 8, 'M1 Pro': 16, 'M1 Max': 32, 'M1 Ultra': 64,
      'M2': 10, 'M2 Pro': 19, 'M2 Max': 38, 'M2 Ultra': 76,
      'M3': 10, 'M3 Pro': 18, 'M3 Max': 40, 'M3 Ultra': 80,
      'M4': 10, 'M4 Pro': 20, 'M4 Max': 40, 'M4 Ultra': 80,
    };
    return gpuEstimates[chip] || (chip !== 'unknown' ? 8 : 0);
  }

  private detectCoreTopology(): { performance: number; efficiency: number } {
    try {
      const perfCores = parseInt(
        execSync('sysctl -n hw.perflevel0.logicalcpu', { encoding: 'utf-8' }).trim(), 10
      );
      const effCores = parseInt(
        execSync('sysctl -n hw.perflevel1.logicalcpu', { encoding: 'utf-8' }).trim(), 10
      );
      return { performance: perfCores || 0, efficiency: effCores || 0 };
    } catch {
      return { performance: os.cpus().length, efficiency: 0 };
    }
  }

  private getAvailableMemory(): number {
    try {
      // Use vm_stat for accurate available memory on macOS
      const vmStat = execSync('vm_stat', { encoding: 'utf-8' });
      const pageSize = 16384; // macOS default page size on ARM
      const freeMatch = vmStat.match(/Pages free:\s+(\d+)/);
      const inactiveMatch = vmStat.match(/Pages inactive:\s+(\d+)/);
      const purgableMatch = vmStat.match(/Pages purgeable:\s+(\d+)/);

      const free = freeMatch ? parseInt(freeMatch[1], 10) : 0;
      const inactive = inactiveMatch ? parseInt(inactiveMatch[1], 10) : 0;
      const purgable = purgableMatch ? parseInt(purgableMatch[1], 10) : 0;

      return (free + inactive + purgable) * pageSize;
    } catch {
      return os.freemem();
    }
  }

  private getMacOSVersion(): string {
    try {
      return execSync('sw_vers -productVersion', { encoding: 'utf-8' }).trim();
    } catch {
      return `macOS ${os.release()}`;
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function suggestSmallerModel(parameters: string): string | null {
  const sizeMap: Record<string, string> = {
    '70B': '30b', '30B': '14b', '33B': '14b', '14B': '7b',
    '13B': '7b', '8B': '3b', '7B': '3b',
  };
  return sizeMap[parameters.toUpperCase()] || null;
}
