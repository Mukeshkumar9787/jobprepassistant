import { Question, Requirement, KitSchedule, ScheduleDay, MINUTES_PER_QUESTION } from '@jobprep/shared';

/**
 * DETERMINISTIC Schedule Allocator (Section 8 of Brief).
 * Allocates questions across requested days_available using arithmetic logic.
 * MUST NOT call LLM.
 */
export function buildSchedule(
  questions: Question[],
  requirements: Requirement[],
  daysAvailable: number
): KitSchedule {
  // Ensure daysAvailable is a positive integer >= 1
  const daysCount = Math.max(1, Math.floor(daysAvailable));

  if (questions.length === 0) {
    // Edge case: no questions
    const emptyDays: ScheduleDay[] = [];
    for (let d = 1; d <= daysCount; d++) {
      emptyDays.push({
        day: d,
        focus: d === 1 ? 'General Review' : 'Final Prep',
        question_ids: [],
        minutes: 30,
      });
    }
    return { days_available: daysCount, days: emptyDays };
  }

  // Create lookup map for requirement priority
  const reqPriorityMap = new Map<string, 'must' | 'nice'>();
  for (const r of requirements) {
    reqPriorityMap.set(r.id, r.priority);
  }

  // Calculate priority score for each question
  // Harder difficulty (3 > 2 > 1) and 'must' priority score higher
  const scoredQuestions = questions.map((q) => {
    let hasMustReq = false;
    if (q.requirement_ids) {
      for (const rId of q.requirement_ids) {
        if (reqPriorityMap.get(rId) === 'must') {
          hasMustReq = true;
          break;
        }
      }
    }

    const priorityWeight = hasMustReq ? 3 : 1;
    const score = q.difficulty * priorityWeight;
    const estMinutes = MINUTES_PER_QUESTION[q.difficulty] || 30;

    return {
      question: q,
      score,
      hasMustReq,
      estMinutes,
    };
  });

  // Sort questions by score descending (harder & higher-priority first)
  scoredQuestions.sort((a, b) => b.score - a.score);

  // Initialize schedule days array
  const dayBuckets: Array<{
    day: number;
    question_ids: string[];
    questions: typeof scoredQuestions;
    totalMinutes: number;
    categories: Set<string>;
  }> = [];

  for (let d = 1; d <= daysCount; d++) {
    dayBuckets.push({
      day: d,
      question_ids: [],
      questions: [],
      totalMinutes: 0,
      categories: new Set<string>(),
    });
  }

  // Distribute questions across days
  if (daysCount === 1) {
    // 1-day schedule: all questions land on Day 1
    for (const sq of scoredQuestions) {
      dayBuckets[0].question_ids.push(sq.question.id);
      dayBuckets[0].questions.push(sq);
      dayBuckets[0].totalMinutes += sq.estMinutes;
      dayBuckets[0].categories.add(sq.question.category);
    }
  } else {
    // Multi-day schedule: allocate questions using priority-weighted bucket distribution
    // Hardest questions placed in earlier days first
    for (let i = 0; i < scoredQuestions.length; i++) {
      const sq = scoredQuestions[i];
      // Target day index biased towards earlier days for higher scores
      // e.g., index = Math.floor((i / total) * daysCount)
      let targetDayIdx = Math.floor((i / scoredQuestions.length) * daysCount);
      targetDayIdx = Math.min(daysCount - 1, targetDayIdx);

      dayBuckets[targetDayIdx].question_ids.push(sq.question.id);
      dayBuckets[targetDayIdx].questions.push(sq);
      dayBuckets[targetDayIdx].totalMinutes += sq.estMinutes;
      dayBuckets[targetDayIdx].categories.add(sq.question.category);
    }
  }

  // Verify that every question is placed; if any empty days remain (e.g. 60-day schedule with few questions), assign review focus
  // Format final ScheduleDay array with integer minutes and focus titles
  const days: ScheduleDay[] = dayBuckets.map((bucket) => {
    let focus = 'General Review & Practice';
    if (bucket.categories.size > 0) {
      const cats = Array.from(bucket.categories).map(c => formatCategoryName(c));
      focus = `${cats.join(' & ')} Focus`;
    } else {
      focus = bucket.day === daysCount ? 'Final Interview Simulation' : 'Mock Practice & Review';
    }

    // Ensure minutes is an integer >= 15
    const minutes = bucket.totalMinutes > 0 ? Math.round(bucket.totalMinutes) : 30;

    return {
      day: bucket.day,
      focus,
      question_ids: bucket.question_ids,
      minutes,
    };
  });

  return {
    days_available: daysCount,
    days,
  };
}

function formatCategoryName(cat: string): string {
  switch (cat) {
    case 'technical': return 'Technical Core';
    case 'behavioural': return 'Behavioural & Leadership';
    case 'system-design': return 'System Design';
    case 'company-fit': return 'Company Fit & Culture';
    default: return cat;
  }
}
