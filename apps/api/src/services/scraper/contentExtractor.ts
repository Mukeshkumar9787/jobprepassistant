import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  headings: string[];
  mainText: string;
  links: Array<{ href: string; text: string; context: string }>;
  metaDescription: string;
}

/**
 * Extract clean, readable content from raw HTML.
 * Strips scripts, styles, nav, footer, and other noise.
 * Preserves heading structure and extracts links with context.
 */
export function extractContent(html: string, baseUrl: string): ExtractedContent {
  const $ = cheerio.load(html);

  // Remove noise elements
  $('script, style, noscript, iframe, svg, canvas, video, audio, picture, source').remove();
  $('nav, footer, .nav, .footer, .sidebar, .cookie-banner, .popup, .modal').remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $('header nav, footer').remove();

  // Extract title
  const title = $('title').first().text().trim() || $('h1').first().text().trim() || '';

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';

  // Extract headings
  const headings: string[] = [];
  $('h1, h2, h3, h4').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2) {
      headings.push(text);
    }
  });

  // Extract main text content
  // Prefer <main>, <article>, or [role="main"] if available
  let mainEl = $('main, article, [role="main"]').first();
  if (mainEl.length === 0) {
    mainEl = $('body');
  }

  const textParts: string[] = [];
  mainEl.find('p, li, td, th, blockquote, dd, dt, figcaption, .content, [class*="description"], [class*="text"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10) {
      textParts.push(text);
    }
  });

  // If very little text found, fall back to all text in body
  let mainText = textParts.join('\n\n');
  if (mainText.length < 100) {
    mainText = mainEl.text()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  // Truncate extremely long content to ~15000 chars
  if (mainText.length > 15000) {
    mainText = mainText.slice(0, 15000) + '\n\n[Content truncated]';
  }

  // Extract links with context
  const links: Array<{ href: string; text: string; context: string }> = [];
  const seenHrefs = new Set<string>();
  
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Skip fragment-only, javascript:, mailto:, tel:
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Resolve relative URLs
    let resolvedHref: string;
    try {
      resolvedHref = new URL(href, baseUrl).href;
    } catch {
      return;
    }

    // Skip duplicates
    if (seenHrefs.has(resolvedHref)) return;
    seenHrefs.add(resolvedHref);

    const text = $(el).text().trim();
    // Get surrounding context (parent text)
    const context = $(el).parent().text().trim().slice(0, 200);

    if (text || href) {
      links.push({ href: resolvedHref, text, context });
    }
  });

  return { title, headings, mainText, links, metaDescription };
}

/**
 * Extract just the readable text from HTML, stripped of all tags.
 * Used for simpler content extraction (e.g., discussion pages).
 */
export function extractPlainText(html: string): string {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return $('body').text()
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
    .slice(0, 10000);
}
