import { describe, it, expect } from 'vitest';
import { evaluateMission } from '../../src/features/arcade/evaluator.ts';
import { MISSIONS } from '../../src/data/missions.ts';

describe('Arcade Mission Evaluator', () => {
  const mission1 = MISSIONS.find((m) => m.id === 'mission-1-number-scout')!;
  const mission2 = MISSIONS.find((m) => m.id === 'mission-2-word-hunter')!;
  const mission5 = MISSIONS.find((m) => m.id === 'mission-5-group-collector')!;

  it('passes mission 1 with standard solution \\d+', () => {
    const evalResult = evaluateMission(mission1, '\\d+', 'g');
    expect(evalResult.passed).toBe(true);
    expect(evalResult.results.every((r) => r.passed)).toBe(true);
  });

  it('accepts alternative valid solutions like [0-9]+', () => {
    const evalResult = evaluateMission(mission1, '[0-9]+', 'g');
    expect(evalResult.passed).toBe(true);
  });

  it('rejects trivial cheat solutions like .* that match negative test cases', () => {
    const evalResult = evaluateMission(mission1, '.*', 'g');
    expect(evalResult.passed).toBe(false);
  });

  it('verifies word boundaries in mission 2 (cat vs caterpillar)', () => {
    // Failing solution without word boundary
    const failResult = evaluateMission(mission2, 'cat', 'g');
    expect(failResult.passed).toBe(false);

    // Correct solution with word boundary
    const passResult = evaluateMission(mission2, '\\bcat\\b', 'g');
    expect(passResult.passed).toBe(true);
  });

  it('requires capture groups for group collector mission 5', () => {
    // Matches text but without parentheses
    const noGroupsResult = evaluateMission(mission5, '\\d{4}-\\d{2}-\\d{2}', 'g');
    expect(noGroupsResult.passed).toBe(false);

    // Solution with 3 capture groups
    const passResult = evaluateMission(mission5, '(\\d{4})-(\\d{2})-(\\d{2})', 'g');
    expect(passResult.passed).toBe(true);
  });

  it('handles empty pattern and syntax errors gracefully without throwing', () => {
    const emptyResult = evaluateMission(mission1, '', 'g');
    expect(emptyResult.passed).toBe(false);
    expect(emptyResult.error).toContain('Enter a regular expression');

    const invalidSyntaxResult = evaluateMission(mission1, '[unclosed', 'g');
    expect(invalidSyntaxResult.passed).toBe(false);
    expect(invalidSyntaxResult.error).toBeDefined();
  });
});
