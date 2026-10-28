import { BackgroundProcessManager, BackgroundTask } from '@berkelium/tools';

export type { BackgroundTask } from '@berkelium/tools';

export class BackgroundTaskManager {
  private static instance: BackgroundTaskManager | null = null;
  private manager: BackgroundProcessManager;

  private constructor() {
    this.manager = BackgroundProcessManager.getInstance();
  }

  public static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  public listTasks(): BackgroundTask[] {
    return this.manager.listTasks();
  }

  public getTask(id: number | string): BackgroundTask | undefined {
    return this.manager.getTask(id);
  }

  public stopTask(id: number | string): boolean {
    return this.manager.stopTask(id);
  }

  public stopAll(): void {
    this.manager.stopAll();
  }

  public formatTaskList(): string {
    return this.manager.formatTaskList();
  }
}
