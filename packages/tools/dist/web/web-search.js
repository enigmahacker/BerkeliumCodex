import { z } from 'zod';
import { validateSafeUrl } from './ssrf-guard.js';
export const WebSearchInputSchema = z.object({
    query: z.string().describe('Search query terms'),
});
export class WebSearchTool {
    metadata = {
        name: 'web_search',
        description: 'Perform a web search for documentation, packages, or error solutions',
        category: 'web',
        risk: 'low',
        network: true,
    };
    schema = WebSearchInputSchema;
    async execute(args, _context) {
        try {
            const endpoint = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(args.query)}`;
            const urlValidation = validateSafeUrl(endpoint);
            if (!urlValidation.safe) {
                return {
                    success: false,
                    output: `Security violation: ${urlValidation.error}`,
                    error: 'SSRF_BLOCKED',
                };
            }
            const res = await fetch(endpoint, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
                },
            });
            if (!res.ok) {
                return {
                    success: false,
                    output: `Search failed with status ${res.status}`,
                    error: `HTTP_${res.status}`,
                };
            }
            const html = await res.text();
            const snippets = [];
            const regex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
            let match;
            while ((match = regex.exec(html)) !== null && snippets.length < 5) {
                const clean = match[1].replace(/<[^>]+>/g, '').trim();
                if (clean)
                    snippets.push(clean);
            }
            const output = snippets.length > 0
                ? snippets.map((s, i) => `${i + 1}. ${s}`).join('\n\n')
                : `Search completed for "${args.query}" (no quick snippets available).`;
            return {
                success: true,
                output,
                data: { query: args.query, resultsCount: snippets.length },
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Web search error: ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=web-search.js.map