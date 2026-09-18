// ============================================================
// Shared Constants
// ============================================================

/** Valid requirement kinds */
export const REQUIREMENT_KINDS = ['technical', 'behavioural', 'domain'] as const;

/** Valid requirement priorities */
export const REQUIREMENT_PRIORITIES = ['must', 'nice'] as const;

/** Valid question categories */
export const QUESTION_CATEGORIES = ['technical', 'behavioural', 'system-design', 'company-fit'] as const;

/** Valid difficulty levels */
export const DIFFICULTY_LEVELS = [1, 2, 3] as const;

/** Valid confidence levels for practice */
export const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

/** Kit generation pipeline steps */
export const PIPELINE_STEPS = [
  'Validating input',
  'Extracting requirements from job description',
  'Crawling company website',
  'Searching for public interview discussion',
  'Generating company brief',
  'Generating technical questions',
  'Generating behavioural questions',
  'Generating system-design questions',
  'Generating company-fit questions',
  'Generating flashcards',
  'Checking coverage (pass 1)',
  'Filling coverage gaps',
  'Checking coverage (pass 2)',
  'Building study schedule',
  'Validating kit structure',
  'Saving kit',
] as const;

/** Minutes per question by difficulty */
export const MINUTES_PER_QUESTION: Record<number, number> = {
  1: 20,
  2: 30,
  3: 45,
};

/** Maximum pages to crawl per company site */
export const MAX_CRAWL_PAGES = 10;

/** Maximum coverage check passes before stopping */
export const MAX_COVERAGE_PASSES = 3;

/** HTTP request timeout in milliseconds */
export const HTTP_TIMEOUT_MS = 10000;

/** Maximum page size to fetch (5MB) */
export const MAX_PAGE_SIZE_BYTES = 5 * 1024 * 1024;
