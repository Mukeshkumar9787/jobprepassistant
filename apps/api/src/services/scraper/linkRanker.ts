/**
 * Link Ranker — Heuristic scoring for crawled links.
 * 
 * This is DETERMINISTIC code, not LLM-driven.
 * Scores links by URL path keywords and anchor text to identify
 * hiring, careers, about, culture, and engineering pages.
 */

interface ScoredLink {
  href: string;
  text: string;
  context: string;
  score: number;
  reason: string;
}

// Keyword weights for URL path components
const PATH_KEYWORDS: Record<string, number> = {
  'careers': 10,
  'career': 10,
  'jobs': 10,
  'job': 8,
  'hiring': 10,
  'hire': 8,
  'join': 8,
  'join-us': 9,
  'join-our-team': 9,
  'work-with-us': 9,
  'work-here': 9,
  'openings': 9,
  'positions': 8,
  'vacancies': 8,
  'opportunities': 7,
  'recruitment': 8,
  'talent': 7,
  'about': 6,
  'about-us': 6,
  'who-we-are': 6,
  'our-team': 7,
  'team': 5,
  'people': 5,
  'culture': 7,
  'values': 6,
  'mission': 5,
  'handbook': 8,
  'engineering': 6,
  'blog': 4,
  'engineering-blog': 7,
  'tech-blog': 6,
  'how-we-work': 7,
  'how-we-hire': 10,
  'interview': 9,
  'interview-process': 10,
  'hiring-process': 10,
  'what-to-expect': 8,
  'benefits': 5,
  'perks': 5,
  'compensation': 5,
  'life-at': 6,
};

// Keyword weights for anchor text
const TEXT_KEYWORDS: Record<string, number> = {
  'career': 10,
  'careers': 10,
  'job': 8,
  'jobs': 8,
  'hiring': 9,
  'join us': 9,
  'join our team': 9,
  'work with us': 9,
  'open positions': 9,
  'openings': 8,
  'about us': 6,
  'about': 5,
  'our team': 6,
  'team': 4,
  'culture': 7,
  'handbook': 7,
  'how we hire': 10,
  'interview': 9,
  'engineering': 5,
  'blog': 3,
  'values': 5,
  'mission': 4,
  'benefits': 4,
  'what we do': 6,
  'who we are': 5,
  'life at': 5,
};

/**
 * Score and rank a list of links by relevance to hiring/company info.
 * Returns links sorted by score (highest first), limited to maxResults.
 */
export function rankLinks(
  links: Array<{ href: string; text: string; context: string }>,
  baseDomain: string,
  maxResults: number = 15
): ScoredLink[] {
  const scored: ScoredLink[] = [];

  for (const link of links) {
    let score = 0;
    const reasons: string[] = [];

    // Only consider links on the same domain
    try {
      const linkDomain = new URL(link.href).hostname.replace(/^www\./, '');
      if (linkDomain !== baseDomain) {
        continue; // Skip external links
      }
    } catch {
      continue;
    }

    // Score by URL path keywords
    const path = new URL(link.href).pathname.toLowerCase();
    const pathSegments = path.split(/[/\-_]/).filter(Boolean);
    
    for (const segment of pathSegments) {
      if (PATH_KEYWORDS[segment]) {
        score += PATH_KEYWORDS[segment];
        reasons.push(`path:${segment}`);
      }
    }

    // Check for compound path matches (e.g., /about/careers)
    const fullPath = path.replace(/\//g, '-');
    for (const [keyword, weight] of Object.entries(PATH_KEYWORDS)) {
      if (fullPath.includes(keyword) && !pathSegments.includes(keyword)) {
        score += Math.floor(weight * 0.5);
        reasons.push(`path-compound:${keyword}`);
      }
    }

    // Score by anchor text
    const textLower = link.text.toLowerCase().trim();
    for (const [keyword, weight] of Object.entries(TEXT_KEYWORDS)) {
      if (textLower.includes(keyword)) {
        score += weight;
        reasons.push(`text:${keyword}`);
        break; // Only count best text match
      }
    }

    // Score by surrounding context
    const contextLower = (link.context || '').toLowerCase();
    const contextKeywords = ['hiring', 'career', 'job', 'interview', 'team', 'culture', 'join'];
    for (const kw of contextKeywords) {
      if (contextLower.includes(kw)) {
        score += 2;
        reasons.push(`context:${kw}`);
      }
    }

    // Penalize very deep paths (more than 4 segments)
    if (pathSegments.length > 4) {
      score -= 2;
    }

    // Penalize non-HTML-looking paths (files, media)
    if (/\.(pdf|png|jpg|jpeg|gif|svg|css|js|zip|mp4|mp3|ico|woff|ttf)$/i.test(path)) {
      score = -1;
    }

    if (score > 0) {
      scored.push({
        ...link,
        score,
        reason: reasons.join(', '),
      });
    }
  }

  // Sort by score descending, then by URL length ascending (prefer shorter paths)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.href.length - b.href.length;
  });

  // Deduplicate by normalized URL
  const seen = new Set<string>();
  const deduplicated: ScoredLink[] = [];
  for (const link of scored) {
    const normalized = normalizeUrl(link.href);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      deduplicated.push(link);
    }
  }

  return deduplicated.slice(0, maxResults);
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, fragment, and common tracking params
    let normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
