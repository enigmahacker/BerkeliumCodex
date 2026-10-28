import { ThemeManager } from '@berkelium/themes';
import { AgentEvent } from '@berkelium/events';

export interface TelemetryViewProps {
  model: string;
  provider: string;
  contextUsed: number;
  contextLimit: number;
  totalTokens: number;
  latencySeconds: number;
  effort?: string;
  hackathonMode?: boolean;
}

export class TUIRenderer {
  private themeManager: ThemeManager;
  private currentStreamLine = '';
  private isInReasoning = false;
  private hasActiveStream = false;
  private lastOutcomeStatus: 'completed' | 'partial' | 'blocked' | 'failed' | null = null;

  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager;
  }

  public renderHeader(model: string, provider: string, workspace: string): void {
    const fmt = this.themeManager.getFormatted();
    console.log();
    console.log(fmt.border('╭─ BERKELIUM ─────────────────────────────────────────────╮'));
    console.log(
      fmt.border('│ ') +
        fmt.bold(fmt.primary('MODEL   ')) +
        fmt.assistant(`${model} / ${provider}`).padEnd(46, ' ') +
        fmt.border('│')
    );
    console.log(
      fmt.border('│ ') +
        fmt.dimmed('WORKSPACE ') +
        fmt.muted(workspace.slice(-42)).padEnd(46, ' ') +
        fmt.border('│')
    );
    console.log(fmt.border('╰─────────────────────────────────────────────────────────╯'));
    console.log();
  }

  public renderPromptSymbol(): string {
    const fmt = this.themeManager.getFormatted();
    return fmt.accent('berkelium') + fmt.dimmed(' > ');
  }

  public flushStream(): void {
    if (this.hasActiveStream) {
      process.stdout.write('\n');
      this.hasActiveStream = false;
      this.currentStreamLine = '';
    }
  }

  public handleEvent(event: AgentEvent): void {
    const fmt = this.themeManager.getFormatted();

    switch (event.type) {
      case 'message_started':
        this.flushStream();
        if (event.role === 'assistant') {
          console.log();
          console.log(fmt.assistant(fmt.bold('Berkelium:')));
          this.currentStreamLine = '';
        } else if (event.role === 'user' && event.content) {
          this.lastOutcomeStatus = null;
          console.log();
          console.log(fmt.user(fmt.bold('You:')));
          console.log(event.content);
        }
        break;

      case 'token_received':
        // Guard against any runaway thought tags that escaped prior filters
        if (event.token.includes('<thought>') || event.token.includes('<think>')) {
          break;
        }
        process.stdout.write(event.token);
        this.currentStreamLine += event.token;
        this.hasActiveStream = true;
        break;

      case 'reasoning_started':
        if (!this.isInReasoning) {
          this.isInReasoning = true;
          this.flushStream();
          console.log(fmt.dimmed('● Thinking...'));
        }
        break;

      case 'reasoning_token_received':
        if (!this.isInReasoning) {
          this.isInReasoning = true;
          this.flushStream();
          console.log(fmt.dimmed('● Thinking...'));
        }
        // HARD RULE: NEVER expose internal reasoning tokens to terminal
        break;

      case 'reasoning_finished':
        if (this.isInReasoning) {
          this.isInReasoning = false;
          console.log(fmt.success('✓'));
        }
        break;

      case 'tool_started': {
        this.flushStream();
        const toolName = event.toolName;
        const args = (event.args || {}) as Record<string, any>;
        let actionLabel = `[${toolName}]`;
        let targetDetail = '';

        if (toolName === 'read_file' || toolName === 'filesystem.read') {
          actionLabel = 'Reading';
          targetDetail = args.path || args.file || '';
        } else if (toolName === 'write_file' || toolName === 'edit_file' || toolName === 'delete_file') {
          actionLabel = 'Editing';
          targetDetail = args.path || args.file || '';
        } else if (toolName === 'run_shell' || toolName === 'execute_command') {
          const cmd = args.command || '';
          if (cmd.startsWith('npm test') || cmd.startsWith('pnpm test') || cmd.includes('test')) {
            actionLabel = 'Testing';
            targetDetail = cmd;
          } else {
            actionLabel = 'Executing';
            targetDetail = cmd;
          }
        } else if (toolName === 'git_diff' || toolName === 'git.diff') {
          actionLabel = 'Inspecting Git Diff';
        } else if (toolName === 'diagnostics' || toolName === 'lint') {
          actionLabel = 'Running Diagnostics';
        }

        console.log();
        console.log(
          fmt.accent('● ') +
            fmt.bold(actionLabel) +
            (targetDetail ? '\n  ' + fmt.dimmed(targetDetail) : '')
        );
        break;
      }

      case 'tool_output':
        if (event.output) {
          process.stdout.write(fmt.dimmed(event.output));
        }
        break;

      case 'tool_completed': {
        this.flushStream();
        let summary = `Completed in ${event.durationMs}ms`;
        const output = this.formatToolResult(event.result);
        if (event.toolName === 'read_file' || event.toolName === 'filesystem.read') {
          const lines = output ? output.split('\n').length : 0;
          if (lines > 0) summary = `Read ${lines} lines`;
        } else if (
          event.toolName === 'write_file' ||
          event.toolName === 'edit_file' ||
          event.toolName === 'delete_file'
        ) {
          summary = 'Applied edits';
        } else if (event.toolName === 'run_shell' && /\b(pass(ed)?|passing)\b/i.test(output)) {
          summary = 'Tests passed';
        }
        console.log(fmt.success('✓ ') + fmt.dimmed(summary));
        break;
      }

      case 'tool_failed':
        this.flushStream();
        console.log(
          fmt.error('✗ ') +
            fmt.error(`Failed ${event.toolName}: ${event.error} (${event.durationMs}ms)`)
        );
        break;

      case 'state_changed':
        if (event.description && !this.hasActiveStream) {
          if (
            event.newState === 'RESPONDING' ||
            event.newState === 'THINKING' ||
            (event.previousState === 'RESPONDING' && event.newState === 'IDLE')
          ) {
            break;
          }
          if (event.newState === 'PLANNING') {
            console.log(fmt.accent('● Planning'));
            console.log(`  ${fmt.dimmed(event.description.replace(/^Planning\s+/i, ''))}`);
          } else if (event.newState === 'COMPLETED') {
            if (this.lastOutcomeStatus === null || this.lastOutcomeStatus === 'completed') {
              console.log(fmt.success('✓ Task completed'));
            }
          } else if (event.newState !== 'VERIFYING' && event.newState !== 'EXECUTING') {
            console.log(fmt.dimmed(`● ${event.description}`));
          }
        }
        break;

      case 'permission_requested':
        this.flushStream();
        console.log();
        console.log(fmt.warning('  ⚠ Permission Required: ') + fmt.bold(event.action));
        console.log(fmt.dimmed(`    Target: ${event.target} (Risk: ${event.risk.toUpperCase()})`));
        break;

      case 'permission_granted':
        console.log(
          fmt.success('✓ ') +
            fmt.dimmed(`Permission granted${event.remember ? ' for session' : ' once'}`)
        );
        break;

      case 'permission_denied':
        console.log(
          fmt.error('✗ ') + fmt.dimmed(`Permission denied${event.reason ? `: ${event.reason}` : ''}`)
        );
        break;

      case 'model_changed':
        if (!this.hasActiveStream) {
          console.log(fmt.dimmed(`● Model: ${event.newModel} (${event.provider})`));
        }
        break;

      case 'mode_changed':
        if (!this.hasActiveStream) {
          console.log(fmt.dimmed(`● Mode: ${event.newMode}`));
        }
        break;

      case 'provider_changed':
        if (!this.hasActiveStream) {
          console.log(fmt.dimmed(`● Provider: ${event.newProvider}`));
        }
        break;

      case 'context_compacted':
        if (!this.hasActiveStream) {
          console.log(
            fmt.dimmed(
              `● Context compacted: ${event.tokensBefore} → ${event.tokensAfter} tokens (-${event.reductionPercentage}%)`
            )
          );
        }
        break;

      case 'security_warning':
      case 'security_blocked':
      case 'path_escape_blocked':
      case 'network_request_blocked':
      case 'unsafe_command_blocked':
      case 'secret_detected': {
        this.flushStream();
        const message =
          event.type === 'security_warning'
            ? event.warning
            : event.type === 'secret_detected'
              ? `Detected secret material (${event.secretTypes.join(', ')}) in ${event.source}`
              : event.reason;
        console.log(fmt.warning(`⚠ ${message}`));
        break;
      }

      case 'subagent_started':
        if (!this.hasActiveStream) {
          console.log(fmt.dimmed(`● Subagent ${event.role} started: ${event.task}`));
        }
        break;

      case 'subagent_completed':
        if (!this.hasActiveStream) {
          console.log(fmt.dimmed(`● Subagent ${event.role} completed in ${event.durationMs}ms`));
        }
        break;

      case 'mission_started':
        this.flushStream();
        console.log();
        console.log(fmt.accent(`● Mission: ${event.goal}`));
        console.log(fmt.dimmed(`  ${event.taskCount} task(s)`));
        break;

      case 'mission_task_started':
        console.log(fmt.dimmed(`  ▸ ${event.objective}`));
        break;

      case 'mission_task_completed': {
        const icon = event.status === 'completed' ? fmt.success('✓') : fmt.error('✗');
        console.log(`  ${icon} ${fmt.dimmed(`${event.taskId}: ${event.status}`)}`);
        break;
      }

      case 'verification_started':
        this.flushStream();
        console.log();
        console.log(fmt.accent('● Verifying changes'));
        break;

      case 'verification_completed':
        this.flushStream();
        if (event.passed) {
          console.log(fmt.success('✓ Verification passed'));
        } else {
          console.log(fmt.warning('⚠ Verification issues detected. Initiating remediation...'));
        }
        for (const result of event.results) {
          if (result.status === 'skipped') {
            console.log(`  ${fmt.dimmed(`- ${result.check}: skipped`)}`);
          }
        }
        break;

      case 'task_outcome': {
        this.flushStream();
        this.lastOutcomeStatus = event.status;
        const color =
          event.status === 'completed'
            ? fmt.success
            : event.status === 'partial'
              ? fmt.warning
              : fmt.error;
        console.log(color(event.summary));
        if (event.denied.length > 0) {
          console.log(fmt.dimmed(`  Denied: ${event.denied.join(', ')}`));
        }
        if (event.failed.length > 0) {
          console.log(fmt.dimmed(`  Failed: ${event.failed.join(', ')}`));
        }
        if (event.checkpointId) {
          console.log(
            fmt.dimmed(`  Recovery checkpoint: ${event.checkpointId} (use /undo to restore)`)
          );
        }
        break;
      }

      case 'error':
        this.flushStream();
        console.log();
        console.log(fmt.error(`[Error] ${event.message}`));
        break;
    }
  }

  private formatToolResult(result: unknown): string {
    if (result === null || result === undefined) return '';
    if (typeof result === 'string') return result;
    try {
      return JSON.stringify(result);
    } catch {
      return String(result);
    }
  }

  public renderTelemetryBar(props: TelemetryViewProps): void {
    this.flushStream();
    const fmt = this.themeManager.getFormatted();
    const usedK = (props.contextUsed / 1000).toFixed(1);
    const limitK = (props.contextLimit / 1000).toFixed(0);
    const timeStr = `${props.latencySeconds.toFixed(1)}s`;

    console.log();
    console.log(fmt.border('─'.repeat(60)));
    const parts = [
      `${fmt.dimmed('Model:')} ${fmt.assistant(props.model)}`,
      `${fmt.dimmed('Context:')} ${fmt.primary(`${usedK}k/${limitK}k`)}`,
      `${fmt.dimmed('Tokens:')} ${fmt.muted(props.totalTokens.toLocaleString())}`,
      `${fmt.dimmed('Latency:')} ${fmt.dimmed(timeStr)}`,
      `${fmt.dimmed('Effort:')} ${fmt.accent(props.effort || 'medium')}`,
    ];

    if (props.hackathonMode) {
      parts.push(fmt.accent('⚡ HACKATHON'));
    }

    console.log(parts.join('  |  '));
    console.log(fmt.border('─'.repeat(60)));
    console.log();
  }
}
