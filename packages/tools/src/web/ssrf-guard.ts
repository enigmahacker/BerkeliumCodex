export interface UrlValidationResult {
  safe: boolean;
  error?: string;
  url?: URL;
}

// Disallowed hostnames and metadata endpoints
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'metadata.goog',
  '169.254.169.254',
  '169.254.169.253',
  'instance-data',
]);

/**
 * Parses an IPv4 dotted-quad address into a 32-bit unsigned integer.
 * Returns null if not a valid IPv4 address.
 */
function parseIpv4(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const p = parseInt(parts[i], 10);
    if (isNaN(p) || p < 0 || p > 255 || parts[i] !== String(p)) {
      return null;
    }
    num = (num << 8) | p;
  }
  return num >>> 0;
}

/**
 * Checks if an IPv4 integer falls into private, loopback, link-local, or cloud metadata CIDRs.
 */
function isPrivateIpv4(num: number): { private: boolean; reason?: string } {
  const octet1 = (num >>> 24) & 255;
  const octet2 = (num >>> 16) & 255;

  // 0.0.0.0/8
  if (octet1 === 0) return { private: true, reason: 'Current network (0.0.0.0/8)' };
  // 127.0.0.0/8 Loopback
  if (octet1 === 127) return { private: true, reason: 'Loopback address (127.0.0.0/8)' };
  // 10.0.0.0/8 Private
  if (octet1 === 10) return { private: true, reason: 'Private RFC1918 range (10.0.0.0/8)' };
  // 172.16.0.0/12 Private (172.16.0.0 to 172.31.255.255)
  if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
    return { private: true, reason: 'Private RFC1918 range (172.16.0.0/12)' };
  }
  // 192.168.0.0/16 Private
  if (octet1 === 192 && octet2 === 168) {
    return { private: true, reason: 'Private RFC1918 range (192.168.0.0/16)' };
  }
  // 169.254.0.0/16 Link-Local / Cloud Metadata
  if (octet1 === 169 && octet2 === 254) {
    return { private: true, reason: 'Link-local / Cloud Metadata range (169.254.0.0/16)' };
  }
  // 100.64.0.0/10 Carrier-Grade NAT
  if (octet1 === 100 && octet2 >= 64 && octet2 <= 127) {
    return { private: true, reason: 'Carrier-grade NAT range (100.64.0.0/10)' };
  }

  return { private: false };
}

/**
 * Validates a URL against SSRF, loopback, cloud metadata, and forbidden protocol exploits.
 */
export function validateSafeUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, error: 'URL must be a non-empty string' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (err: any) {
    return { safe: false, error: `Invalid URL format: ${err.message}` };
  }

  // 1. Protocol allowlist (HTTP and HTTPS only)
  const proto = parsed.protocol.toLowerCase();
  if (proto !== 'http:' && proto !== 'https:') {
    return {
      safe: false,
      error: `Blocked unsafe protocol "${proto}". Only http: and https: schemes are permitted.`,
    };
  }

  // 2. Block userinfo / embedded credentials in URL
  if (parsed.username || parsed.password) {
    return {
      safe: false,
      error: 'URLs containing embedded basic authentication credentials are not permitted.',
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // 3. Block localhost & metadata hostnames
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return {
      safe: false,
      error: `SSRF protection blocked access to loopback or internal hostname "${hostname}".`,
    };
  }

  // 4. Check direct IPv4 addresses
  const ipv4Num = parseIpv4(hostname);
  if (ipv4Num !== null) {
    const ipCheck = isPrivateIpv4(ipv4Num);
    if (ipCheck.private) {
      return {
        safe: false,
        error: `SSRF protection blocked access to private/internal IP address "${hostname}" (${ipCheck.reason}).`,
      };
    }
  }

  // 5. Check IPv6 loopback / unique local / link local
  if (
    hostname === '::1' ||
    hostname === '0:0:0:0:0:0:0:1' ||
    hostname.startsWith('fe80:') ||
    hostname.startsWith('fc00:') ||
    hostname.startsWith('fd00:') ||
    hostname.includes('::ffff:127.') ||
    hostname.includes('::ffff:10.') ||
    hostname.includes('::ffff:192.168.')
  ) {
    return {
      safe: false,
      error: `SSRF protection blocked access to private/loopback IPv6 address "${hostname}".`,
    };
  }

  return {
    safe: true,
    url: parsed,
  };
}
