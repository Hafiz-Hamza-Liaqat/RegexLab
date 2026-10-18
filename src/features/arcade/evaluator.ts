import { executeRegex, validateRegex } from '../../lib/regex/engine.ts';
import type { Mission, MissionTestCase } from '../../types/regex.ts';

export interface TestCaseEvaluationResult {
  testCase: MissionTestCase;
  passed: boolean;
  actualMatches: string[];
  message: string;
}

export interface MissionEvaluationResult {
  passed: boolean;
  results: TestCaseEvaluationResult[];
  error?: string;
  summary: string;
}

/**
 * Deterministically grades a user's regex against a mission's positive and negative test cases.
 * Accepts any regex that satisfies the criteria, rather than requiring an exact string match.
 */
export function evaluateMission(
  mission: Mission,
  pattern: string,
  flags: string
): MissionEvaluationResult {
  if (!pattern || pattern.trim() === '') {
    return {
      passed: false,
      results: [],
      error: 'Enter a regular expression pattern to test.',
      summary: 'No pattern provided.',
    };
  }

  const validation = validateRegex(pattern, flags);
  if (!validation.valid) {
    return {
      passed: false,
      results: [],
      error: validation.error ?? 'Invalid regular expression.',
      summary: 'Syntax error in pattern or flags.',
    };
  }

  const results: TestCaseEvaluationResult[] = [];
  let allPassed = true;

  for (const tc of mission.testCases) {
    const run = executeRegex({
      id: `eval-${Date.now()}-${Math.random()}`,
      pattern,
      flags,
      text: tc.input,
    });

    if (run.status === 'error' || run.status === 'timeout') {
      results.push({
        testCase: tc,
        passed: false,
        actualMatches: [],
        message: run.error ?? 'Execution error during grading.',
      });
      allPassed = false;
      continue;
    }

    const actualMatches = run.matches.map((m) => m.value);

    if (tc.shouldMatch) {
      if (actualMatches.length === 0) {
        results.push({
          testCase: tc,
          passed: false,
          actualMatches: [],
          message: `Expected matches on "${tc.input}", but found none.`,
        });
        allPassed = false;
      } else if (tc.expectedMatches && tc.expectedMatches.length > 0) {
        const matchesMatch =
          actualMatches.length === tc.expectedMatches.length &&
          actualMatches.every((val, idx) => val === tc.expectedMatches![idx]);

        // Special check for group collector mission: verify capture groups exist
        let groupRequirementMet = true;
        if (mission.id === 'mission-5-group-collector') {
          const firstMatch = run.matches[0];
          if (!firstMatch || firstMatch.groups.length < 3) {
            groupRequirementMet = false;
          }
        }

        if (!matchesMatch) {
          results.push({
            testCase: tc,
            passed: false,
            actualMatches,
            message: `Expected [${tc.expectedMatches.join(', ')}], but got [${actualMatches.join(', ')}].`,
          });
          allPassed = false;
        } else if (!groupRequirementMet) {
          results.push({
            testCase: tc,
            passed: false,
            actualMatches,
            message: 'Matched the date string, but did not create 3 distinct capture groups for year, month, and day.',
          });
          allPassed = false;
        } else {
          results.push({
            testCase: tc,
            passed: true,
            actualMatches,
            message: `Passed! Matched: ${actualMatches.join(', ')}`,
          });
        }
      } else {
        results.push({
          testCase: tc,
          passed: true,
          actualMatches,
          message: `Passed! Found ${actualMatches.length} match(es).`,
        });
      }
    } else {
      // Negative test case: should NOT match
      if (actualMatches.length > 0) {
        results.push({
          testCase: tc,
          passed: false,
          actualMatches,
          message: `Should NOT match, but incorrectly matched: "${actualMatches.join(', ')}"`,
        });
        allPassed = false;
      } else {
        results.push({
          testCase: tc,
          passed: true,
          actualMatches: [],
          message: 'Passed! Correctly rejected negative test case.',
        });
      }
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const summary = allPassed
    ? `All ${results.length} test cases passed!`
    : `${passedCount} of ${results.length} test cases passed.`;

  return {
    passed: allPassed,
    results,
    summary,
  };
}
