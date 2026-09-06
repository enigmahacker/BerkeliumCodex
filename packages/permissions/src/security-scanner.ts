import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface SecurityFinding {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'SECRET_LEAK' | 'SENSITIVE_FILE' | 'DANGEROUS_SCRIPT' | 'INSECURE_CONFIG' | 'GIT_HISTORY_LEAK';
  file: string;
  line?: number;
  description: string;
  matchedPattern?: string;
}

export interface SecurityScanResult {
  workspaceRoot: string;
  filesScanned: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: SecurityFinding[];
  durationMs: number;
  disclaimer: string;
}

export class SecurityScanner {
  private static ignoredDirs = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', '.cache', 'target',
    'vendor', '.berkelium', '.idea', '.vscode', 'coverage',
  ]);

  private static secretPatterns: Array<{ pattern: RegExp; name: string; severity: 'HIGH' | 'MEDIUM' }> = [
    { pattern: /\b(AKIA[0-9A-Z]{16})\b/, name: 'AWS Access Key ID', severity: 'HIGH' },
    { pattern: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})\b/, name: 'GitHub Personal Access Token', severity: 'HIGH' },
    { pattern: /\b(sk-[a-zA-Z0-9]{32,64}|sk-proj-[a-zA-Z0-9_-]{32,128})\b/, name: 'OpenAI API Key', severity: 'HIGH' },
    { pattern: /\b(AIza[0-9A-Za-z-_]{35})\b/, name: 'Google API Key', severity: 'HIGH' },
    { pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, name: 'Private Key Block', severity: 'HIGH' },
    { pattern: /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/, name: 'Slack Token', severity: 'HIGH' },
    { pattern: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql):\/\/[^:]+:([^\s@]+)@/, name: 'Database Connection String with Plaintext Password', severity: 'HIGH' },
    { pattern: /(?:api[_-]?key|secret|password|auth[_-]?token)\s*[:=]\s*["']([^"'\s]{8,})["']/i, name: 'Generic Hardcoded Secret or Token', severity: 'MEDIUM' },
  ];

  private static sensitiveFileNames = [
    { pattern: /^\.env(?:\.[\w.-]+)?$/i, severity: 'HIGH' as const, name: 'Environment secrets file' },
    { pattern: /\.(?:pem|key|pfx|p12)$/i, severity: 'HIGH' as const, name: 'Cryptographic private key/certificate file' },
    { pattern: /(?:id_rsa|id_ed25519|id_ecdsa)(?:\.pub)?$/i, severity: 'HIGH' as const, name: 'SSH key file' },
    { pattern: /(?:credentials|secrets|service-account)\.json$/i, severity: 'HIGH' as const, name: 'Service account / credentials JSON' },
  ];

  public static scan(workspaceRoot: string): SecurityScanResult {
    const startTime = performance.now();
    const findings: SecurityFinding[] = [];
    let filesScanned = 0;

    const walk = (dir: string) => {
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!SecurityScanner.ignoredDirs.has(entry.name)) {
            walk(path.join(dir, entry.name));
          }
        } else if (entry.isFile()) {
          filesScanned++;
          const fullPath = path.join(dir, entry.name);
          const relPath = path.relative(workspaceRoot, fullPath);

          // 1. Check sensitive filename
          for (const s of SecurityScanner.sensitiveFileNames) {
            if (s.pattern.test(entry.name)) {
              findings.push({
                severity: s.severity,
                category: 'SENSITIVE_FILE',
                file: relPath,
                description: `${s.name} detected in working tree: ${entry.name}`,
              });
              break;
            }
          }

          // 2. Scan file content if text and < 1MB
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size > 1024 * 1024) continue; // Skip large binaries

            const ext = path.extname(entry.name).toLowerCase();
            const textExtensions = ['.ts', '.js', '.json', '.env', '.yaml', '.yml', '.toml', '.sh', '.bash', '.py', '.rs', '.go', '.txt', '.md'];
            if (!textExtensions.includes(ext) && !entry.name.startsWith('.env')) {
              continue;
            }

            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];

              // Check secrets
              for (const sec of SecurityScanner.secretPatterns) {
                if (sec.pattern.test(line)) {
                  findings.push({
                    severity: sec.severity,
                    category: 'SECRET_LEAK',
                    file: relPath,
                    line: i + 1,
                    description: `Potential ${sec.name} detected in line ${i + 1}`,
                  });
                  break;
                }
              }

              // Check dangerous scripts if shell file
              if (ext === '.sh' || ext === '.bash') {
                if (/rm\s+-rf\s+\//.test(line)) {
                  findings.push({
                    severity: 'HIGH',
                    category: 'DANGEROUS_SCRIPT',
                    file: relPath,
                    line: i + 1,
                    description: 'Dangerous recursive root deletion command in script',
                  });
                }
                if (/chmod\s+(?:-R\s+)?777/.test(line)) {
                  findings.push({
                    severity: 'MEDIUM',
                    category: 'INSECURE_CONFIG',
                    file: relPath,
                    line: i + 1,
                    description: 'Overly permissive permissions (777) in script',
                  });
                }
              }
            }
          } catch {
            // Ignore read errors
          }
        }
      }
    };

    walk(workspaceRoot);

    // 3. Scan recent Git commit diffs for secret leaks
    try {
      const gitLog = execSync('git log -p -n 5', { cwd: workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }).toString();
      const addedLines = gitLog.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
      for (const line of addedLines.slice(0, 500)) {
        for (const sec of SecurityScanner.secretPatterns) {
          if (sec.pattern.test(line)) {
            findings.push({
              severity: 'HIGH',
              category: 'GIT_HISTORY_LEAK',
              file: '(git commit history)',
              description: `Potential ${sec.name} found in recent Git commit diffs`,
            });
            break;
          }
        }
      }
    } catch {
      // Ignore git errors
    }

    const highCount = findings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
    const lowCount = findings.filter(f => f.severity === 'LOW').length;

    return {
      workspaceRoot,
      filesScanned,
      highCount,
      mediumCount,
      lowCount,
      findings,
      durationMs: Math.round(performance.now() - startTime),
      disclaimer: 'This scan does not guarantee the absence of vulnerabilities.',
    };
  }

  public static formatReport(result: SecurityScanResult): string {
    const lines = [
      `SECURITY ASSESSMENT REPORT`,
      `Workspace:  ${result.workspaceRoot}`,
      `Files:      ${result.filesScanned} scanned (${result.durationMs}ms)`,
      ``,
      `Findings:`,
      `  HIGH:     ${result.highCount}`,
      `  MEDIUM:   ${result.mediumCount}`,
      `  LOW:      ${result.lowCount}`,
      ``,
    ];

    if (result.findings.length > 0) {
      lines.push(`Discovered Issues:`);
      for (const f of result.findings.slice(0, 10)) {
        lines.push(`  [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ''} — ${f.description}`);
      }
      if (result.findings.length > 10) {
        lines.push(`  ... and ${result.findings.length - 10} more findings`);
      }
      lines.push(``);
    } else {
      lines.push(`✓ No secrets, sensitive files, or high-risk scripts detected.`);
      lines.push(``);
    }

    lines.push(result.disclaimer);
    return lines.join('\n');
  }
}
