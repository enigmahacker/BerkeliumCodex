export declare class NetworkController {
    private static instance;
    private networkAllowed;
    static getInstance(): NetworkController;
    allowNetwork(): void;
    denyNetwork(): void;
    isNetworkAllowed(): boolean;
    getStatus(): string;
}
//# sourceMappingURL=network-controller.d.ts.map