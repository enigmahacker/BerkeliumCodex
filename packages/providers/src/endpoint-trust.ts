export interface EndpointTrustRequest {
  providerId: string;
  providerName: string;
  endpoint: string;
  message: string;
}

export type EndpointTrustHandler = (request: EndpointTrustRequest) => Promise<boolean>;

export class EndpointTrustError extends Error {
  public readonly providerId: string;
  public readonly endpoint: string;

  constructor(providerId: string, endpoint: string, message: string) {
    super(message);
    this.name = 'EndpointTrustError';
    this.providerId = providerId;
    this.endpoint = endpoint;
  }
}

function normalizeEndpoint(
  providerId: string,
  rawEndpoint: string
): { endpoint: string; isLocal: boolean } {
  let url: URL;
  try {
    url = new URL(rawEndpoint);
  } catch {
    throw new EndpointTrustError(
      providerId,
      rawEndpoint,
      `Invalid provider endpoint: "${rawEndpoint}".`
    );
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new EndpointTrustError(
      providerId,
      rawEndpoint,
      `Provider endpoints must use http or https, received "${url.protocol}".`
    );
  }
  if (url.username || url.password) {
    throw new EndpointTrustError(
      providerId,
      rawEndpoint,
      'Provider endpoint URLs must not contain embedded credentials.'
    );
  }
  if (url.search || url.hash) {
    throw new EndpointTrustError(
      providerId,
      rawEndpoint,
      'Provider endpoint URLs must not contain query strings or fragments.'
    );
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const isLocal =
    hostname === 'localhost' ||
    hostname === '::1' ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname);

  const pathname = url.pathname.replace(/\/+$/, '');
  return {
    endpoint: `${url.protocol}//${url.host}${pathname}`,
    isLocal,
  };
}

export class EndpointTrustPolicy {
  private readonly providerId: string;
  private readonly providerName: string;
  private readonly defaultEndpoint: string;
  private readonly endpointValue: string;
  private readonly localEndpoint: boolean;
  private readonly handler?: EndpointTrustHandler;
  private approved = false;
  private pendingApproval?: Promise<void>;

  constructor(
    providerId: string,
    providerName: string,
    baseUrl: string,
    defaultBaseUrl: string,
    handler?: EndpointTrustHandler
  ) {
    this.providerId = providerId;
    this.providerName = providerName;
    this.handler = handler;

    const normalized = normalizeEndpoint(providerId, baseUrl);
    this.endpointValue = normalized.endpoint;
    this.localEndpoint = normalized.isLocal;
    this.defaultEndpoint = normalizeEndpoint(providerId, defaultBaseUrl).endpoint;
  }

  public getEndpoint(): string {
    return this.endpointValue;
  }

  public isLocal(): boolean {
    return this.localEndpoint;
  }

  public async assertTrusted(): Promise<void> {
    if (this.approved || this.localEndpoint || this.endpointValue === this.defaultEndpoint) {
      return;
    }

    if (!this.pendingApproval) {
      this.pendingApproval = this.requestApproval().finally(() => {
        this.pendingApproval = undefined;
      });
    }
    return this.pendingApproval;
  }

  private async requestApproval(): Promise<void> {
    if (!this.handler) {
      throw new EndpointTrustError(
        this.providerId,
        this.endpointValue,
        `Provider "${this.providerName}" uses an untrusted custom endpoint "${this.endpointValue}". No request or credential was sent.`
      );
    }

    const approved = await this.handler({
      providerId: this.providerId,
      providerName: this.providerName,
      endpoint: this.endpointValue,
      message: `Provider "${this.providerName}" is configured to use custom endpoint "${this.endpointValue}". Approve sending prompts and stored credentials to this endpoint for this session?`,
    });

    if (!approved) {
      throw new EndpointTrustError(
        this.providerId,
        this.endpointValue,
        `Provider "${this.providerName}" endpoint "${this.endpointValue}" was not approved. No request or credential was sent.`
      );
    }

    this.approved = true;
  }
}
