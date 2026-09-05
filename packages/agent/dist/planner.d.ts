export interface PlanStep {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    tools?: string[];
    resultSummary?: string;
}
export interface ExecutionPlan {
    goal: string;
    steps: PlanStep[];
    createdAt: number;
}
export declare class Planner {
    static createPlan(goal: string, rawSteps: string[]): ExecutionPlan;
    static updateStepStatus(plan: ExecutionPlan, stepId: string, status: PlanStep['status'], summary?: string): ExecutionPlan;
}
//# sourceMappingURL=planner.d.ts.map