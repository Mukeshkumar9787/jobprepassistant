import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';
import { config } from '../../config';

const dnsLookup = promisify(dns.lookup);

// Private/loopback IP ranges to block in production (SSRF protection)
const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

/**
 * Validate a URL for safe fetching.
 * In production, blocks private/loopback addresses (SSRF protection).
 * In dev, allows localhost for testing with local servers.
 */
export async function validateUrl(urlString: string): Promise<{ valid: boolean; url?: URL; error?: string }> {
  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: `Unsupported protocol: ${parsed.protocol}` };
  }

  // In production, block private/loopback addresses
  if (config.isProduction) {
    const hostname = parsed.hostname;

    // Check hostname directly
    for (const range of PRIVATE_RANGES) {
      if (range.test(hostname)) {
        return { valid: false, error: 'Private/loopback addresses are not allowed' };
      }
    }

    if (hostname === 'localhost' || hostname === '[::1]') {
      return { valid: false, error: 'Localhost addresses are not allowed in production' };
    }

    // DNS resolution check — the hostname might resolve to a private IP
    try {
      const { address } = await dnsLookup(hostname);
      for (const range of PRIVATE_RANGES) {
        if (range.test(address)) {
          return { valid: false, error: 'URL resolves to a private/loopback address' };
        }
      }
    } catch {
      // DNS lookup failure — URL might still be valid, let the fetcher handle it
    }
  }

  return { valid: true, url: parsed };
}

/**
 * Resolve a potentially relative URL against a base URL.
 */
export function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return '';
  }
}

/**
 * Extract the base domain from a URL (e.g., "example.com" from "https://www.example.com/path")
 */
export function getBaseDomain(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
