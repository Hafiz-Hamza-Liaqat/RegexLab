import { describe, it, expect } from 'vitest';
import { explainRegexTokens } from '../../src/lib/regex/tokenizer.ts';

describe('Regex Tokenizer & Explainer', () => {
  it('tokenizes shorthand character classes', () => {
    const result = explainRegexTokens('\\d+\\s\\w');
    expect(result.tokens.length).toBeGreaterThan(0);

    const digitToken = result.tokens.find((t) => t.raw === '\\d');
    expect(digitToken).toBeDefined();
    expect(digitToken?.type).toBe('character-class');

    const spaceToken = result.tokens.find((t) => t.raw === '\\s');
    expect(spaceToken).toBeDefined();

    const wordToken = result.tokens.find((t) => t.raw === '\\w');
    expect(wordToken).toBeDefined();
  });

  it('tokenizes anchors and word boundaries', () => {
    const result = explainRegexTokens('^\\bword\\b$');
    const startAnchor = result.tokens.find((t) => t.raw === '^');
    expect(startAnchor?.type).toBe('anchor');

    const wordBoundary = result.tokens.find((t) => t.raw === '\\b');
    expect(wordBoundary?.type).toBe('anchor');

    const endAnchor = result.tokens.find((t) => t.raw === '$');
    expect(endAnchor?.type).toBe('anchor');
  });

  it('tokenizes quantifiers and lazy quantifiers', () => {
    const result = explainRegexTokens('a*b+c?d{2,4}e*?');
    const star = result.tokens.find((t) => t.raw === '*');
    expect(star?.type).toBe('quantifier');

    const plus = result.tokens.find((t) => t.raw === '+');
    expect(plus?.type).toBe('quantifier');

    const range = result.tokens.find((t) => t.raw === '{2,4}');
    expect(range?.type).toBe('quantifier');

    const lazyStar = result.tokens.find((t) => t.raw === '*?');
    expect(lazyStar?.type).toBe('quantifier');
    expect(lazyStar?.label).toContain('lazy');
  });

  it('tokenizes capturing, non-capturing, and named groups', () => {
    const result = explainRegexTokens('(?<id>\\d+)(?:abc)(xyz)');
    const namedGroup = result.tokens.find((t) => t.type === 'group' && t.raw.startsWith('(?<id>'));
    expect(namedGroup).toBeDefined();
    expect(namedGroup?.label).toContain('Named capture group (id)');

    const nonCapturing = result.tokens.find((t) => t.type === 'group' && t.raw === '(?:');
    expect(nonCapturing).toBeDefined();
    expect(nonCapturing?.label).toContain('Non-capturing');
  });

  it('tokenizes lookaround assertions', () => {
    const result = explainRegexTokens('(?<=\\$)\\d+(?=\\s)');
    const lookbehind = result.tokens.find((t) => t.type === 'lookaround' && t.raw === '(?<=');
    expect(lookbehind).toBeDefined();
    expect(lookbehind?.label).toContain('Lookbehind');

    const lookahead = result.tokens.find((t) => t.type === 'lookaround' && t.raw === '(?=');
    expect(lookahead).toBeDefined();
    expect(lookahead?.label).toContain('Lookahead');
  });

  it('tokenizes bracket character sets and negated sets', () => {
    const result = explainRegexTokens('[a-z0-9][^abc]');
    const set1 = result.tokens.find((t) => t.raw === '[a-z0-9]');
    expect(set1?.type).toBe('set');

    const negatedSet = result.tokens.find((t) => t.raw === '[^abc]');
    expect(negatedSet?.type).toBe('set');
    expect(negatedSet?.label).toContain('Negated');
  });

  it('indicates when pattern contains uninterpreted or advanced characters', () => {
    const result = explainRegexTokens('~#`');
    expect(result.tokens.length).toBeGreaterThan(0);
    // Even if uninterpreted, it does not throw
    expect(result.summary).toBeDefined();
  });
});
