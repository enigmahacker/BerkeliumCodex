export class NetworkController {
    static instance = null;
    networkAllowed = true;
    static getInstance() {
        if (!NetworkController.instance) {
            NetworkController.instance = new NetworkController();
        }
        return NetworkController.instance;
    }
    allowNetwork() {
        this.networkAllowed = true;
    }
    denyNetwork() {
        this.networkAllowed = false;
    }
    isNetworkAllowed() {
        return this.networkAllowed;
    }
    getStatus() {
        return this.networkAllowed ? 'NETWORK: ALLOWED' : 'NETWORK: BLOCKED';
    }
}
//# sourceMappingURL=network-controller.js.map