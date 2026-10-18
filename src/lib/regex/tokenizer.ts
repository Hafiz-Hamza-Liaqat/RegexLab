export type TokenType =
  | 'anchor'
  | 'character-class'
  | 'set'
  | 'quantifier'
  | 'group'
  | 'lookaround'
  | 'alternation'
  | 'escape'
  | 'literal'
  | 'uninterpreted';

export interface RegexToken {
  type: TokenType;
  raw: string;
  label: string;
  description: string;
  startIndex: number;
  endIndex: number;
}

export interface TokenExplanationResult {
  tokens: RegexToken[];
  hasUninterpreted: boolean;
  uninterpretedCount: number;
  summary: string;
}

/**
 * Tokenizes common regular expression syntax into clear, educational explanations.
 * Deliberately handles common tokens cleanly while explicitly tagging complex or unhandled constructs.
 */
export function explainRegexTokens(pattern: string): TokenExplanationResult {
  const tokens: RegexToken[] = [];
  let i = 0;
  let uninterpretedCount = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    if (char === undefined) {
      break;
    }
    const startIndex = i;

    // Escaped sequences
    if (char === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      const twoChar = pattern.slice(i, i + 2);

      if (next === 'd') {
        tokens.push({
          type: 'character-class',
          raw: twoChar,
          label: 'Digit',
          description: 'Matches any digit character [0-9].',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }
      if (next === 'D') {
        tokens.push({
          type: 'character-class',
          raw: twoChar,
          label: 'Non-digit',
          description: 'Matches any character that is not a digit [^0-9].',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }
      if (next === 'w') {
        tokens.push({
          type: 'character-class',
          raw: twoChar,
          label: 'Word character',
          description: 'Matches letters, numbers, and underscores [a-zA-Z0-9_].',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }
      if (next === 'W') {
        tokens.push({
          type: 'character-class',
          raw: twoChar,
          label: 'Non-word character',
          description: 'Matches any character that is not a word character.',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }
      if (next === 's') {
        tokens.push({
          type: 'character-class',
          raw: twoChar,
          label: 'Whitespace',
          description: 'Matches spaces, tabs, line breaks, and other whitespace.',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }
      if (next === 'S') {
        tokens.push({
          type: 'character-class',
          raw: twoChar,
          label: 'Non-whitespace',
          description: 'Matches any non-whitespace character.',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }
      if (next === 'b') {
        tokens.push({
          type: 'anchor',
          raw: twoChar,
          label: 'Word boundary',
          description: 'Matches at a word boundary (between a word character and a non-word character).',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }
      if (next === 'B') {
        tokens.push({
          type: 'anchor',
          raw: twoChar,
          label: 'Non-word boundary',
          description: 'Matches where there is not a word boundary.',
          startIndex,
          endIndex: i + 2,
        });
        i += 2;
        continue;
      }

      // Escaped special symbols
      tokens.push({
        type: 'escape',
        raw: twoChar,
        label: `Escaped '${next}'`,
        description: `Treats '${next}' as a literal character rather than regex syntax.`,
        startIndex,
        endIndex: i + 2,
      });
      i += 2;
      continue;
    }

    // Anchors
    if (char === '^') {
      tokens.push({
        type: 'anchor',
        raw: '^',
        label: 'Start anchor',
        description: 'Matches the beginning of the string (or line with multiline flag).',
        startIndex,
        endIndex: i + 1,
      });
      i += 1;
      continue;
    }
    if (char === '$') {
      tokens.push({
        type: 'anchor',
        raw: '$',
        label: 'End anchor',
        description: 'Matches the end of the string (or line with multiline flag).',
        startIndex,
        endIndex: i + 1,
      });
      i += 1;
      continue;
    }

    // Dot wildcard
    if (char === '.') {
      tokens.push({
        type: 'character-class',
        raw: '.',
        label: 'Any character (Dot)',
        description: 'Matches any single character except newline (matches newline with dotAll /s flag).',
        startIndex,
        endIndex: i + 1,
      });
      i += 1;
      continue;
    }

    // Alternation
    if (char === '|') {
      tokens.push({
        type: 'alternation',
        raw: '|',
        label: 'Alternation (OR)',
        description: 'Matches either the expression before or after the pipe.',
        startIndex,
        endIndex: i + 1,
      });
      i += 1;
      continue;
    }

    // Bracket sets [ ... ]
    if (char === '[') {
      let closeIdx = i + 1;
      if (pattern[closeIdx] === '^') closeIdx++;
      if (pattern[closeIdx] === ']') closeIdx++; // escaped first ] inside bracket
      while (closeIdx < pattern.length && pattern[closeIdx] !== ']') {
        if (pattern[closeIdx] === '\\') closeIdx += 2;
        else closeIdx++;
      }

      if (closeIdx < pattern.length && pattern[closeIdx] === ']') {
        const rawSet = pattern.slice(i, closeIdx + 1);
        const isNegated = rawSet.startsWith('[^');
        tokens.push({
          type: 'set',
          raw: rawSet,
          label: isNegated ? 'Negated character set' : 'Character set',
          description: isNegated
            ? `Matches any character NOT listed in ${rawSet}.`
            : `Matches any single character listed in ${rawSet}.`,
          startIndex,
          endIndex: closeIdx + 1,
        });
        i = closeIdx + 1;
        continue;
      }
    }

    // Quantifiers
    if (char === '*' || char === '+' || char === '?') {
      const isLazy = pattern[i + 1] === '?';
      const rawQuant = isLazy ? pattern.slice(i, i + 2) : char;
      const lazyDesc = isLazy ? ' (lazy: matches as few times as possible)' : ' (greedy: matches as many times as possible)';

      let label = 'Quantifier';
      let desc = '';
      if (char === '*') {
        label = `Zero or more${isLazy ? ' (lazy)' : ''}`;
        desc = `Matches 0 or more occurrences of the preceding item${lazyDesc}.`;
      } else if (char === '+') {
        label = `One or more${isLazy ? ' (lazy)' : ''}`;
        desc = `Matches 1 or more occurrences of the preceding item${lazyDesc}.`;
      } else if (char === '?') {
        label = `Optional${isLazy ? ' (lazy)' : ''}`;
        desc = `Matches 0 or 1 occurrence of the preceding item${lazyDesc}.`;
      }

      tokens.push({
        type: 'quantifier',
        raw: rawQuant,
        label,
        description: desc,
        startIndex,
        endIndex: i + rawQuant.length,
      });
      i += rawQuant.length;
      continue;
    }

    // Range quantifier {n}, {n,}, {n,m}
    if (char === '{') {
      const closeIdx = pattern.indexOf('}', i);
      if (closeIdx > i) {
        const content = pattern.slice(i + 1, closeIdx);
        if (/^\d+(?:,\d*)?$/.test(content)) {
          const isLazy = pattern[closeIdx + 1] === '?';
          const rawRange = pattern.slice(i, closeIdx + 1) + (isLazy ? '?' : '');
          tokens.push({
            type: 'quantifier',
            raw: rawRange,
            label: `Repetition {${content}}`,
            description: `Matches between specified range of occurrences${isLazy ? ' lazily' : ''}.`,
            startIndex,
            endIndex: i + rawRange.length,
          });
          i += rawRange.length;
          continue;
        }
      }
    }

    // Groups & Lookarounds
    if (char === '(') {
      if (pattern.startsWith('(?<=', i)) {
        tokens.push({
          type: 'lookaround',
          raw: '(?<=',
          label: 'Positive Lookbehind',
          description: 'Asserts that the preceding text matches the pattern inside without including it in the match.',
          startIndex,
          endIndex: i + 4,
        });
        i += 4;
        continue;
      }
      if (pattern.startsWith('(?<!', i)) {
        tokens.push({
          type: 'lookaround',
          raw: '(?<!',
          label: 'Negative Lookbehind',
          description: 'Asserts that the preceding text does not match the pattern inside.',
          startIndex,
          endIndex: i + 4,
        });
        i += 4;
        continue;
      }
      if (pattern.startsWith('(?=', i)) {
        tokens.push({
          type: 'lookaround',
          raw: '(?=',
          label: 'Positive Lookahead',
          description: 'Asserts that what follows immediately matches the pattern inside without consuming characters.',
          startIndex,
          endIndex: i + 3,
        });
        i += 3;
        continue;
      }
      if (pattern.startsWith('(?!', i)) {
        tokens.push({
          type: 'lookaround',
          raw: '(?!',
          label: 'Negative Lookahead',
          description: 'Asserts that what follows immediately does not match the pattern inside.',
          startIndex,
          endIndex: i + 3,
        });
        i += 3;
        continue;
      }
      if (pattern.startsWith('(?:', i)) {
        tokens.push({
          type: 'group',
          raw: '(?:',
          label: 'Non-capturing group',
          description: 'Groups sub-patterns for quantifiers or alternation without creating a backreference.',
          startIndex,
          endIndex: i + 3,
        });
        i += 3;
        continue;
      }
      if (pattern.startsWith('(?<', i)) {
        const closeName = pattern.indexOf('>', i + 3);
        if (closeName > i + 3) {
          const groupName = pattern.slice(i + 3, closeName);
          tokens.push({
            type: 'group',
            raw: `(?<${groupName}>`,
            label: `Named capture group (${groupName})`,
            description: `Captures the matched text and stores it under the named key '${groupName}'.`,
            startIndex,
            endIndex: closeName + 1,
          });
          i = closeName + 1;
          continue;
        }
      }

      tokens.push({
        type: 'group',
        raw: '(',
        label: 'Capturing group open',
        description: 'Begins a numbered capture group ($1, $2, etc.).',
        startIndex,
        endIndex: i + 1,
      });
      i += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({
        type: 'group',
        raw: ')',
        label: 'Group close',
        description: 'Closes the current group or assertion.',
        startIndex,
        endIndex: i + 1,
      });
      i += 1;
      continue;
    }

    // Literals vs unrecognized
    if (/^[a-zA-Z0-9\s.,:;!@#%&=_-]$/.test(char)) {
      // Collect consecutive alphanumeric literals
      let literalStr = char;
      let nextI = i + 1;
      while (nextI < pattern.length) {
        const nextChar = pattern[nextI];
        if (!nextChar || !/^[a-zA-Z0-9_]$/.test(nextChar)) {
          break;
        }
        literalStr += nextChar;
        nextI++;
      }

      tokens.push({
        type: 'literal',
        raw: literalStr,
        label: literalStr.length > 1 ? `Literal "${literalStr}"` : `Literal '${literalStr}'`,
        description: `Matches the exact character${literalStr.length > 1 ? 's' : ''} "${literalStr}".`,
        startIndex,
        endIndex: nextI,
      });
      i = nextI;
      continue;
    }

    // Fallback for uninterpreted or rare syntax
    uninterpretedCount++;
    tokens.push({
      type: 'uninterpreted',
      raw: char,
      label: 'Special character',
      description: `Syntax character '${char}'. The simplified tokenizer does not provide a custom breakdown for this token, but the regex engine executes it fully.`,
      startIndex,
      endIndex: i + 1,
    });
    i += 1;
  }

  const hasUninterpreted = uninterpretedCount > 0;
  const summary = tokens.length === 0
    ? 'Enter a regular expression to see a breakdown of its tokens.'
    : hasUninterpreted
    ? `Identified ${tokens.length} token(s) with ${uninterpretedCount} advanced or uninterpreted element(s).`
    : `Identified ${tokens.length} token(s).`;

  return {
    tokens,
    hasUninterpreted,
    uninterpretedCount,
    summary,
  };
}
