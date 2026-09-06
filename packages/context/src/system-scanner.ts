import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface SystemInfoResult {
  os: {
    platform: string;
    release: string;
    architecture: string;
    kernel: string;
    hostname: string;
  };
  cpu: {
    model: string;
    cores: number;
    performanceCores?: number;
    efficiencyCores?: number;
    loadAverage: number[];
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    modelBudgetBytes: number;
  };
  storage: {
    rootTotalBytes: number;
    rootFreeBytes: number;
    projectDiskUsageBytes?: number;
    modelCacheSizeBytes?: number;
  };
  gpu: {
    model: string;
    cores: number;
    mlxAvailable: boolean;
  };
  environment: Record<string, string>;
  processes: Array<{ pid: number; command: string }>;
  network: {
    interfaces: string[];
    localIp?: string;
    internetReachable: boolean;
  };
}

export class SystemScanner {
  public static scan(): SystemInfoResult {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown CPU';

    // Apple Silicon Detection
    let pCores: number | undefined;
    let eCores: number | undefined;
    let gpuCores = 0;
    let gpuModel = 'Apple Metal GPU';

    if (os.platform() === 'darwin' && os.arch() === 'arm64') {
      try {
        const perfOutput = execSync('sysctl -n hw.perflevel0.logicalcpu', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        pCores = parseInt(perfOutput, 10);
      } catch {
        // Fallback
      }

      try {
        const effOutput = execSync('sysctl -n hw.perflevel1.logicalcpu', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        eCores = parseInt(effOutput, 10);
      } catch {
        // Fallback
      }

      // Fast chip table for GPU cores
      if (cpuModel.includes('M4 Max')) gpuCores = 40;
      else if (cpuModel.includes('M4 Pro')) gpuCores = 20;
      else if (cpuModel.includes('M4')) gpuCores = 10;
      else if (cpuModel.includes('M3 Max')) gpuCores = 40;
      else if (cpuModel.includes('M3 Pro')) gpuCores = 18;
      else if (cpuModel.includes('M3')) gpuCores = 10;
      else if (cpuModel.includes('M2 Max')) gpuCores = 38;
      else if (cpuModel.includes('M2 Pro')) gpuCores = 19;
      else if (cpuModel.includes('M2')) gpuCores = 10;
      else if (cpuModel.includes('M1 Max')) gpuCores = 32;
      else if (cpuModel.includes('M1 Pro')) gpuCores = 16;
      else if (cpuModel.includes('M1')) gpuCores = 8;
      else gpuCores = 8;
    }

    // MLX Availability
    let mlxAvailable = false;
    try {
      execSync('python3 -c "import mlx.core" 2>/dev/null', { stdio: ['ignore', 'ignore', 'ignore'] });
      mlxAvailable = true;
    } catch {
      mlxAvailable = false;
    }

    // Storage info
    let rootTotal = 0;
    let rootFree = 0;
    try {
      if ((fs as any).statfsSync) {
        const stats = (fs as any).statfsSync('/');
        rootTotal = stats.bsize * stats.blocks;
        rootFree = stats.bsize * stats.bfree;
      }
    } catch {
      // Fallback
    }

    // Model Cache Size
    let modelCacheSize = 0;
    const modelDir = path.join(os.homedir(), '.berkelium', 'models');
    if (fs.existsSync(modelDir)) {
      try {
        const files = fs.readdirSync(modelDir, { withFileTypes: true });
        for (const file of files) {
          if (file.isFile()) {
            modelCacheSize += fs.statSync(path.join(modelDir, file.name)).size;
          }
        }
      } catch {
        // Ignore
      }
    }

    // Environment Toolchains Detection
    const environment: Record<string, string> = {
      Node: process.version,
    };

    const checkCli = (name: string, cmd: string) => {
      try {
        const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 1000 }).toString().trim();
        if (out) environment[name] = out.split('\n')[0];
      } catch {
        // Tool not installed
      }
    };

    checkCli('Git', 'git --version');
    checkCli('Python', 'python3 --version');
    checkCli('Rust', 'rustc --version');
    checkCli('Go', 'go version');
    checkCli('Docker', 'docker --version');
    checkCli('Homebrew', 'brew --version');
    checkCli('Xcode', 'xcodebuild -version');
    checkCli('Ollama', 'ollama --version');

    // Network inspection
    const networkInterfaces = os.networkInterfaces();
    const ifaceNames = Object.keys(networkInterfaces);
    let localIp: string | undefined;
    for (const name of ifaceNames) {
      const addrs = networkInterfaces[name] || [];
      for (const addr of addrs) {
        if (!addr.internal && addr.family === 'IPv4') {
          localIp = addr.address;
          break;
        }
      }
      if (localIp) break;
    }

    // Running dev processes
    const processes: Array<{ pid: number; command: string }> = [];
    try {
      const psOutput = execSync('ps -e -o pid,comm', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 1000 }).toString();
      const lines = psOutput.split('\n').slice(1);
      const devKeywords = ['node', 'python', 'git', 'llama', 'mlx', 'ollama', 'cargo', 'rustc'];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const [pidStr, ...cmdParts] = trimmed.split(/\s+/);
        const comm = cmdParts.join(' ');
        if (devKeywords.some(k => comm.toLowerCase().includes(k))) {
          processes.push({ pid: parseInt(pidStr, 10), command: comm });
        }
      }
    } catch {
      // Ignore ps error
    }

    return {
      os: {
        platform: os.platform(),
        release: os.release(),
        architecture: os.arch(),
        kernel: os.version ? os.version() : os.release(),
        hostname: os.hostname(),
      },
      cpu: {
        model: cpuModel,
        cores: cpus.length,
        performanceCores: pCores,
        efficiencyCores: eCores,
        loadAverage: os.loadavg(),
      },
      memory: {
        totalBytes: totalMem,
        freeBytes: freeMem,
        modelBudgetBytes: Math.floor(freeMem * 0.8),
      },
      storage: {
        rootTotalBytes: rootTotal,
        rootFreeBytes: rootFree,
        modelCacheSizeBytes: modelCacheSize,
      },
      gpu: {
        model: gpuModel,
        cores: gpuCores,
        mlxAvailable,
      },
      environment,
      processes: processes.slice(0, 15),
      network: {
        interfaces: ifaceNames,
        localIp,
        internetReachable: true,
      },
    };
  }

  public static formatReport(info: SystemInfoResult, section?: string): string {
    const toGB = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

    if (section === 'storage') {
      return [
        `STORAGE SCAN`,
        `Root volume total:      ${toGB(info.storage.rootTotalBytes)}`,
        `Root volume available:  ${toGB(info.storage.rootFreeBytes)}`,
        `Model cache directory:  ${toGB(info.storage.modelCacheSizeBytes || 0)} (~/.berkelium/models)`,
      ].join('\n');
    }

    if (section === 'processes') {
      const lines = [`ACTIVE PROCESSES (Development & Runtimes):`];
      for (const p of info.processes) {
        lines.push(`  [PID ${p.pid}] ${p.command}`);
      }
      return lines.join('\n');
    }

    if (section === 'network') {
      return [
        `NETWORK INTERFACE SCAN:`,
        `Interfaces:             ${info.network.interfaces.join(', ')}`,
        `Local IPv4:             ${info.network.localIp || 'Not configured'}`,
        `Network status:         Online`,
      ].join('\n');
    }

    if (section === 'environment') {
      const lines = [`DEVELOPMENT ENVIRONMENT TOOLCHAINS:`];
      for (const [tool, ver] of Object.entries(info.environment)) {
        lines.push(`  ✓ ${tool.padEnd(12)} ${ver}`);
      }
      return lines.join('\n');
    }

    // Default overview
    const lines = [
      `SYSTEM SCAN`,
      `OS:                     ${info.os.platform} (${info.os.release}, ${info.os.architecture})`,
      `Kernel:                 ${info.os.kernel}`,
      `CPU:                    ${info.cpu.model} (${info.cpu.cores} cores${info.cpu.performanceCores ? `, ${info.cpu.performanceCores}P + ${info.cpu.efficiencyCores}E` : ''})`,
      `Memory Total:           ${toGB(info.memory.totalBytes)}`,
      `Memory Available:       ${toGB(info.memory.freeBytes)}`,
      `Model Budget:           ${toGB(info.memory.modelBudgetBytes)}`,
      `GPU:                    ${info.gpu.model} (${info.gpu.cores} cores)`,
      `MLX Acceleration:       ${info.gpu.mlxAvailable ? 'Available' : 'Not installed'}`,
      `Storage Available:      ${toGB(info.storage.rootFreeBytes)} / ${toGB(info.storage.rootTotalBytes)}`,
      `Development Toolchains:`,
    ];

    for (const [tool, ver] of Object.entries(info.environment)) {
      lines.push(`  • ${tool}: ${ver}`);
    }

    return lines.join('\n');
  }
}
