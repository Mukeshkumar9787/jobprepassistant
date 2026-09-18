import { checkCoverage } from '../services/coverage/checker';
import { Requirement, Question } from '@jobprep/shared';

describe('Coverage Checker Service (Deterministic)', () => {
  const sampleRequirements: Requirement[] = [
    { id: 'r1', text: '5+ years React', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Node.js & Express', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'GraphQL knowledge', kind: 'technical', priority: 'nice' },
  ];

  it('correctly identifies covered and uncovered requirements', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'React q', answer_outline: 'ans', difficulty: 2 },
    ];

    const result = checkCoverage(sampleRequirements, questions, 1);

    expect(result.coveredRequirementIds).toEqual(['r1']);
    expect(result.uncoveredRequirementIds).toEqual(['r2', 'r3']);
    expect(result.uncoveredMustRequirementIds).toEqual(['r2']);
    expect(result.coveragePercent).toBe(33);
  });

  it('reports 100% coverage when all requirements have questions', () => {
    const questions: Question[] = [
      { id: 'q1', requirement_ids: ['r1', 'r2'], category: 'technical', prompt: 'Combo q', answer_outline: 'ans', difficulty: 2 },
      { id: 'q2', requirement_ids: ['r3'], category: 'technical', prompt: 'GraphQL q', answer_outline: 'ans', difficulty: 1 },
    ];

    const result = checkCoverage(sampleRequirements, questions, 1);

    expect(result.coveredRequirementIds).toEqual(['r1', 'r2', 'r3']);
    expect(result.uncoveredRequirementIds).toEqual([]);
    expect(result.uncoveredMustRequirementIds).toEqual([]);
    expect(result.coveragePercent).toBe(100);
  });
});
