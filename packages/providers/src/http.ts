const DEFAULT_REQUEST_TIMEOUT_MS = 60000;

function describeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'provider endpoint';
  }
}

/**
 * Applies a bounded timeout to the time spent waiting for response headers.
 * Once headers arrive the timer is cleared so long-lived model streams are not
 * cut off; the caller's abort signal still applies for the whole body.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number | undefined
): Promise<Response> {
  const effectiveTimeout =
    timeoutMs && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_REQUEST_TIMEOUT_MS;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, effectiveTimeout);

  const signal = init.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;

  try {
    return await fetch(url, { ...init, signal });
  } catch (err) {
    if (timedOut) {
      throw new Error(
        `Request to ${describeHost(url)} timed out after ${effectiveTimeout}ms.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
