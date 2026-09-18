import { buildSchedule } from '../services/scheduler/allocator';
import { Question, Requirement } from '@jobprep/shared';

describe('Schedule Allocator Service (Deterministic)', () => {
  const sampleRequirements: Requirement[] = [
    { id: 'r1', text: '5+ years React', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Node.js & Express', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Mentoring junior devs', kind: 'behavioural', priority: 'nice' },
  ];

  const sampleQuestions: Question[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Explain React reconciliation', answer_outline: 'Virtual DOM diffing...', difficulty: 3 },
    { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'Node.js event loop', answer_outline: 'Phases of event loop...', difficulty: 2 },
    { id: 'q3', requirement_ids: ['r3'], category: 'behavioural', prompt: 'Describe a time you mentored', answer_outline: 'STAR method...', difficulty: 1 },
    { id: 'q4', requirement_ids: ['r1'], category: 'system-design', prompt: 'Design a frontend state tree', answer_outline: 'Redux vs Context...', difficulty: 3 },
  ];

  it('allocates exactly the number of days requested', () => {
    const daysRequested = 5;
    const schedule = buildSchedule(sampleQuestions, sampleRequirements, daysRequested);

    expect(schedule.days_available).toBe(5);
    expect(schedule.days.length).toBe(5);
    expect(schedule.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
  });

  it('ensures all minutes are positive integers', () => {
    const schedule = buildSchedule(sampleQuestions, sampleRequirements, 3);

    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThan(0);
    }
  });

  it('places harder & must-have questions in earlier days', () => {
    const schedule = buildSchedule(sampleQuestions, sampleRequirements, 3);

    // Day 1 should contain high difficulty (difficulty=3) must-have questions
    const day1QuestionIds = schedule.days[0].question_ids;
    expect(day1QuestionIds).toContain('q1');
  });

  it('handles 1-day schedule edge case', () => {
    const schedule = buildSchedule(sampleQuestions, sampleRequirements, 1);

    expect(schedule.days_available).toBe(1);
    expect(schedule.days.length).toBe(1);
    expect(schedule.days[0].question_ids.length).toBe(sampleQuestions.length);
    expect(Number.isInteger(schedule.days[0].minutes)).toBe(true);
  });

  it('handles 60-day schedule edge case gracefully', () => {
    const schedule = buildSchedule(sampleQuestions, sampleRequirements, 60);

    expect(schedule.days_available).toBe(60);
    expect(schedule.days.length).toBe(60);
    expect(schedule.days.every((d) => Number.isInteger(d.minutes))).toBe(true);
  });
});
