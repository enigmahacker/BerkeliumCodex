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
export declare class SessionManager {
    private sessionsDir;
    constructor(customDir?: string);
    saveSession(session: SessionData): Promise<void>;
    loadSession(sessionId: string): Promise<SessionData | null>;
    listSessions(): Promise<Array<{
        id: string;
        updatedAt: number;
        model: string;
        workspaceRoot: string;
    }>>;
    getLatestSession(): Promise<SessionData | null>;
}
//# sourceMappingURL=session.d.ts.map