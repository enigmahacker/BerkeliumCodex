import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { HardwareDetector, ModelStore, RuntimeManager } from '@berkelium/runtime';

export class StatusCommand {
  public static async run(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    router: ProviderRouter,
    json = false
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const config = configManager.getConfig();
    const hardware = new HardwareDetector();
    const hwInfo = hardware.detect();
    const budget = hardware.calculateBudget();
    const store = new ModelStore();
    const runtimeManager = new RuntimeManager();
    await runtimeManager.initialize();
    const runtimeStatuses = await runtimeManager.getStatuses();

    const activeModel = config.default_model;
    let resolvedTarget: { providerId: string; modelId: string } | null = null;
    try {
      resolvedTarget = router.resolveTarget(activeModel);
    } catch {
      // Ignored
    }

    const report = {
      version: '1.0.0 (darwin-arm64 native)',
      mode: config.mode || 'auto',
      privacy: config.privacy.mode,
      activeModel: {
        alias: activeModel,
        provider: resolvedTarget?.providerId || 'unknown',
        model: resolvedTarget?.modelId || 'unknown',
      },
      hardware: {
        chip: hwInfo.chip,
        isAppleSilicon: hwInfo.is_apple_silicon,
        totalMemoryBytes: hwInfo.total_memory_bytes,
        availableMemoryBytes: hwInfo.available_memory_bytes,
        cpuCores: hwInfo.cpu_cores,
        gpuCores: hwInfo.gpu_cores,
        neuralEngine: hwInfo.neural_engine,
        modelBudgetBytes: budget.total_available_bytes,
      },
      storage: store.getCacheStats(),
      runtimes: runtimeStatuses,
    };

    if (json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log();
    console.log(fmt.bold(fmt.primary('BERKELIUM SYSTEM STATUS & RUNTIME OVERVIEW')));
    console.log('═'.repeat(60));
    console.log();

    console.log(fmt.bold(fmt.accent('SYSTEM CONFIGURATION')));
    console.log(`Version:       ${report.version}`);
    console.log(`Runtime Mode:  ${fmt.bold(report.mode.toUpperCase())}`);
    console.log(`Data Privacy:  ${fmt.bold(report.privacy.toUpperCase())}`);
    console.log(
      `Active Model:  ${fmt.bold(report.activeModel.alias)} (${report.activeModel.provider}/${report.activeModel.model})`
    );
    console.log();

    console.log(fmt.bold(fmt.accent('HARDWARE & MEMORY BUDGET')));
    console.log(hardware.formatSummary());
    console.log();

    console.log(fmt.bold(fmt.accent('LOCAL RUNTIME ENGINES')));
    for (const r of runtimeStatuses) {
      const statusIcon = r.available ? fmt.success('● READY') : fmt.warning('○ UNAVAILABLE');
      console.log(`  ${r.name.padEnd(20)} ${statusIcon.padEnd(16)} (v${r.version})`);
    }
    console.log();

    console.log(fmt.bold(fmt.accent('LOCAL MODEL STORAGE')));
    const sizeGB = (report.storage.totalSizeBytes / 1024 ** 3).toFixed(2);
    console.log(`Installed:     ${report.storage.modelCount} models (${sizeGB} GB)`);
    console.log(`Directory:     ${report.storage.modelsDir}`);
    console.log();
  }
}
