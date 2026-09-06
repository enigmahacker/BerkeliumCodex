import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { SessionManager } from '@berkelium/agent';

export class SessionCommand {
  public static async run(
    themeManager: ThemeManager,
    configManager: ConfigManager,
    subaction?: string,
    targetSessionId?: string,
    sessionManager?: SessionManager
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const mgr = sessionManager || new SessionManager();
    const action = (subaction || 'list').toLowerCase();

    switch (action) {
      case 'list': {
        const sessions = await mgr.listSessions();
        console.log();
        console.log(fmt.bold(fmt.primary('PERSISTENT SESSIONS')));
        console.log(fmt.dimmed('Saved state across runs in ~/.berkelium/sessions/'));
        console.log();
        if (sessions.length === 0) {
          console.log(fmt.dimmed('  No saved sessions found.'));
        } else {
          for (const s of sessions.slice(0, 10)) {
            const dateStr = new Date(s.updatedAt).toISOString().replace('T', ' ').slice(0, 19);
            console.log(
              `  • ${fmt.bold(fmt.primary(s.id))}  ${fmt.dimmed(dateStr)}  [${fmt.assistant(s.model)}]`
            );
            if (s.workspaceRoot) {
              console.log(`    ${fmt.dimmed(s.workspaceRoot)}`);
            }
          }
          if (sessions.length > 10) {
            console.log(fmt.dimmed(`  ... and ${sessions.length - 10} earlier sessions.`));
          }
        }
        console.log();
        break;
      }

      case 'new': {
        const config = configManager.getConfig();
        const wsRoot = configManager.getWorkspaceRoot();
        const session = mgr.createSession(config.default_model, 'default', wsRoot);
        await mgr.saveSession(session);
        console.log();
        console.log(fmt.success(`✓ Created new session: ${session.id}`));
        console.log(`  Model:     ${fmt.bold(session.model)}`);
        console.log(`  Workspace: ${fmt.dimmed(session.workspaceRoot)}`);
        console.log();
        break;
      }

      case 'resume': {
        const session = targetSessionId
          ? await mgr.loadSession(targetSessionId)
          : await mgr.getLatestSession();

        if (!session) {
          console.log();
          console.log(
            fmt.error(
              targetSessionId
                ? `Session "${targetSessionId}" not found.`
                : 'No recent session found to resume.'
            )
          );
          console.log();
          return;
        }

        console.log();
        console.log(fmt.success(`✓ Resumed session: ${session.id}`));
        console.log(`  Model:     ${fmt.bold(session.model)}`);
        console.log(`  Messages:  ${session.messages.length}`);
        console.log(`  Tokens:    ${session.tokenUsage.totalTokens.toLocaleString()}`);
        console.log();
        break;
      }

      case 'delete':
      case 'rm': {
        if (!targetSessionId) {
          console.log(fmt.error('Usage: berkelium session delete <session_id>'));
          return;
        }
        const deleted = await mgr.deleteSession(targetSessionId);
        console.log();
        if (deleted) {
          console.log(fmt.success(`✓ Deleted session "${targetSessionId}".`));
        } else {
          console.log(fmt.error(`✗ Failed to delete session "${targetSessionId}" (not found).`));
        }
        console.log();
        break;
      }

      default: {
        console.log();
        console.log(fmt.bold(fmt.primary('BERKELIUM SESSION COMMANDS')));
        console.log('  berkelium session list           List all saved sessions');
        console.log('  berkelium session new            Create a new clean session');
        console.log('  berkelium session resume [id]    Resume a previous session');
        console.log('  berkelium session delete <id>    Delete a saved session');
        console.log();
      }
    }
  }
}
