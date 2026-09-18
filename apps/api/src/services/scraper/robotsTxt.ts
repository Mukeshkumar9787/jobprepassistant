import axios from 'axios';
import robotsParser from 'robots-parser';

// Cache parsed robots.txt per domain to avoid refetching
const robotsCache = new Map<string, { parser: ReturnType<typeof robotsParser>; fetchedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch and parse robots.txt for a given URL.
 * Returns whether the path is allowed for our user agent.
 */
export async function isPathAllowed(url: string, userAgent = 'JobPrepBot/1.0'): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const robotsUrl = `${parsed.origin}/robots.txt`;
    const domain = parsed.hostname;

    // Check cache
    const cached = robotsCache.get(domain);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.parser.isAllowed(url, userAgent) ?? true;
    }

    // Fetch robots.txt
    const response = await axios.get(robotsUrl, {
      timeout: 5000,
      validateStatus: (status) => status < 500,
      headers: { 'User-Agent': userAgent },
    });

    if (response.status === 200 && typeof response.data === 'string') {
      const parser = robotsParser(robotsUrl, response.data);
      robotsCache.set(domain, { parser, fetchedAt: Date.now() });
      return parser.isAllowed(url, userAgent) ?? true;
    }

    // No robots.txt or error — assume allowed
    return true;
  } catch {
    // On error fetching robots.txt, assume allowed
    return true;
  }
}

/**
 * Get the crawl delay specified in robots.txt, if any.
 */
export async function getCrawlDelay(url: string, userAgent = 'JobPrepBot/1.0'): Promise<number> {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const cached = robotsCache.get(domain);
    if (cached) {
      return cached.parser.getCrawlDelay(userAgent) || 1;
    }
    return 1; // Default 1 second between requests
  } catch {
    return 1;
  }
}
