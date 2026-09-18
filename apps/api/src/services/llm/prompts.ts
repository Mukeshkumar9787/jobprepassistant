import { sanitizeAndDelimitText } from './client';
import { QuestionCategory, Requirement } from '@jobprep/shared';

export interface ExtractedRoleData {
  title: string;
  seniority: string;
  responsibilities: string[];
  requirements: Array<{
    id: string; // e.g., "r1", "r2"
    text: string;
    kind: 'technical' | 'behavioural' | 'domain';
    priority: 'must' | 'nice';
  }>;
}

export interface GeneratedCompanyBriefData {
  summary: string;
  what_they_do: string;
  culture?: string;
  hiring_process?: string;
  interview_tips?: string;
}

export interface GeneratedQuestionData {
  id: string; // e.g. "q1"
  requirement_ids: string[];
  category: QuestionCategory;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
}

export interface GeneratedFlashcardData {
  id: string; // e.g. "f1"
  front: string;
  back: string;
  requirement_ids: string[];
}

/**
 * Prompt 1: Extract requirements and role breakdown from Job Description text.
 */
export function buildExtractRequirementsPrompt(jdText: string): { prompt: string; schemaDescription: string } {
  const delimitedJd = sanitizeAndDelimitText('JOB_DESCRIPTION', jdText);

  const prompt = `Analyze the provided Job Description below and extract structured role details and requirements.

${delimitedJd}

Rules:
1. Every requirement must be assigned a unique stable ID like "r1", "r2", "r3", etc.
2. Requirement priority MUST be 'must' (if described as required/essential/5+ years/mandatory) or 'nice' (if described as bonus/plus/preferred/nice to have).
3. Requirement kind MUST be 'technical' (hard skills, tools, programming languages), 'behavioural' (leadership, teamwork, communication, mentoring), or 'domain' (industry knowledge, business context, compliance).
4. Do NOT invent requirements that are not present or strongly implied by the description.
5. If the job description is very short or a 2-line stub, extract whatever is present without fabricating extra details.`;

  const schemaDescription = `{
  "title": "Job title (string)",
  "seniority": "Seniority level e.g. Senior / Mid-Level / Lead / Junior (string)",
  "responsibilities": ["Array of key responsibility bullet points"],
  "requirements": [
    {
      "id": "r1",
      "text": "Full text of requirement",
      "kind": "technical | behavioural | domain",
      "priority": "must | nice"
    }
  ]
}`;

  return { prompt, schemaDescription };
}

/**
 * Prompt 2: Generate Company Brief from crawled company site content & public discussion.
 */
export function buildCompanyBriefPrompt(
  companyName: string,
  companyUrl: string,
  crawledPagesText: string,
  publicDiscussionText: string
): { prompt: string; schemaDescription: string } {
  const delimitedPages = sanitizeAndDelimitText('CRAWLED_COMPANY_PAGES', crawledPagesText || 'No website content available.');
  const delimitedDiscussion = sanitizeAndDelimitText('PUBLIC_INTERVIEW_DISCUSSIONS', publicDiscussionText || 'No public discussions found.');

  const prompt = `Generate a structured company brief for "${companyName}" (${companyUrl}) using ONLY the provided website research and discussion data below.

${delimitedPages}

${delimitedDiscussion}

Rules:
1. "summary": Concise 2-3 sentence overview of what the company does and its market focus.
2. "what_they_do": Detailed explanation of core products, services, or platform.
3. "culture": Key cultural attributes, company values, or work environment (or note if no culture info was found).
4. "hiring_process": Specific details on how they interview/hire if found in the crawled pages or discussions (e.g. take-home test, system design round, panel interview). If nothing was found, state honestly: "No public hiring process details were found on their site."
5. "interview_tips": 2-3 practical tips for interviewing at this company based on the research.
6. HONESTY RULE: If content is thin or unavailable, produce an honest brief stating so rather than inventing fabricated company facts.`;

  const schemaDescription = `{
  "summary": "Brief summary",
  "what_they_do": "Detailed what they do",
  "culture": "Culture overview",
  "hiring_process": "Hiring process details or note if missing",
  "interview_tips": "Interview tips"
}`;

  return { prompt, schemaDescription };
}

/**
 * Prompt 3: Generate Questions for a specific Category (e.g. technical, behavioural, system-design, company-fit)
 */
export function buildCategoryQuestionsPrompt(
  category: QuestionCategory,
  requirements: Requirement[],
  companyName: string,
  hiringInfo?: string,
  startIdNumber: number = 1
): { prompt: string; schemaDescription: string } {
  const reqsJson = JSON.stringify(requirements, null, 2);
  const delimitedReqs = sanitizeAndDelimitText('ROLE_REQUIREMENTS', reqsJson);
  const delimitedHiring = sanitizeAndDelimitText('COMPANY_HIRING_INFO', hiringInfo || 'None');

  const prompt = `Generate realistic, high-quality interview questions specifically for the category: "${category}" for a role at ${companyName}.

${delimitedReqs}

${delimitedHiring}

Rules:
1. Category is strictly "${category}".
2. Question IDs must start from q${startIdNumber}, q${startIdNumber + 1}, etc.
3. EVERY question MUST include a "requirement_ids" array referencing at least one requirement ID (e.g., ["r1", "r2"]) that it directly tests.
4. "prompt": Clear, realistic interview question.
5. "answer_outline": Comprehensive outline of what a strong candidate response should include.
6. "difficulty": Integer 1 (Easy/Basic), 2 (Medium/Standard), or 3 (Hard/Advanced).
7. Contextual tailoring: 
   - If category is 'technical', focus on technical depth, tools, and edge cases in the technical requirements.
   - If category is 'behavioural', use STAR method framing for leadership, teamwork, or conflict requirements.
   - If category is 'system-design', focus on architecture, scalability, trade-offs, and design patterns.
   - If category is 'company-fit', tailor questions to the company's product, mission, or published hiring style.
8. Produce 2 to 4 distinct questions for this category.`;

  const schemaDescription = `{
  "questions": [
    {
      "id": "q1",
      "requirement_ids": ["r1"],
      "category": "${category}",
      "prompt": "Interview question prompt",
      "answer_outline": "Detailed outline of ideal answer",
      "difficulty": 2
    }
  ]
}`;

  return { prompt, schemaDescription };
}

/**
 * Prompt 4: Generate Flashcards for quick review
 */
export function buildFlashcardsPrompt(
  requirements: Requirement[],
  startIdNumber: number = 1
): { prompt: string; schemaDescription: string } {
  const reqsJson = JSON.stringify(requirements, null, 2);
  const delimitedReqs = sanitizeAndDelimitText('ROLE_REQUIREMENTS', reqsJson);

  const prompt = `Generate flashcards for quick active-recall interview preparation based on the requirements below.

${delimitedReqs}

Rules:
1. Flashcard IDs must start from f${startIdNumber}, f${startIdNumber + 1}, etc.
2. EVERY flashcard MUST include a "requirement_ids" array matching at least one requirement ID (e.g., ["r1"]).
3. "front": Clear question, concept, or prompt to test knowledge (e.g., "What is React's Virtual DOM reconciliation process?").
4. "back": Concise, accurate explanation or answer key (3-5 bullet points or short paragraph).
5. Generate 1 to 2 flashcards per must-have requirement, totaling 4 to 8 flashcards.`;

  const schemaDescription = `{
  "flashcards": [
    {
      "id": "f1",
      "front": "Question/Concept on front of card",
      "back": "Key answer/explanation on back of card",
      "requirement_ids": ["r1"]
    }
  ]
}`;

  return { prompt, schemaDescription };
}

/**
 * Prompt 5: Generate Gap Questions specifically for uncovered must-have requirements.
 */
export function buildGapQuestionsPrompt(
  uncoveredReqs: Requirement[],
  startIdNumber: number
): { prompt: string; schemaDescription: string } {
  const reqsJson = JSON.stringify(uncoveredReqs, null, 2);
  const delimitedReqs = sanitizeAndDelimitText('UNCOVERED_MUST_HAVE_REQUIREMENTS', reqsJson);

  const prompt = `The initial question generation pass missed covering some critical MUST-HAVE requirements.
Generate targeted interview questions specifically to cover ALL of the uncovered requirements below.

${delimitedReqs}

Rules:
1. IDs must start from q${startIdNumber}, q${startIdNumber + 1}, etc.
2. EVERY requirement listed in UNCOVERED_MUST_HAVE_REQUIREMENTS must have at least ONE corresponding question in this generated list.
3. Every question must include "requirement_ids" containing the requirement ID it covers.
4. Choose the appropriate "category" ('technical', 'behavioural', 'system-design', or 'company-fit') for each requirement based on its kind.
5. "difficulty": 1, 2, or 3.`;

  const schemaDescription = `{
  "questions": [
    {
      "id": "q10",
      "requirement_ids": ["r3"],
      "category": "technical",
      "prompt": "Targeted question for uncovered requirement",
      "answer_outline": "Answer key",
      "difficulty": 2
    }
  ]
}`;

  return { prompt, schemaDescription };
}
