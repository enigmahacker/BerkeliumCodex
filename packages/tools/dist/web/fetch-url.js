import { z } from 'zod';
export const FetchUrlInputSchema = z.object({
    url: z.string().url().describe('HTTP/HTTPS URL to fetch'),
});
export class FetchUrlTool {
    metadata = {
        name: 'fetch_url',
        description: 'Fetch content from a web URL and return parsed text or markdown',
        category: 'web',
        risk: 'medium',
        network: true,
    };
    schema = FetchUrlInputSchema;
    async execute(args, _context) {
        try {
            const res = await fetch(args.url, {
                headers: {
                    'User-Agent': 'Berkelium/1.0 (Terminal AI Coding Agent)',
                    Accept: 'text/html,text/plain,application/json',
                },
            });
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
                data: { url: args.url, length: cleaned.length },
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Failed to fetch URL "${args.url}": ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=fetch-url.js.map