import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
export class SessionManager {
    sessionsDir;
    constructor(customDir) {
        this.sessionsDir = customDir || path.join(os.homedir(), '.berkelium', 'sessions');
    }
    async saveSession(session) {
        try {
            await fs.mkdir(this.sessionsDir, { recursive: true });
            const filePath = path.join(this.sessionsDir, `${session.id}.json`);
            session.updatedAt = Date.now();
            await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
        }
        catch { }
    }
    async loadSession(sessionId) {
        try {
            const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async listSessions() {
        try {
            await fs.mkdir(this.sessionsDir, { recursive: true });
            const files = await fs.readdir(this.sessionsDir);
            const list = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await fs.readFile(path.join(this.sessionsDir, file), 'utf-8');
                        const data = JSON.parse(content);
                        list.push({
                            id: data.id,
                            updatedAt: data.updatedAt,
                            model: data.model,
                            workspaceRoot: data.workspaceRoot,
                        });
                    }
                    catch { }
                }
            }
            return list.sort((a, b) => b.updatedAt - a.updatedAt);
        }
        catch {
            return [];
        }
    }
    async getLatestSession() {
        const list = await this.listSessions();
        if (list.length === 0)
            return null;
        return this.loadSession(list[0].id);
    }
    async deleteSession(sessionId) {
        try {
            const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
            await fs.unlink(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    createSession(model, provider, workspaceRoot) {
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
//# sourceMappingURL=session.js.map