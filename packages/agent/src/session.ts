import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { Message } from '@berkelium/providers';
import { TokenUsage } from '@berkelium/telemetry';

export interface SessionData {
  id: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  provider: string;
  workspaceRoot: string;
  messages: Message[];
  tokenUsage: TokenUsage;
  toolsExecutedCount: number;
  lastGitBranch?: string;
}

export class SessionManager {
  private sessionsDir: string;

  constructor(customDir?: string) {
    this.sessionsDir = customDir || path.join(os.homedir(), '.berkelium', 'sessions');
  }

  public async saveSession(session: SessionData): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
      const filePath = path.join(this.sessionsDir, `${session.id}.json`);
      session.updatedAt = Date.now();
      await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
    } catch {}
  }

  public async loadSession(sessionId: string): Promise<SessionData | null> {
    try {
      const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as SessionData;
    } catch {
      return null;
    }
  }

  public async listSessions(): Promise<Array<{ id: string; updatedAt: number; model: string; workspaceRoot: string }>> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
      const files = await fs.readdir(this.sessionsDir);
      const list: Array<{ id: string; updatedAt: number; model: string; workspaceRoot: string }> = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.sessionsDir, file), 'utf-8');
            const data = JSON.parse(content) as SessionData;
            list.push({
              id: data.id,
              updatedAt: data.updatedAt,
              model: data.model,
              workspaceRoot: data.workspaceRoot,
            });
          } catch {}
        }
      }

      return list.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }

  public async getLatestSession(): Promise<SessionData | null> {
    const list = await this.listSessions();
    if (list.length === 0) return null;
    return this.loadSession(list[0].id);
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  public createSession(
    model: string,
    provider: string,
    workspaceRoot: string
  ): SessionData {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    return {
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model,
      provider,
      workspaceRoot,
      messages: [],
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      toolsExecutedCount: 0,
    };
  }
}
