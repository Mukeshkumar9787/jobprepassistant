import { MAX_CRAWL_PAGES } from '@jobprep/shared';
import { fetchPage, isFetchError, FetchResult } from './pageFetcher';
import { extractContent, ExtractedContent } from './contentExtractor';
import { rankLinks } from './linkRanker';
import { getBaseDomain } from './urlValidator';

export interface CrawledPage {
  url: string;
  title: string;
  headings: string[];
  text: string;
  category: 'homepage' | 'hiring' | 'about' | 'culture' | 'engineering' | 'other';
}

export interface CrawlResult {
  companyUrl: string;
  companyName: string;
  pagesUsed: string[];
  pages: CrawledPage[];
  hiringPageFound: boolean;
  unreachable: boolean;
  error?: string;
}

/**
 * Crawl a company website:
 * 1. Fetch homepage
 * 2. Extract links and clean text
 * 3. Rank links by relevance to hiring/company info
 * 4. Fetch top-ranked pages up to MAX_CRAWL_PAGES
 * 5. Return structured crawl result
 */
export async function crawlCompanySite(
  companyUrl: string,
  onProgress?: (msg: string) => void
): Promise<CrawlResult> {
  const pagesUsed: string[] = [];
  const pages: CrawledPage[] = [];
  const baseDomain = getBaseDomain(companyUrl);

  onProgress?.(`Fetching homepage: ${companyUrl}`);

  // Step 1: Fetch homepage
  const homepageResult = await fetchPage(companyUrl, { maxRetries: 2 });
  if (isFetchError(homepageResult)) {
    console.warn(`[Crawler] Homepage unreachable (${companyUrl}): ${homepageResult.error}`);
    return {
      companyUrl,
      companyName: baseDomain || 'Unknown Company',
      pagesUsed: [],
      pages: [],
      hiringPageFound: false,
      unreachable: true,
      error: `Company homepage unreachable: ${homepageResult.error}`,
    };
  }

  pagesUsed.push(homepageResult.url);
  const hpContent = extractContent(homepageResult.html, homepageResult.url);
  const companyName = hpContent.title.split(/[-|–•]/)[0].trim() || baseDomain;

  pages.push({
    url: homepageResult.url,
    title: hpContent.title,
    headings: hpContent.headings,
    text: hpContent.mainText,
    category: 'homepage',
  });

  // Step 2: Rank discovered links
  onProgress?.(`Ranking discovered links for ${companyName}...`);
  const rankedLinks = rankLinks(hpContent.links, baseDomain, MAX_CRAWL_PAGES);

  if (rankedLinks.length === 0) {
    onProgress?.(`No additional relevant links found on ${companyUrl}`);
    return {
      companyUrl,
      companyName,
      pagesUsed,
      pages,
      hiringPageFound: false,
      unreachable: false,
    };
  }

  // Step 3: Fetch top-ranked links
  let hiringPageFound = false;
  const crawlLimit = Math.min(rankedLinks.length, MAX_CRAWL_PAGES - 1);

  for (let i = 0; i < crawlLimit; i++) {
    const link = rankedLinks[i];
    onProgress?.(`Fetching page ${i + 1}/${crawlLimit}: ${link.text || link.href}`);

    const pageResult = await fetchPage(link.href, { maxRetries: 2 });
    if (isFetchError(pageResult)) {
      console.warn(`[Crawler] Page fetch failed (${link.href}): ${pageResult.error}`);
      continue; // Skip failed page without crashing
    }

    pagesUsed.push(pageResult.url);
    const content = extractContent(pageResult.html, pageResult.url);
    
    // Determine category based on link ranking reason and title/url
    let category: CrawledPage['category'] = 'other';
    const reasonLower = link.reason.toLowerCase();
    const titleLower = content.title.toLowerCase();
    const urlLower = pageResult.url.toLowerCase();

    if (reasonLower.includes('career') || reasonLower.includes('hiring') || reasonLower.includes('job') || 
        titleLower.includes('career') || titleLower.includes('hiring') || urlLower.includes('career') || urlLower.includes('job')) {
      category = 'hiring';
      hiringPageFound = true;
    } else if (reasonLower.includes('about') || titleLower.includes('about')) {
      category = 'about';
    } else if (reasonLower.includes('culture') || reasonLower.includes('value')) {
      category = 'culture';
    } else if (reasonLower.includes('engineering') || reasonLower.includes('tech')) {
      category = 'engineering';
    }

    pages.push({
      url: pageResult.url,
      title: content.title,
      headings: content.headings,
      text: content.mainText,
      category,
    });
  }

  onProgress?.(`Crawling complete. Fetched ${pages.length} pages (${hiringPageFound ? 'Hiring info found' : 'No explicit hiring page'}).`);

  return {
    companyUrl,
    companyName,
    pagesUsed,
    pages,
    hiringPageFound,
    unreachable: false,
  };
}
