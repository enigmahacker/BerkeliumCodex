export interface BackgroundTask {
    id: number;
    command: string;
    cwd: string;
    status: 'RUNNING' | 'COMPLETE' | 'FAILED';
    startTime: number;
    endTime?: number;
    exitCode?: number;
    outputBuffer: string;
}
export declare class BackgroundTaskManager {
    private static instance;
    private tasks;
    private processes;
    private nextId;
    static getInstance(): BackgroundTaskManager;
    startTask(command: string, cwd?: string): BackgroundTask;
    listTasks(): BackgroundTask[];
    getTask(id: number | string): BackgroundTask | undefined;
    stopTask(id: number | string): boolean;
    stopAll(): void;
    formatTaskList(): string;
}
//# sourceMappingURL=background-task-manager.d.ts.map