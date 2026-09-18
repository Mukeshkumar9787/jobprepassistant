import { Requirement, Question, KitCoverage } from '@jobprep/shared';

export interface CoverageCheckResult {
  coveredRequirementIds: string[];
  uncoveredRequirementIds: string[];
  uncoveredMustRequirementIds: string[];
  coveragePercent: number;
  coverage: KitCoverage;
}

/**
 * DETERMINISTIC Coverage Checker (Section 3 & 4 of Brief).
 * Checks which extracted requirements have at least one corresponding question.
 * MUST NOT call LLM.
 */
export function checkCoverage(
  requirements: Requirement[],
  questions: Question[],
  currentPass: number = 1
): CoverageCheckResult {
  const coveredSet = new Set<string>();

  // Collect all requirement IDs referenced by existing questions
  for (const q of questions) {
    if (Array.isArray(q.requirement_ids)) {
      for (const reqId of q.requirement_ids) {
        coveredSet.add(reqId);
      }
    }
  }

  const coveredRequirementIds: string[] = [];
  const uncoveredRequirementIds: string[] = [];
  const uncoveredMustRequirementIds: string[] = [];

  for (const req of requirements) {
    if (coveredSet.has(req.id)) {
      coveredRequirementIds.push(req.id);
    } else {
      uncoveredRequirementIds.push(req.id);
      if (req.priority === 'must') {
        uncoveredMustRequirementIds.push(req.id);
      }
    }
  }

  const totalReqs = requirements.length;
  const coveragePercent = totalReqs > 0 ? Math.round((coveredRequirementIds.length / totalReqs) * 100) : 100;

  return {
    coveredRequirementIds,
    uncoveredRequirementIds,
    uncoveredMustRequirementIds,
    coveragePercent,
    coverage: {
      uncovered_requirement_ids: uncoveredRequirementIds,
      passes: currentPass,
    },
  };
}
