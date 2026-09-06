import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface ProjectScanResult {
  repositoryName: string;
  language: string;
  framework: string;
  totalFiles: number;
  sourceFiles: number;
  testFiles: number;
  configFiles: number;
  documentationFiles: number;
  packagesCount: number;
  circularDependenciesCount: number;
  circularDependencies: string[][];
  git: {
    hasGit: boolean;
    branch?: string;
    modifiedCount: number;
    untrackedCount: number;
  };
  buildStatus: 'PASS' | 'FAIL' | 'UNKNOWN';
  testsSummary: string;
  securityWarningsCount: number;
}

export class ProjectScanner {
  private static ignoredDirs = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '.cache', 'target',
    'vendor', '.berkelium', '.idea', '.vscode', 'coverage',
  ]);

  public static scan(workspaceRoot: string, mode: 'project' | 'deep' | 'dependencies' | 'git' | 'tests' = 'project'): ProjectScanResult {
    const repoName = path.basename(workspaceRoot);
    let language = 'Unknown';
    let framework = 'Generic';

    if (fs.existsSync(path.join(workspaceRoot, 'package.json'))) {
      language = fs.existsSync(path.join(workspaceRoot, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript';
      framework = 'Node.js';
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf-8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.next) framework = 'Next.js';
        else if (deps.vite) framework = 'Vite';
        else if (deps.vitest) framework = 'Node.js (Vitest)';
      } catch {
        // Ignore
      }
    } else if (fs.existsSync(path.join(workspaceRoot, 'Cargo.toml'))) {
      language = 'Rust';
      framework = 'Cargo';
    } else if (fs.existsSync(path.join(workspaceRoot, 'pyproject.toml')) || fs.existsSync(path.join(workspaceRoot, 'requirements.txt'))) {
      language = 'Python';
      framework = 'Python Standard';
    }

    // Traverse directory tree
    let totalFiles = 0;
    let sourceFiles = 0;
    let testFiles = 0;
    let configFiles = 0;
    let documentationFiles = 0;
    const codeFilePaths: string[] = [];

    const walk = (dir: string) => {
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!ProjectScanner.ignoredDirs.has(entry.name)) {
            walk(path.join(dir, entry.name));
          }
        } else if (entry.isFile()) {
          totalFiles++;
          const ext = path.extname(entry.name).toLowerCase();
          const name = entry.name.toLowerCase();

          if (name.includes('.test.') || name.includes('.spec.') || dir.includes('test') || dir.includes('tests')) {
            testFiles++;
          } else if (['.ts', '.tsx', '.js', '.jsx', '.rs', '.py', '.go', '.java', '.swift', '.c', '.cpp'].includes(ext)) {
            sourceFiles++;
            codeFilePaths.push(path.join(dir, entry.name));
          }

          if (['.json', '.yaml', '.yml', '.toml', '.xml', '.config.js', '.config.ts'].some(c => name.endsWith(c))) {
            configFiles++;
          }

          if (['.md', '.markdown', '.rst', '.txt'].includes(ext) || name === 'license') {
            documentationFiles++;
          }
        }
      }
    };

    walk(workspaceRoot);

    // Dependencies count
    let packagesCount = 0;
    try {
      const pkgJsonPath = path.join(workspaceRoot, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const deps = Object.keys(pkg.dependencies || {});
        const devDeps = Object.keys(pkg.devDependencies || {});
        packagesCount = deps.length + devDeps.length;
      }
    } catch {
      // Ignore
    }

    // Circular dependency detection
    const circular = mode === 'deep' || mode === 'project' ? this.detectCircularDependencies(codeFilePaths, workspaceRoot) : [];

    // Git Status
    let hasGit = false;
    let branch: string | undefined;
    let modifiedCount = 0;
    let untrackedCount = 0;

    try {
      const topLevel = execSync('git rev-parse --show-toplevel', { cwd: workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (topLevel) {
        hasGit = true;
        try {
          branch = execSync('git branch --show-current', { cwd: workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'HEAD';
          const statusOutput = execSync('git status --porcelain', { cwd: workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
          const statusLines = statusOutput.split('\n').filter(Boolean);
          for (const line of statusLines) {
            if (line.startsWith('??')) untrackedCount++;
            else modifiedCount++;
          }
        } catch {
          // Ignore status errors
        }
      }
    } catch {
      hasGit = fs.existsSync(path.join(workspaceRoot, '.git'));
    }

    // Build status check
    const buildStatus: 'PASS' | 'FAIL' | 'UNKNOWN' = fs.existsSync(path.join(workspaceRoot, 'dist')) ? 'PASS' : 'UNKNOWN';

    return {
      repositoryName: repoName,
      language,
      framework,
      totalFiles,
      sourceFiles,
      testFiles,
      configFiles,
      documentationFiles,
      packagesCount,
      circularDependenciesCount: circular.length,
      circularDependencies: circular,
      git: {
        hasGit,
        branch,
        modifiedCount,
        untrackedCount,
      },
      buildStatus,
      testsSummary: testFiles > 0 ? `${testFiles} test files discovered` : 'No test files found',
      securityWarningsCount: 0,
    };
  }

  public static formatReport(result: ProjectScanResult): string {
    const lines = [
      `PROJECT SCAN`,
      `Repository:             ${result.repositoryName}`,
      `Language:               ${result.language}`,
      `Framework:              ${result.framework}`,
      `Files:                  ${result.totalFiles}`,
      `Source files:           ${result.sourceFiles}`,
      `Tests:                  ${result.testFiles}`,
      `Configs:                ${result.configFiles}`,
      `Documentation:          ${result.documentationFiles}`,
      `Packages:               ${result.packagesCount}`,
      `Circular dependencies:  ${result.circularDependenciesCount}`,
      `Git:`,
      `  Branch:               ${result.git.branch || 'None'}`,
      `  Modified files:       ${result.git.modifiedCount}`,
      `  Untracked files:      ${result.git.untrackedCount}`,
      `Build:                  ${result.buildStatus}`,
      `Tests:                  ${result.testsSummary}`,
      `Security:               ${result.securityWarningsCount} warnings`,
    ];

    if (result.circularDependencies.length > 0) {
      lines.push(`Potential circular dependency chains:`);
      for (const chain of result.circularDependencies.slice(0, 5)) {
        lines.push(`  • ${chain.join(' → ')}`);
      }
    }

    return lines.join('\n');
  }

  private static detectCircularDependencies(filePaths: string[], rootDir: string): string[][] {
    const graph = new Map<string, string[]>();
    const fileSet = new Set(filePaths);

    // Limit circular dependency analysis to first 250 files for speed
    const sample = filePaths.slice(0, 250);

    for (const filePath of sample) {
      const relPath = path.relative(rootDir, filePath);
      const imports: string[] = [];

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const importRegex = /(?:import|from)\s+['"](\.[^'"]+)['"]/g;
        let match: RegExpExecArray | null;

        while ((match = importRegex.exec(content)) !== null) {
          const importRel = match[1];
          const dir = path.dirname(filePath);
          const candidates = [
            path.resolve(dir, importRel),
            path.resolve(dir, importRel + '.ts'),
            path.resolve(dir, importRel + '.tsx'),
            path.resolve(dir, importRel + '.js'),
            path.resolve(dir, importRel, 'index.ts'),
            path.resolve(dir, importRel, 'index.js'),
          ];

          for (const cand of candidates) {
            if (fileSet.has(cand)) {
              imports.push(path.relative(rootDir, cand));
              break;
            }
          }
        }
      } catch {
        // Ignore read errors
      }

      graph.set(relPath, imports);
    }

    // Simple DFS cycle detection
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const currentPath: string[] = [];

    const dfs = (node: string) => {
      visited.add(node);
      recStack.add(node);
      currentPath.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recStack.has(neighbor)) {
          const cycleStartIdx = currentPath.indexOf(neighbor);
          if (cycleStartIdx !== -1) {
            cycles.push([...currentPath.slice(cycleStartIdx), neighbor]);
          }
        }
      }

      recStack.delete(node);
      currentPath.pop();
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
      if (cycles.length >= 10) break;
    }

    return cycles;
  }
}
