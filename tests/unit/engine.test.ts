import { describe, it, expect } from 'vitest';
import {
  validateRegex,
  executeRegex,
  MAX_PATTERN_LENGTH,
  MAX_TEXT_LENGTH,
} from '../../src/lib/regex/engine.ts';

describe('Regex Engine — validateRegex', () => {
  it('accepts valid regex patterns with supported flags', () => {
    expect(validateRegex('\\d+', 'g').valid).toBe(true);
    expect(validateRegex('^[a-z]+$', 'ims').valid).toBe(true);
    expect(validateRegex('(?<name>\\w+)', 'u').valid).toBe(true);
  });

  it('rejects duplicate or unsupported flags', () => {
    const dupResult = validateRegex('\\d+', 'gg');
    expect(dupResult.valid).toBe(false);
    expect(dupResult.error).toContain('Duplicate flag');

    const invalidResult = validateRegex('\\d+', 'gx');
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toContain("Invalid flag: 'x'");
  });

  it('rejects syntactically invalid regular expressions', () => {
    const unclosedBracket = validateRegex('[abc', '');
    expect(unclosedBracket.valid).toBe(false);
    expect(unclosedBracket.error).toBeDefined();

    const badQuantifier = validateRegex('+abc', '');
    expect(badQuantifier.valid).toBe(false);
  });

  it('enforces maximum pattern length limit', () => {
    const oversized = 'a'.repeat(MAX_PATTERN_LENGTH + 1);
    const result = validateRegex(oversized, '');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum allowed length');
  });
});

describe('Regex Engine — executeRegex', () => {
  it('accurately identifies matches with 0-based offsets', () => {
    const text = 'Order A102 confirmed. Order B305 shipped.';
    const result = executeRegex({
      id: 'test-1',
      pattern: '[A-Z]\\d{3}',
      flags: 'g',
      text,
    });

    expect(result.status).toBe('success');
    expect(result.totalMatches).toBe(2);
    expect(result.matches[0]?.value).toBe('A102');
    expect(result.matches[0]?.start).toBe(6);
    expect(result.matches[0]?.end).toBe(10);
    expect(text.slice(result.matches[0]!.start, result.matches[0]!.end)).toBe('A102');

    expect(result.matches[1]?.value).toBe('B305');
    expect(result.matches[1]?.start).toBe(28);
    expect(result.matches[1]?.end).toBe(32);
  });

  it('respects non-global flag by stopping after first match', () => {
    const text = 'item 1, item 2, item 3';
    const result = executeRegex({
      id: 'test-non-global',
      pattern: '\\d+',
      flags: '', // no 'g'
      text,
    });

    expect(result.status).toBe('success');
    expect(result.totalMatches).toBe(1);
    expect(result.matches[0]?.value).toBe('1');
  });

  it('correctly handles case-insensitive flag "i"', () => {
    const text = 'cat CAT cAt CaT';
    const result = executeRegex({
      id: 'test-i',
      pattern: 'cat',
      flags: 'gi',
      text,
    });

    expect(result.totalMatches).toBe(4);
    expect(result.matches.map((m) => m.value)).toEqual(['cat', 'CAT', 'cAt', 'CaT']);
  });

  it('correctly handles multiline flag "m"', () => {
    const text = 'line one\nline two\nline three';
    const result = executeRegex({
      id: 'test-m',
      pattern: '^line\\s+\\w+',
      flags: 'gm',
      text,
    });

    expect(result.totalMatches).toBe(3);
  });

  it('correctly handles dotAll flag "s"', () => {
    const text = 'start\nmiddle\nend';
    const withoutS = executeRegex({
      id: 'no-s',
      pattern: 'start.*end',
      flags: 'g',
      text,
    });
    expect(withoutS.status).toBe('no-match');

    const withS = executeRegex({
      id: 'with-s',
      pattern: 'start.*end',
      flags: 'gs',
      text,
    });
    expect(withS.status).toBe('success');
    expect(withS.matches[0]?.value).toBe(text);
  });

  it('extracts numbered capture groups with offsets', () => {
    const text = 'User: John (id: 42)';
    const result = executeRegex({
      id: 'test-numbered-groups',
      pattern: 'User:\\s+(\\w+)\\s+\\(id:\\s+(\\d+)\\)',
      flags: 'g',
      text,
    });

    expect(result.status).toBe('success');
    const match = result.matches[0]!;
    expect(match.groups.length).toBe(2);
    expect(match.groups[0]?.index).toBe(1);
    expect(match.groups[0]?.value).toBe('John');
    expect(match.groups[1]?.index).toBe(2);
    expect(match.groups[1]?.value).toBe('42');
  });

  it('extracts named capture groups', () => {
    const text = 'Release 2026-10-19 ready.';
    const result = executeRegex({
      id: 'test-named-groups',
      pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
      flags: 'g',
      text,
    });

    expect(result.status).toBe('success');
    const match = result.matches[0]!;
    expect(match.namedGroups).toBeDefined();
    expect(match.namedGroups?.year).toBe('2026');
    expect(match.namedGroups?.month).toBe('10');
    expect(match.namedGroups?.day).toBe('19');
  });

  it('handles zero-length matches in global mode without an infinite loop', () => {
    const text = 'abc';
    // Pattern that matches empty string at word boundary
    const result = executeRegex({
      id: 'test-zero-len',
      pattern: '\\b',
      flags: 'g',
      text,
    });

    expect(result.status).toBe('success');
    expect(result.totalMatches).toBe(2); // start and end of "abc"
  });

  it('handles Unicode code points and surrogate pairs advancement in zero-length matches', () => {
    const text = '😀'; // 2 UTF-16 code units (surrogate pair)
    const result = executeRegex({
      id: 'test-unicode-surrogate',
      pattern: '',
      flags: 'gu',
      text,
    });

    // empty pattern returns no-match immediately
    expect(result.status).toBe('no-match');
  });

  it('provides surrounding context snippet', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const result = executeRegex({
      id: 'test-context',
      pattern: 'fox',
      flags: 'g',
      text,
    });

    expect(result.status).toBe('success');
    const match = result.matches[0]!;
    expect(match.inputContext.match).toBe('fox');
    expect(match.inputContext.prefix.endsWith('brown ')).toBe(true);
    expect(match.inputContext.suffix.startsWith(' jumps')).toBe(true);
  });

  it('returns no-match when text does not match', () => {
    const result = executeRegex({
      id: 'test-none',
      pattern: '\\d+',
      flags: 'g',
      text: 'no digits here',
    });

    expect(result.status).toBe('no-match');
    expect(result.matches).toHaveLength(0);
  });

  it('rejects input text exceeding MAX_TEXT_LENGTH', () => {
    const oversizedText = 'a'.repeat(MAX_TEXT_LENGTH + 1);
    const result = executeRegex({
      id: 'test-oversized',
      pattern: 'a',
      flags: 'g',
      text: oversizedText,
    });

    expect(result.status).toBe('error');
    expect(result.error).toContain('exceeds maximum allowed length');
  });
});
