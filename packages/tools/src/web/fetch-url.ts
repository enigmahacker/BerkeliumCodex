import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
import { validateSafeUrl } from './ssrf-guard.js';

export const FetchUrlInputSchema = z.object({
  url: z.string().describe('HTTP/HTTPS URL to fetch'),
});

export type FetchUrlInput = z.infer<typeof FetchUrlInputSchema>;

export class FetchUrlTool implements Tool<FetchUrlInput> {
  public readonly metadata = {
    name: 'fetch_url',
    description: 'Fetch content from a public web URL with SSRF protection and parsed text output',
    category: 'web' as const,
    risk: 'medium' as const,
    network: true,
  };

  public readonly schema = FetchUrlInputSchema;

  public async execute(args: FetchUrlInput, _context: ToolContext): Promise<ToolExecutionResult> {
    const urlValidation = validateSafeUrl(args.url);
    if (!urlValidation.safe || !urlValidation.url) {
      return {
        success: false,
        output: `Security violation: ${urlValidation.error}`,
        error: 'SSRF_BLOCKED',
      };
    }

    try {
      let currentUrl = urlValidation.url.toString();
      let redirectCount = 0;
      const maxRedirects = 5;
      let res: Response | null = null;

      // Manual redirect loop to validate every intermediate hop against SSRF
      while (redirectCount < maxRedirects) {
        res = await fetch(currentUrl, {
          redirect: 'manual',
          headers: {
            'User-Agent': 'Berkelium/1.0 (Terminal AI Coding Agent; Secure)',
            Accept: 'text/html,text/plain,application/json',
          },
        });

        // If redirect status (301, 302, 303, 307, 308)
        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get('location');
          if (!location) break;

          const nextUrl = new URL(location, currentUrl).toString();
          const nextValidation = validateSafeUrl(nextUrl);
          if (!nextValidation.safe) {
            return {
              success: false,
              output: `Security violation on redirect to "${nextUrl}": ${nextValidation.error}`,
              error: 'SSRF_REDIRECT_BLOCKED',
            };
          }

          currentUrl = nextUrl;
          redirectCount++;
          continue;
        }

        break;
      }

      if (!res) {
        return {
          success: false,
          output: 'Failed to establish connection.',
          error: 'CONNECTION_FAILED',
        };
      }

      if (!res.ok) {
        return {
          success: false,
          output: `HTTP error ${res.status}: ${res.statusText}`,
          error: `HTTP_${res.status}`,
        };
      }

      const text = await res.text();
      // Simple HTML cleanup
      const cleaned = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      const preview = cleaned.slice(0, 10000);

      return {
        success: true,
        output: preview + (cleaned.length > 10000 ? '\n\n... (content truncated)' : ''),
        data: { url: currentUrl, length: cleaned.length },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Failed to fetch URL "${args.url}": ${err.message}`,
        error: err.message,
      };
    }
  }
}
