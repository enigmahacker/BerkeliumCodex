export class Planner {
    static createPlan(goal, rawSteps) {
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
    static updateStepStatus(plan, stepId, status, summary) {
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
//# sourceMappingURL=planner.js.map