import { execSync } from 'node:child_process';
import { ThemeManager } from '@berkelium/themes';

export class GitCommand {
  private static DESTRUCTIVE_PATTERNS = [
    /reset\s+--hard/i,
    /clean\s+-[a-z]*f/i,
    /push\s+.*--force/i,
    /checkout\s+-[a-z]*f/i,
    /restore\s+--staged\s+--worktree/i,
    /branch\s+-D/i,
  ];

  public static isDestructive(cmd: string): boolean {
    return GitCommand.DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(cmd));
  }

  public static async run(
    themeManager: ThemeManager,
    subaction?: string,
    extraArgs: string[] = [],
    workspaceRoot: string = process.cwd()
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const action = (subaction || 'status').toLowerCase();

    // Check for destructive commands
    const fullCmd = [action, ...extraArgs].join(' ');
    if (GitCommand.isDestructive(fullCmd) && !extraArgs.includes('--force') && !extraArgs.includes('-f')) {
      console.log();
      console.log(fmt.bold(fmt.warning('⚠ DESTRUCTIVE OPERATION DETECTED')));
      console.log(`Command: ${fmt.bold(`git ${fullCmd}`)}`);
      console.log(fmt.error('This may permanently discard uncommitted changes or rewrite history.'));
      console.log(fmt.dimmed('To bypass safety guard, pass --force explicitly.'));
      console.log();
      return;
    }

    try {
      switch (action) {
        case 'status': {
          const statusOutput = execSync('git status --short --branch', {
            cwd: workspaceRoot,
            encoding: 'utf-8',
          });
          console.log();
          console.log(fmt.bold(fmt.primary('GIT WORKING TREE STATUS')));
          console.log();
          if (!statusOutput.trim()) {
            console.log(fmt.success('  Working tree clean (no modified files).'));
          } else {
            console.log(statusOutput);
          }
          console.log();
          break;
        }

        case 'diff': {
          const diffOutput = execSync('git diff', {
            cwd: workspaceRoot,
            encoding: 'utf-8',
          });
          console.log();
          console.log(fmt.bold(fmt.primary('GIT WORKING DIFF')));
          console.log();
          if (!diffOutput.trim()) {
            console.log(fmt.dimmed('  No uncommitted diffs detected.'));
          } else {
            console.log(diffOutput);
          }
          console.log();
          break;
        }

        case 'history':
        case 'log': {
          const limit = extraArgs[0] ? parseInt(extraArgs[0], 10) : 10;
          const logOutput = execSync(
            `git log -n ${isNaN(limit) ? 10 : limit} --format="%C(auto)%h %ad %s" --date=short`,
            {
              cwd: workspaceRoot,
              encoding: 'utf-8',
            }
          );
          console.log();
          console.log(fmt.bold(fmt.primary(`GIT COMMIT HISTORY (Last ${isNaN(limit) ? 10 : limit})`)));
          console.log();
          console.log(logOutput);
          console.log();
          break;
        }

        default: {
          console.log();
          console.log(fmt.bold(fmt.primary('BERKELIUM SAFE GIT COMMANDS')));
          console.log('  berkelium git status             Inspect working tree and branch');
          console.log('  berkelium git diff               Inspect working tree diff');
          console.log('  berkelium git history [n]        Inspect recent commit history');
          console.log();
          console.log(fmt.dimmed('All destructive operations (reset --hard, clean -f, push --force) require --force.'));
          console.log();
        }
      }
    } catch (err: any) {
      console.log(fmt.error(`Git error: ${err.message}`));
    }
  }
}
