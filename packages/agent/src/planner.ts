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

export class Planner {
  public static createPlan(goal: string, rawSteps: string[]): ExecutionPlan {
    return {
      goal,
      createdAt: Date.now(),
      steps: rawSteps.map((desc, idx) => ({
        id: `step_${idx + 1}`,
        description: desc,
        status: 'pending',
      })),
    };
  }

  public static updateStepStatus(
    plan: ExecutionPlan,
    stepId: string,
    status: PlanStep['status'],
    summary?: string
  ): ExecutionPlan {
    const steps = plan.steps.map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          status,
          resultSummary: summary || s.resultSummary,
        };
      }
      return s;
    });

    return { ...plan, steps };
  }
}
