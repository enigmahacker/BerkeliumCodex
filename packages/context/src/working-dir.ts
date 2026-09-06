import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

export interface ProjectInfo {
  language: string;
  framework: string;
  packageManager?: string;
  hasGit: boolean;
  gitBranch?: string;
  gitRoot?: string;
}

export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink' | 'other';
  sizeBytes: number;
  modifiedAt: Date;
  isExecutable: boolean;
}

export interface CdResult {
  success: boolean;
  previousDir: string;
  newDir: string;
  project: ProjectInfo;
  message: string;
  error?: string;
}

export class WorkingDirectoryManager {
  private static instance: WorkingDirectoryManager | null = null;
  private currentDir: string;
  private changeListeners: Array<(newDir: string, project: ProjectInfo) => void> = [];

  constructor(initialDir?: string) {
    const target = initialDir || process.cwd();
    this.currentDir = this.resolvePath(target);
  }

  public static getInstance(initialDir?: string): WorkingDirectoryManager {
    if (!WorkingDirectoryManager.instance) {
      WorkingDirectoryManager.instance = new WorkingDirectoryManager(initialDir);
    } else if (initialDir && initialDir !== WorkingDirectoryManager.instance.currentDir) {
      WorkingDirectoryManager.instance.changeDirectory(initialDir);
    }
    return WorkingDirectoryManager.instance;
  }

  public getCwd(): string {
    return this.currentDir;
  }

  public getRelativeHome(): string {
    const home = os.homedir();
    if (this.currentDir === home) return '~';
    if (this.currentDir.startsWith(home + path.sep)) {
      return '~' + this.currentDir.slice(home.length);
    }
    return this.currentDir;
  }

  public getProjectInfo(): ProjectInfo {
    return this.detectProject(this.currentDir);
  }

  public onDirectoryChange(callback: (newDir: string, project: ProjectInfo) => void): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter((cb) => cb !== callback);
    };
  }

  public changeDirectory(targetPath: string): CdResult {
    const previousDir = this.currentDir;
    let resolvedTarget: string;

    try {
      resolvedTarget = this.resolvePath(targetPath);
    } catch (err: any) {
      return {
        success: false,
        previousDir,
        newDir: previousDir,
        project: this.detectProject(previousDir),
        message: `Invalid path: ${targetPath}`,
        error: err.message,
      };
    }

    if (!fs.existsSync(resolvedTarget)) {
      return {
        success: false,
        previousDir,
        newDir: previousDir,
        project: this.detectProject(previousDir),
        message: `Directory does not exist: ${targetPath}`,
        error: 'DIRECTORY_NOT_FOUND',
      };
    }

    const stat = fs.statSync(resolvedTarget);
    if (!stat.isDirectory()) {
      return {
        success: false,
        previousDir,
        newDir: previousDir,
        project: this.detectProject(previousDir),
        message: `Target is not a directory: ${targetPath}`,
        error: 'NOT_A_DIRECTORY',
      };
    }

    // Resolve symlinks safely
    let realTarget: string;
    try {
      realTarget = fs.realpathSync(resolvedTarget);
    } catch (err: any) {
      return {
        success: false,
        previousDir,
        newDir: previousDir,
        project: this.detectProject(previousDir),
        message: `Failed to resolve real path for ${targetPath}: ${err.message}`,
        error: 'CANONICALIZATION_FAILED',
      };
    }

    this.currentDir = realTarget;
    try {
      process.chdir(realTarget);
    } catch {
      // Ignore process chdir errors if restricted
    }

    const project = this.detectProject(this.currentDir);
    for (const listener of this.changeListeners) {
      try {
        listener(this.currentDir, project);
      } catch {
        // Ignore listener error
      }
    }

    return {
      success: true,
      previousDir,
      newDir: this.currentDir,
      project,
      message: `Changed working directory to ${this.getRelativeHome()}`,
    };
  }

  public listDirectory(dirPath?: string): DirectoryEntry[] {
    const target = dirPath ? this.resolvePath(dirPath) : this.currentDir;
    if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
      return [];
    }

    const items = fs.readdirSync(target, { withFileTypes: true });
    const results: DirectoryEntry[] = [];

    for (const item of items) {
      // Hide standard heavy / internal folders
      if (item.name === '.git' && !dirPath) continue;

      const itemPath = path.join(target, item.name);
      let sizeBytes = 0;
      let modifiedAt = new Date();
      let isExecutable = false;

      try {
        const s = fs.statSync(itemPath);
        sizeBytes = s.size;
        modifiedAt = s.mtime;
        isExecutable = (s.mode & 0o111) !== 0;
      } catch {
        // Ignore stat failure
      }

      let type: DirectoryEntry['type'] = 'other';
      if (item.isDirectory()) type = 'directory';
      else if (item.isFile()) type = 'file';
      else if (item.isSymbolicLink()) type = 'symlink';

      results.push({
        name: item.name,
        type,
        sizeBytes,
        modifiedAt,
        isExecutable,
      });
    }

    // Sort: directories first, then alphabetical
    return results.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  public formatStatus(): string {
    const proj = this.getProjectInfo();
    const lines = [
      `Working directory:`,
      `  ${this.getRelativeHome()}`,
      `Repository:`,
      `  ${proj.hasGit ? 'Detected Git repository' : 'Not a Git repository'}`,
    ];
    if (proj.hasGit && proj.gitBranch) {
      lines.push(`Branch:`, `  ${proj.gitBranch}`);
    }
    lines.push(`Project:`, `  ${proj.language}${proj.framework ? ' / ' + proj.framework : ''}`);
    return lines.join('\n');
  }

  private resolvePath(target: string): string {
    if (target.startsWith('~')) {
      const home = os.homedir();
      target = path.join(home, target.slice(1));
    }
    const resolved = path.resolve(this.currentDir || process.cwd(), target);
    if (fs.existsSync(resolved)) {
      try {
        return fs.realpathSync(resolved);
      } catch {
        return resolved;
      }
    }
    return resolved;
  }

  private detectProject(dirPath: string): ProjectInfo {
    let hasGit = false;
    let gitBranch: string | undefined;
    let gitRoot: string | undefined;

    try {
      const rootOutput = execSync('git rev-parse --show-toplevel', { cwd: dirPath, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (rootOutput) {
        hasGit = true;
        gitRoot = rootOutput;
        try {
          gitBranch = execSync('git branch --show-current', { cwd: dirPath, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
        } catch {
          // Detached HEAD or error
          gitBranch = 'HEAD';
        }
      }
    } catch {
      hasGit = fs.existsSync(path.join(dirPath, '.git'));
    }

    // Detect Language & Framework
    let language = 'Unknown';
    let framework = 'Generic';
    let packageManager: string | undefined;

    if (fs.existsSync(path.join(dirPath, 'package.json'))) {
      language = fs.existsSync(path.join(dirPath, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript';
      framework = 'Node.js';

      if (fs.existsSync(path.join(dirPath, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
      else if (fs.existsSync(path.join(dirPath, 'yarn.lock'))) packageManager = 'yarn';
      else if (fs.existsSync(path.join(dirPath, 'package-lock.json'))) packageManager = 'npm';

      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dirPath, 'package.json'), 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.next) framework = 'Next.js';
        else if (deps.vite) framework = 'Vite';
        else if (deps.express) framework = 'Express';
        else if (deps.react) framework = 'React';
      } catch {
        // Ignore JSON parse error
      }
    } else if (fs.existsSync(path.join(dirPath, 'Cargo.toml'))) {
      language = 'Rust';
      framework = 'Cargo';
      packageManager = 'cargo';
    } else if (fs.existsSync(path.join(dirPath, 'pyproject.toml')) || fs.existsSync(path.join(dirPath, 'requirements.txt')) || fs.existsSync(path.join(dirPath, 'Pipfile'))) {
      language = 'Python';
      framework = 'Python Standard';
      if (fs.existsSync(path.join(dirPath, 'poetry.lock'))) packageManager = 'poetry';
      else if (fs.existsSync(path.join(dirPath, 'uv.lock'))) packageManager = 'uv';
      else packageManager = 'pip';
    } else if (fs.existsSync(path.join(dirPath, 'go.mod'))) {
      language = 'Go';
      framework = 'Go Modules';
      packageManager = 'go';
    } else if (fs.existsSync(path.join(dirPath, 'pom.xml')) || fs.existsSync(path.join(dirPath, 'build.gradle'))) {
      language = 'Java';
      framework = fs.existsSync(path.join(dirPath, 'build.gradle')) ? 'Gradle' : 'Maven';
    } else if (fs.existsSync(path.join(dirPath, 'Package.swift'))) {
      language = 'Swift';
      framework = 'Swift Package Manager';
    }

    return {
      language,
      framework,
      packageManager,
      hasGit,
      gitBranch,
      gitRoot,
    };
  }
}
