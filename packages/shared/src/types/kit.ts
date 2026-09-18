// ============================================================
// Kit Structure Types — Appendix A (exact field names required)
// ============================================================

/** Source metadata about the job description and research */
export interface KitSource {
  company: string;
  company_url: string;
  role: string;
  location: string;
  jd_chars: number;
  researched_at: string; // ISO 8601
  pages_used: string[];
}

/** Company brief generated from crawled data */
export interface CompanyBrief {
  summary: string;
  what_they_do: string;
  culture?: string;
  hiring_process?: string;
  interview_tips?: string;
  sources: string[];
}

/** Requirement kind */
export type RequirementKind = 'technical' | 'behavioural' | 'domain';

/** Requirement priority */
export type RequirementPriority = 'must' | 'nice';

/** A single requirement extracted from the job description */
export interface Requirement {
  id: string; // e.g. "r1", "r2"
  text: string;
  kind: RequirementKind;
  priority: RequirementPriority;
}

/** Role breakdown */
export interface KitRole {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Requirement[];
}

/** Question category */
export type QuestionCategory = 'technical' | 'behavioural' | 'system-design' | 'company-fit';

/** A single question in the bank */
export interface Question {
  id: string; // e.g. "q1", "q2"
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
}

/** A flashcard */
export interface Flashcard {
  id: string; // e.g. "f1", "f2"
  front: string;
  back: string;
  requirement_ids: string[];
}

/** A single day in the schedule */
export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number; // integer only
}

/** The schedule */
export interface KitSchedule {
  days_available: number;
  days: ScheduleDay[];
}

/** Coverage report */
export interface KitCoverage {
  uncovered_requirement_ids: string[];
  passes: number;
}

/** The complete kit structure — Appendix A */
export interface Kit {
  source: KitSource;
  company_brief: CompanyBrief;
  role: KitRole;
  questions: Question[];
  flashcards: Flashcard[];
  schedule: KitSchedule;
  coverage: KitCoverage;
}

// ============================================================
// Internal metadata for state management (pinned/edited/generated)
// ============================================================

/** Origin of an item */
export type ItemOrigin = 'generated' | 'user';

/** Metadata attached to editable items for state tracking */
export interface ItemMeta {
  origin: ItemOrigin;
  edited: boolean;
  pinned: boolean; // pinned items survive regeneration
}

/** Question with metadata (internal representation) */
export interface QuestionWithMeta extends Question {
  _meta: ItemMeta;
}

/** Flashcard with metadata (internal representation) */
export interface FlashcardWithMeta extends Flashcard {
  _meta: ItemMeta;
}

// ============================================================
// Kit status during generation
// ============================================================

export type KitStatus = 'pending' | 'researching' | 'generating' | 'ready' | 'failed';

export interface GenerationProgress {
  status: KitStatus;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  error?: string;
}

// ============================================================
// Practice Mode
// ============================================================

/** Confidence level after reviewing a flashcard */
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

/** Record of a single flashcard practice */
export interface FlashcardPractice {
  flashcard_id: string;
  confidence: ConfidenceLevel;
  practiced_at: string; // ISO 8601
}

/** Practice session */
export interface PracticeSession {
  id: string;
  kit_id: string;
  cards: FlashcardPractice[];
  started_at: string;
  completed_at?: string;
}

/** Practice progress summary */
export interface PracticeProgress {
  total_cards: number;
  covered_cards: number;
  average_confidence: number;
  weakest_areas: Array<{
    requirement_id: string;
    requirement_text: string;
    average_confidence: number;
  }>;
  sessions_completed: number;
}
