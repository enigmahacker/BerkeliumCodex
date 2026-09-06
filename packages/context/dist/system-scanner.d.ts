export interface SystemInfoResult {
    os: {
        platform: string;
        release: string;
        architecture: string;
        kernel: string;
        hostname: string;
    };
    cpu: {
        model: string;
        cores: number;
        performanceCores?: number;
        efficiencyCores?: number;
        loadAverage: number[];
    };
    memory: {
        totalBytes: number;
        freeBytes: number;
        modelBudgetBytes: number;
    };
    storage: {
        rootTotalBytes: number;
        rootFreeBytes: number;
        projectDiskUsageBytes?: number;
        modelCacheSizeBytes?: number;
    };
    gpu: {
        model: string;
        cores: number;
        mlxAvailable: boolean;
    };
    environment: Record<string, string>;
    processes: Array<{
        pid: number;
        command: string;
    }>;
    network: {
        interfaces: string[];
        localIp?: string;
        internetReachable: boolean;
    };
}
export declare class SystemScanner {
    static scan(): SystemInfoResult;
    static formatReport(info: SystemInfoResult, section?: string): string;
}
//# sourceMappingURL=system-scanner.d.ts.map