export class NetworkController {
  private static instance: NetworkController | null = null;
  private networkAllowed = true;

  public static getInstance(): NetworkController {
    if (!NetworkController.instance) {
      NetworkController.instance = new NetworkController();
    }
    return NetworkController.instance;
  }

  public allowNetwork(): void {
    this.networkAllowed = true;
  }

  public denyNetwork(): void {
    this.networkAllowed = false;
  }

  public isNetworkAllowed(): boolean {
    return this.networkAllowed;
  }

  public getStatus(): string {
    return this.networkAllowed ? 'NETWORK: ALLOWED' : 'NETWORK: BLOCKED';
  }
}
