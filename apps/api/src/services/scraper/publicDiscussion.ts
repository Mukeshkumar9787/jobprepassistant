import { search } from 'duck-duck-scrape';
import { fetchPage, isFetchError } from './pageFetcher';
import { extractPlainText } from './contentExtractor';

export interface PublicDiscussionSnippet {
  url: string;
  title: string;
  snippet: string;
  sourceDomain: string;
}

export interface PublicDiscussionResult {
  query: string;
  discussions: PublicDiscussionSnippet[];
  found: boolean;
  sources: string[];
}

/**
 * Search public discussion of a company's interview process using DuckDuckGo.
 * Searches Glassdoor, Reddit, Blind, and open web discussion.
 */
export async function searchPublicDiscussion(
  companyName: string,
  onProgress?: (msg: string) => void
): Promise<PublicDiscussionResult> {
  const query = `"${companyName}" interview process OR questions`;
  onProgress?.(`Searching public discussion for: ${query}`);

  const discussions: PublicDiscussionSnippet[] = [];
  const sources: string[] = [];

  try {
    const searchResults = await search(query, {
      safeSearch: 0,
    });

    if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
      onProgress?.(`No public discussion found for ${companyName}`);
      return { query, discussions: [], found: false, sources: [] };
    }

    // Take top 5 search results
    const topResults = searchResults.results.slice(0, 5);

    for (const res of topResults) {
      if (!res.url) continue;

      let domain = '';
      try {
        domain = new URL(res.url).hostname.replace(/^www\./, '');
      } catch {
        continue;
      }

      sources.push(res.url);
      discussions.push({
        url: res.url,
        title: res.title || '',
        snippet: res.description || '',
        sourceDomain: domain,
      });
    }

    // Optionally try to fetch full text of the top 2 discussion links if available
    for (let i = 0; i < Math.min(discussions.length, 2); i++) {
      const item = discussions[i];
      // Skip glassdoor as it usually blocks scrapers, but grab text if possible from reddit/blogs
      if (!item.sourceDomain.includes('glassdoor.com')) {
        const fetched = await fetchPage(item.url, { maxRetries: 1 });
        if (!isFetchError(fetched)) {
          const plainText = extractPlainText(fetched.html);
          if (plainText.length > 200) {
            item.snippet = plainText.slice(0, 1500) + '...';
          }
        }
      }
    }

    onProgress?.(`Found ${discussions.length} public discussion sources for ${companyName}`);
    return {
      query,
      discussions,
      found: discussions.length > 0,
      sources,
    };
  } catch (err) {
    console.warn(`[PublicDiscussion] Search failed for ${companyName}:`, err);
    return {
      query,
      discussions: [],
      found: false,
      sources: [],
    };
  }
}
