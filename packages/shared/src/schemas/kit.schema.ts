// ============================================================
// Zod Validation Schemas for Kit Structure
// Ensures generated kits conform to Appendix A at runtime
// ============================================================

import { z } from 'zod';

// --- Atomic validators ---

const nonEmptyString = z.string().min(1);
const urlString = z.string().url();
const isoDateString = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));
const requirementId = z.string().regex(/^r\d+$/, 'Requirement ID must match pattern r1, r2, etc.');
const questionId = z.string().regex(/^q\d+$/, 'Question ID must match pattern q1, q2, etc.');
const flashcardId = z.string().regex(/^f\d+$/, 'Flashcard ID must match pattern f1, f2, etc.');

// --- Kit Source ---

export const KitSourceSchema = z.object({
  company: nonEmptyString,
  company_url: nonEmptyString,
  role: nonEmptyString,
  location: z.string(),
  jd_chars: z.number().int().nonnegative(),
  researched_at: nonEmptyString,
  pages_used: z.array(z.string()),
});

// --- Company Brief ---

export const CompanyBriefSchema = z.object({
  summary: nonEmptyString,
  what_they_do: nonEmptyString,
  culture: z.string().optional(),
  hiring_process: z.string().optional(),
  interview_tips: z.string().optional(),
  sources: z.array(z.string()),
});

// --- Requirement ---

export const RequirementSchema = z.object({
  id: requirementId,
  text: nonEmptyString,
  kind: z.enum(['technical', 'behavioural', 'domain']),
  priority: z.enum(['must', 'nice']),
});

// --- Role ---

export const KitRoleSchema = z.object({
  title: nonEmptyString,
  seniority: nonEmptyString,
  responsibilities: z.array(nonEmptyString).min(1),
  requirements: z.array(RequirementSchema).min(1),
});

// --- Question ---

export const QuestionSchema = z.object({
  id: questionId,
  requirement_ids: z.array(requirementId).min(1),
  category: z.enum(['technical', 'behavioural', 'system-design', 'company-fit']),
  prompt: nonEmptyString,
  answer_outline: nonEmptyString,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

// --- Flashcard ---

export const FlashcardSchema = z.object({
  id: flashcardId,
  front: nonEmptyString,
  back: nonEmptyString,
  requirement_ids: z.array(requirementId).min(1),
});

// --- Schedule Day ---

export const ScheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: nonEmptyString,
  question_ids: z.array(questionId).min(1),
  minutes: z.number().int().positive(),
});

// --- Schedule ---

export const KitScheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(ScheduleDaySchema).min(1),
});

// --- Coverage ---

export const KitCoverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()),
  passes: z.number().int().positive(),
});

// --- Complete Kit ---

export const KitSchema = z.object({
  source: KitSourceSchema,
  company_brief: CompanyBriefSchema,
  role: KitRoleSchema,
  questions: z.array(QuestionSchema).min(1),
  flashcards: z.array(FlashcardSchema),
  schedule: KitScheduleSchema,
  coverage: KitCoverageSchema,
});

// --- Validation helpers ---

/**
 * Validate a kit object against the schema.
 * Returns { success: true, data: Kit } or { success: false, errors: ZodError }
 */
export function validateKit(kit: unknown) {
  return KitSchema.safeParse(kit);
}

/**
 * Deep validation: checks referential integrity beyond schema structure.
 * - Every question's requirement_ids reference existing requirements
 * - Every flashcard's requirement_ids reference existing requirements  
 * - Every schedule day's question_ids reference existing questions
 * - Schedule days count matches days_available
 * - Minutes are integers (not floats)
 */
export function validateKitIntegrity(kit: z.infer<typeof KitSchema>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requirementIds = new Set(kit.role.requirements.map(r => r.id));
  const questionIds = new Set(kit.questions.map(q => q.id));

  // Check question requirement_ids reference valid requirements
  for (const q of kit.questions) {
    for (const rId of q.requirement_ids) {
      if (!requirementIds.has(rId)) {
        errors.push(`Question ${q.id} references non-existent requirement ${rId}`);
      }
    }
  }

  // Check flashcard requirement_ids reference valid requirements
  for (const f of kit.flashcards) {
    for (const rId of f.requirement_ids) {
      if (!requirementIds.has(rId)) {
        errors.push(`Flashcard ${f.id} references non-existent requirement ${rId}`);
      }
    }
  }

  // Check schedule question_ids reference valid questions
  for (const day of kit.schedule.days) {
    for (const qId of day.question_ids) {
      if (!questionIds.has(qId)) {
        errors.push(`Schedule day ${day.day} references non-existent question ${qId}`);
      }
    }
  }

  // Check schedule days count matches days_available
  if (kit.schedule.days.length !== kit.schedule.days_available) {
    errors.push(
      `Schedule has ${kit.schedule.days.length} days but days_available is ${kit.schedule.days_available}`
    );
  }

  // Check minutes are integers
  for (const day of kit.schedule.days) {
    if (!Number.isInteger(day.minutes)) {
      errors.push(`Schedule day ${day.day} has non-integer minutes: ${day.minutes}`);
    }
  }

  // Check difficulty values
  for (const q of kit.questions) {
    if (![1, 2, 3].includes(q.difficulty)) {
      errors.push(`Question ${q.id} has invalid difficulty: ${q.difficulty}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Batch schemas ---

export const BatchCaseSchema = z.object({
  id: nonEmptyString,
  jd: nonEmptyString,
  company_url: nonEmptyString,
  days: z.number().int().positive(),
});

export const BatchInputSchema = z.array(BatchCaseSchema).min(1);

export const BatchKitResultSchema = z.object({
  id: nonEmptyString,
  status: z.enum(['ok', 'failed']),
  kit: KitSchema.nullable(),
  error: z.object({
    code: nonEmptyString,
    message: nonEmptyString,
  }).nullable(),
});

export const BatchOutputSchema = z.object({
  version: z.literal('1.0'),
  generated_at: nonEmptyString,
  kits: z.array(BatchKitResultSchema),
});
