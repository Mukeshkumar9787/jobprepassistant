import { Kit, Question, Flashcard, CompanyBrief } from '@jobprep/shared';
import { generateStructuredJson, buildCategoryQuestionsPrompt, buildCompanyBriefPrompt, buildFlashcardsPrompt } from '../llm';
import { buildSchedule } from '../scheduler/allocator';
import { checkCoverage } from '../coverage/checker';

/**
 * Regenerate a specific category of questions while PRESERVING user-edited and pinned questions (Section 6 of Brief).
 */
export async function regenerateCategoryQuestions(
  kit: Kit,
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit',
  onProgress?: (msg: string) => void
): Promise<Kit> {
  onProgress?.(`Regenerating ${category} questions (preserving user edits)...`);

  // 1. Separate current questions into pinned (edited/user-created) vs unpinned
  const existingCategoryQuestions = kit.questions.filter((q) => q.category === category);
  const otherCategoryQuestions = kit.questions.filter((q) => q.category !== category);

  const pinnedQuestions = existingCategoryQuestions.filter((q) => {
    const meta = (q as any)._meta;
    return meta?.pinned || meta?.edited || meta?.origin === 'user';
  });

  onProgress?.(`Found ${pinnedQuestions.length} pinned/user-edited questions to preserve in ${category}.`);

  // 2. Generate fresh questions for category
  const startIdNum = kit.questions.length + 10;
  const promptInfo = buildCategoryQuestionsPrompt(
    category,
    kit.role.requirements,
    kit.source.company,
    kit.company_brief.hiring_process,
    startIdNum
  );

  const genResult = await generateStructuredJson<{ questions: any[] }>(promptInfo);
  const freshRawQuestions = genResult.questions || [];

  // Format fresh questions
  const freshQuestions: Question[] = freshRawQuestions.map((q, idx) => ({
    id: `q_reg_${Date.now()}_${idx}`,
    requirement_ids: q.requirement_ids || [kit.role.requirements[0]?.id || 'r1'],
    category,
    prompt: q.prompt,
    answer_outline: q.answer_outline,
    difficulty: (q.difficulty as 1 | 2 | 3) || 2,
    _meta: { origin: 'generated', edited: false, pinned: false },
  } as any));

  // 3. Merge pinned questions with fresh questions
  const mergedCategoryQuestions = [...pinnedQuestions, ...freshQuestions];
  const allUpdatedQuestions = [...otherCategoryQuestions, ...mergedCategoryQuestions];

  // 4. Update coverage & schedule deterministically
  const updatedCoverage = checkCoverage(kit.role.requirements, allUpdatedQuestions, kit.coverage.passes);
  const updatedSchedule = buildSchedule(allUpdatedQuestions, kit.role.requirements, kit.schedule.days_available);

  return {
    ...kit,
    questions: allUpdatedQuestions,
    schedule: updatedSchedule,
    coverage: updatedCoverage.coverage,
  };
}

/**
 * Regenerate Company Brief while PRESERVING user-edited brief if pinned.
 */
export async function regenerateCompanyBrief(
  kit: Kit,
  crawledPagesText: string,
  publicDiscussionText: string,
  onProgress?: (msg: string) => void
): Promise<Kit> {
  const briefMeta = (kit.company_brief as any)._meta;
  if (briefMeta?.pinned || briefMeta?.edited) {
    onProgress?.('Company brief is pinned by user — skipping LLM overwrite.');
    return kit;
  }

  onProgress?.('Regenerating company brief...');
  const promptInfo = buildCompanyBriefPrompt(
    kit.source.company,
    kit.source.company_url,
    crawledPagesText,
    publicDiscussionText
  );

  const briefData = await generateStructuredJson<CompanyBrief>(promptInfo);

  const updatedBrief: CompanyBrief = {
    summary: briefData.summary || kit.company_brief.summary,
    what_they_do: briefData.what_they_do || kit.company_brief.what_they_do,
    culture: briefData.culture || kit.company_brief.culture,
    hiring_process: briefData.hiring_process || kit.company_brief.hiring_process,
    interview_tips: briefData.interview_tips || kit.company_brief.interview_tips,
    sources: kit.company_brief.sources,
    _meta: { origin: 'generated', edited: false, pinned: false },
  } as any;

  return {
    ...kit,
    company_brief: updatedBrief,
  };
}

/**
 * Regenerate Schedule deterministically.
 */
export function regenerateSchedule(kit: Kit): Kit {
  const updatedSchedule = buildSchedule(kit.questions, kit.role.requirements, kit.schedule.days_available);
  return {
    ...kit,
    schedule: updatedSchedule,
  };
}
