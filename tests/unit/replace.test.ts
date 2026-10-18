import { describe, it, expect } from 'vitest';
import { executeReplace } from '../../src/lib/regex/engine.ts';

describe('Regex Replacement Engine', () => {
  it('replaces all matches when global "g" flag is present', () => {
    const text = 'cat and cat and cat';
    const result = executeReplace({
      id: 'rep-g',
      pattern: 'cat',
      flags: 'g',
      text,
      replacement: 'dog',
    });

    expect(result.status).toBe('success');
    expect(result.resultText).toBe('dog and dog and dog');
    expect(result.replacementCount).toBe(3);
  });

  it('replaces only first match when "g" flag is omitted', () => {
    const text = 'cat and cat and cat';
    const result = executeReplace({
      id: 'rep-no-g',
      pattern: 'cat',
      flags: '',
      text,
      replacement: 'dog',
    });

    expect(result.status).toBe('success');
    expect(result.resultText).toBe('dog and cat and cat');
    expect(result.replacementCount).toBe(1);
  });

  it('supports matched substring substitution using "$&"', () => {
    const text = 'items: A102 and B305';
    const result = executeReplace({
      id: 'rep-amp',
      pattern: '[A-Z]\\d{3}',
      flags: 'g',
      text,
      replacement: '[$&]',
    });

    expect(result.resultText).toBe('items: [A102] and [B305]');
  });

  it('supports numbered capture groups substitutions "$1", "$2"', () => {
    const text = 'Doe, John; Smith, Alice';
    const result = executeReplace({
      id: 'rep-numbered',
      pattern: '(\\w+),\\s+(\\w+)',
      flags: 'g',
      text,
      replacement: '$2 $1',
    });

    expect(result.resultText).toBe('John Doe; Alice Smith');
  });

  it('supports named capture group substitution "$<name>"', () => {
    const text = '2026-10-19';
    const result = executeReplace({
      id: 'rep-named',
      pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
      flags: 'g',
      text,
      replacement: '$<day>/$<month>/$<year>',
    });

    expect(result.resultText).toBe('19/10/2026');
  });

  it('supports literal dollar sign using "$$"', () => {
    const text = 'cost: 15';
    const result = executeReplace({
      id: 'rep-dollar',
      pattern: '\\d+',
      flags: 'g',
      text,
      replacement: '$$$&.00',
    });

    expect(result.resultText).toBe('cost: $15.00');
  });

  it('handles unmatched strings gracefully without changing text', () => {
    const text = 'hello world';
    const result = executeReplace({
      id: 'rep-none',
      pattern: '\\d+',
      flags: 'g',
      text,
      replacement: 'numbers',
    });

    expect(result.status).toBe('success');
    expect(result.resultText).toBe('hello world');
    expect(result.replacementCount).toBe(0);
  });

  it('reports error on invalid pattern', () => {
    const result = executeReplace({
      id: 'rep-err',
      pattern: '[unclosed',
      flags: 'g',
      text: 'test',
      replacement: 'x',
    });

    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
  });
});
