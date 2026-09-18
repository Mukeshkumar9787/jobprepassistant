import axios, { AxiosError } from 'axios';
import { HTTP_TIMEOUT_MS, MAX_PAGE_SIZE_BYTES } from '@jobprep/shared';
import { isPathAllowed, getCrawlDelay } from './robotsTxt';
import { validateUrl } from './urlValidator';

// Simple per-domain rate limiter
const lastRequestTime = new Map<string, number>();

export interface FetchResult {
  url: string;
  html: string;
  statusCode: number;
  contentType: string;
}

export interface FetchError {
  url: string;
  error: string;
  statusCode?: number;
}

/**
 * Fetch a single page with rate limiting, retries, robots.txt respect, 
 * content-type validation, and size limits.
 */
export async function fetchPage(
  url: string,
  options: { maxRetries?: number; respectRobots?: boolean } = {}
): Promise<FetchResult | FetchError> {
  const { maxRetries = 3, respectRobots = true } = options;

  // Validate URL
  const validation = await validateUrl(url);
  if (!validation.valid) {
    return { url, error: validation.error || 'Invalid URL' };
  }

  // Check robots.txt
  if (respectRobots) {
    const allowed = await isPathAllowed(url);
    if (!allowed) {
      return { url, error: 'Blocked by robots.txt' };
    }
  }

  // Rate limiting per domain
  const domain = validation.url!.hostname;
  const crawlDelay = await getCrawlDelay(url);
  const lastReq = lastRequestTime.get(domain) || 0;
  const elapsed = Date.now() - lastReq;
  const waitTime = Math.max(0, crawlDelay * 1000 - elapsed);
  
  if (waitTime > 0) {
    await sleep(waitTime);
  }

  // Fetch with retries and exponential backoff
  let lastError: string = '';
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      lastRequestTime.set(domain, Date.now());
      
      const response = await axios.get(url, {
        timeout: HTTP_TIMEOUT_MS,
        maxContentLength: MAX_PAGE_SIZE_BYTES,
        maxBodyLength: MAX_PAGE_SIZE_BYTES,
        headers: {
          'User-Agent': 'JobPrepBot/1.0 (Interview Preparation Tool)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        responseType: 'text',
        // Follow redirects
        maxRedirects: 5,
      });

      // Validate content type
      const contentType = String(response.headers['content-type'] || '');
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml') && !contentType.includes('text/plain')) {
        return { url, error: `Unexpected content type: ${contentType}` };
      }

      return {
        url,
        html: typeof response.data === 'string' ? response.data : String(response.data),
        statusCode: response.status,
        contentType,
      };
    } catch (err) {
      const axiosErr = err as AxiosError;
      
      if (axiosErr.response?.status === 429) {
        // Rate limited — exponential backoff
        const backoffMs = Math.pow(2, attempt + 1) * 1000;
        console.log(`[Scraper] Rate limited on ${url}, backing off ${backoffMs}ms`);
        await sleep(backoffMs);
        lastError = 'Rate limited';
        continue;
      }
      
      if (axiosErr.response?.status && axiosErr.response.status >= 500) {
        // Server error — retry with backoff
        const backoffMs = Math.pow(2, attempt) * 1000;
        await sleep(backoffMs);
        lastError = `Server error: ${axiosErr.response.status}`;
        continue;
      }

      if (axiosErr.code === 'ECONNABORTED' || axiosErr.code === 'ETIMEDOUT') {
        lastError = 'Request timed out';
        if (attempt < maxRetries - 1) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
      }

      // Non-retryable error
      const statusCode = axiosErr.response?.status;
      lastError = axiosErr.message || 'Unknown fetch error';
      return { url, error: lastError, statusCode };
    }
  }

  return { url, error: `Failed after ${maxRetries} retries: ${lastError}` };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isFetchError(result: FetchResult | FetchError): result is FetchError {
  return 'error' in result;
}
