import { ToolOrchestrator } from '@berkelium/tools';
import { EventBus } from '@berkelium/events';
export interface VerificationCheckResult {
    check: string;
    passed: boolean;
    message: string;
    durationMs: number;
}
export interface VerificationReport {
    passed: boolean;
    results: VerificationCheckResult[];
    summary: string;
}
export declare class Verifier {
    private orchestrator;
    private eventBus?;
    constructor(orchestrator: ToolOrchestrator, eventBus?: EventBus);
    runVerificationPipeline(sessionId: string): Promise<VerificationReport>;
}
//# sourceMappingURL=verifier.d.ts.map