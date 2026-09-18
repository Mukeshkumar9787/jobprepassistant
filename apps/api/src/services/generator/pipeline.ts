import { Kit, Question, Flashcard, Requirement } from '@jobprep/shared';
import { validateKitIntegrity } from '@jobprep/shared';
import { crawlCompanySite } from '../scraper/companyCrawler';
import { searchPublicDiscussion } from '../scraper/publicDiscussion';
import {
  generateStructuredJson,
  buildExtractRequirementsPrompt,
  buildCompanyBriefPrompt,
  buildCategoryQuestionsPrompt,
  buildFlashcardsPrompt,
  buildGapQuestionsPrompt,
  ExtractedRoleData,
  GeneratedCompanyBriefData,
  GeneratedQuestionData,
  GeneratedFlashcardData,
} from '../llm';
import { checkCoverage } from '../coverage/checker';
import { buildSchedule } from '../scheduler/allocator';

export interface PipelineInput {
  jdText: string;
  companyUrl: string;
  daysAvailable: number;
  onProgress?: (step: string) => void;
}

export interface PipelineResult {
  kit: Kit;
  coveragePasses: number;
}

/**
 * Full Pipeline Generator (Sections 3 & 4 of Brief).
 * Executes genuine multi-pass retrieval, extraction, generation, coverage check, and scheduling.
 */
export async function runGenerationPipeline(input: PipelineInput): Promise<PipelineResult> {
  const { jdText, companyUrl, daysAvailable, onProgress } = input;

  // Step 1: Extract requirements & role breakdown from JD
  onProgress?.('Extracting requirements from job description...');
  const reqPrompt = buildExtractRequirementsPrompt(jdText);
  const roleData = await generateStructuredJson<ExtractedRoleData>(reqPrompt);

  // Normalize extracted requirements (ensure IDs r1, r2...)
  const requirements: Requirement[] = (roleData.requirements || []).map((r, idx) => ({
    id: r.id || `r${idx + 1}`,
    text: r.text,
    kind: r.kind || 'technical',
    priority: r.priority || 'must',
  }));

  // Step 2: Crawl company website
  onProgress?.(`Crawling company website: ${companyUrl}`);
  const crawlResult = await crawlCompanySite(companyUrl, onProgress);

  // Step 3: Search public discussion of company interview process
  onProgress?.(`Searching public interview discussion for ${crawlResult.companyName}...`);
  const discussionResult = await searchPublicDiscussion(crawlResult.companyName, onProgress);

  // Step 4: Generate Company Brief
  onProgress?.('Generating company brief...');
  const combinedPagesText = crawlResult.pages
    .map((p) => `--- PAGE (${p.category}): ${p.title} (${p.url}) ---\n${p.text}`)
    .join('\n\n');

  const combinedDiscussionText = discussionResult.discussions
    .map((d) => `--- DISCUSSION (${d.sourceDomain}): ${d.title} ---\n${d.snippet}`)
    .join('\n\n');

  const briefPrompt = buildCompanyBriefPrompt(
    crawlResult.companyName,
    companyUrl,
    combinedPagesText,
    combinedDiscussionText
  );
  const briefData = await generateStructuredJson<GeneratedCompanyBriefData>(briefPrompt);

  // Combine source citations
  const pagesUsed = Array.from(new Set([...crawlResult.pagesUsed, ...discussionResult.sources]));

  // Step 5: Generate Questions by Category (Separate calls per category as required by Section 3 of Brief)
  const categories: Array<'technical' | 'behavioural' | 'system-design' | 'company-fit'> = [
    'technical',
    'behavioural',
    'system-design',
    'company-fit',
  ];

  const allQuestions: Question[] = [];
  let questionCounter = 1;

  for (const cat of categories) {
    onProgress?.(`Generating ${cat} questions...`);
    const catPrompt = buildCategoryQuestionsPrompt(
      cat,
      requirements,
      crawlResult.companyName,
      briefData.hiring_process,
      questionCounter
    );

    const catResult = await generateStructuredJson<{ questions: GeneratedQuestionData[] }>(catPrompt);
    const catQuestions = catResult.questions || [];

    for (const q of catQuestions) {
      allQuestions.push({
        id: `q${questionCounter++}`,
        requirement_ids: q.requirement_ids || (requirements.length > 0 ? [requirements[0].id] : ['r1']),
        category: cat,
        prompt: q.prompt,
        answer_outline: q.answer_outline,
        difficulty: (q.difficulty as 1 | 2 | 3) || 2,
      });
    }
  }

  // Step 6: Generate Flashcards
  onProgress?.('Generating flashcards...');
  const fcPrompt = buildFlashcardsPrompt(requirements);
  const fcResult = await generateStructuredJson<{ flashcards: GeneratedFlashcardData[] }>(fcPrompt);
  const flashcards: Flashcard[] = (fcResult.flashcards || []).map((f, idx) => ({
    id: `f${idx + 1}`,
    front: f.front,
    back: f.back,
    requirement_ids: f.requirement_ids || (requirements.length > 0 ? [requirements[0].id] : ['r1']),
  }));

  // Step 7 & 8: Second Pass — Deterministic Coverage Check & Gap Generation Loop (Section 4 of Brief)
  let currentPass = 1;
  let coverageReport = checkCoverage(requirements, allQuestions, currentPass);

  onProgress?.(`Coverage check pass ${currentPass}: ${coverageReport.coveragePercent}% covered. (${coverageReport.uncoveredMustRequirementIds.length} must-have gaps)`);

  // Max 3 passes to prevent infinite loop
  while (coverageReport.uncoveredMustRequirementIds.length > 0 && currentPass < 3) {
    currentPass++;
    onProgress?.(`Pass ${currentPass}: Generating targeted questions for ${coverageReport.uncoveredMustRequirementIds.length} uncovered must-have requirements...`);

    const uncoveredReqs = requirements.filter((r) => coverageReport.uncoveredMustRequirementIds.includes(r.id));
    const gapPrompt = buildGapQuestionsPrompt(uncoveredReqs, questionCounter);

    const gapResult = await generateStructuredJson<{ questions: GeneratedQuestionData[] }>(gapPrompt);
    const gapQuestions = gapResult.questions || [];

    for (const gq of gapQuestions) {
      allQuestions.push({
        id: `q${questionCounter++}`,
        requirement_ids: gq.requirement_ids || [uncoveredReqs[0]?.id || 'r1'],
        category: gq.category || 'technical',
        prompt: gq.prompt,
        answer_outline: gq.answer_outline,
        difficulty: (gq.difficulty as 1 | 2 | 3) || 2,
      });
    }

    // Re-check coverage
    coverageReport = checkCoverage(requirements, allQuestions, currentPass);
    onProgress?.(`Coverage check pass ${currentPass}: ${coverageReport.coveragePercent}% covered.`);
  }

  // Step 9: Build Schedule (Deterministic arithmetic)
  onProgress?.('Building study schedule...');
  const schedule = buildSchedule(allQuestions, requirements, daysAvailable);

  // Assemble final Kit
  const kit: Kit = {
    source: {
      company: crawlResult.companyName,
      company_url: companyUrl,
      role: roleData.title || 'Role Candidate',
      location: 'Not specified',
      jd_chars: jdText.length,
      researched_at: new Date().toISOString(),
      pages_used: pagesUsed,
    },
    company_brief: {
      summary: briefData.summary || 'Summary unavailable.',
      what_they_do: briefData.what_they_do || 'Details unavailable.',
      culture: briefData.culture,
      hiring_process: briefData.hiring_process,
      interview_tips: briefData.interview_tips,
      sources: pagesUsed,
    },
    role: {
      title: roleData.title || 'Target Role',
      seniority: roleData.seniority || 'Standard',
      responsibilities: roleData.responsibilities || [],
      requirements,
    },
    questions: allQuestions,
    flashcards,
    schedule,
    coverage: coverageReport.coverage,
  };

  // Validate integrity
  const integrity = validateKitIntegrity(kit);
  if (!integrity.valid) {
    console.warn('[Pipeline] Kit integrity warnings:', integrity.errors);
  }

  onProgress?.('Kit generation complete!');
  return { kit, coveragePasses: currentPass };
}
