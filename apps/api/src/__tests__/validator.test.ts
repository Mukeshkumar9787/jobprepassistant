import { validateKit, validateKitIntegrity, Kit } from '@jobprep/shared';

describe('Kit Validation & Integrity (Zod)', () => {
  const validKit: Kit = {
    source: {
      company: 'Acme Corp',
      company_url: 'https://acme.com',
      role: 'Senior Engineer',
      location: 'Remote',
      jd_chars: 500,
      researched_at: '2026-09-18T12:00:00.000Z',
      pages_used: ['https://acme.com/careers'],
    },
    company_brief: {
      summary: 'Acme is a fintech leader.',
      what_they_do: 'Build payment infrastructure.',
      sources: ['https://acme.com/careers'],
    },
    role: {
      title: 'Senior Backend Engineer',
      seniority: 'Senior',
      responsibilities: ['Build APIs', 'Scale database'],
      requirements: [
        { id: 'r1', text: '5+ years Node.js', kind: 'technical', priority: 'must' },
      ],
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Explain Event Loop',
        answer_outline: 'Phases...',
        difficulty: 2,
      },
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'What is Node.js?',
        back: 'JS runtime',
        requirement_ids: ['r1'],
      },
    ],
    schedule: {
      days_available: 1,
      days: [
        { day: 1, focus: 'Node.js Core', question_ids: ['q1'], minutes: 30 },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 1,
    },
  };

  it('validates a correct kit structure', () => {
    const valResult = validateKit(validKit);
    expect(valResult.success).toBe(true);

    const integrity = validateKitIntegrity(validKit);
    expect(integrity.valid).toBe(true);
    expect(integrity.errors).toEqual([]);
  });

  it('detects referential integrity errors (missing requirement ID reference)', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit)) as Kit;
    invalidKit.questions[0].requirement_ids = ['r999']; // Non-existent requirement

    const integrity = validateKitIntegrity(invalidKit);
    expect(integrity.valid).toBe(false);
    expect(integrity.errors[0]).toContain('references non-existent requirement r999');
  });

  it('detects schedule referential integrity errors (missing question ID)', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit)) as Kit;
    invalidKit.schedule.days[0].question_ids = ['q999']; // Non-existent question

    const integrity = validateKitIntegrity(invalidKit);
    expect(integrity.valid).toBe(false);
    expect(integrity.errors[0]).toContain('references non-existent question q999');
  });

  it('detects float minutes in schedule', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit)) as Kit;
    invalidKit.schedule.days[0].minutes = 45.5; // Float minute!

    const integrity = validateKitIntegrity(invalidKit);
    expect(integrity.valid).toBe(false);
    expect(integrity.errors[0]).toContain('non-integer minutes');
  });
});
