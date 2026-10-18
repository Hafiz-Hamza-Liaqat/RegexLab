import type {
  MatchGroup,
  RegexMatch,
  RegexRunRequest,
  RegexRunResult,
  ReplaceRunRequest,
  ReplaceRunResult,
} from '../../types/regex.ts';

export const MAX_PATTERN_LENGTH = 2000;
export const MAX_TEXT_LENGTH = 500000;
export const MAX_MATCHES_DEFAULT = 2000;

const VALID_FLAGS = new Set(['g', 'i', 'm', 's', 'u']);

/**
 * Validates a regular expression pattern and flags string.
 */
export function validateRegex(pattern: string, flags: string): { valid: boolean; error?: string } {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return {
      valid: false,
      error: `Pattern exceeds maximum allowed length of ${MAX_PATTERN_LENGTH} characters.`,
    };
  }

  // Validate flags
  const seen = new Set<string>();
  for (const f of flags) {
    if (!VALID_FLAGS.has(f)) {
      return { valid: false, error: `Invalid flag: '${f}'. Only g, i, m, s, u are supported.` };
    }
    if (seen.has(f)) {
      return { valid: false, error: `Duplicate flag: '${f}'.` };
    }
    seen.add(f);
  }

  try {
    new RegExp(pattern, flags);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid regular expression.',
    };
  }
}

/**
 * Compiles a RegExp safely with the 'd' flag if possible for accurate group indices.
 */
function createCompiledRegExp(pattern: string, flags: string): { regex: RegExp; hasIndices: boolean } {
  // Try adding 'd' flag to get match.indices
  const flagsWithD = flags.includes('d') ? flags : `${flags}d`;
  try {
    const regex = new RegExp(pattern, flagsWithD);
    return { regex, hasIndices: true };
  } catch {
    // If 'd' flag is not supported or causes error with certain flags, fallback
    const regex = new RegExp(pattern, flags);
    return { regex, hasIndices: false };
  }
}

/**
 * Executes a regex search against text safely with zero-length loop protection and limits.
 */
export function executeRegex(request: RegexRunRequest): RegexRunResult {
  const startTime = performance.now();
  const { id, pattern, flags, text, maxMatches = MAX_MATCHES_DEFAULT } = request;

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      id,
      status: 'error',
      matches: [],
      totalMatches: 0,
      executionTimeMs: 0,
      error: `Test text exceeds maximum allowed length of ${MAX_TEXT_LENGTH.toLocaleString()} characters.`,
    };
  }

  const validation = validateRegex(pattern, flags);
  if (!validation.valid) {
    return {
      id,
      status: 'error',
      matches: [],
      totalMatches: 0,
      executionTimeMs: 0,
      error: validation.error,
    };
  }

  if (pattern === '') {
    return {
      id,
      status: 'no-match',
      matches: [],
      totalMatches: 0,
      executionTimeMs: 0,
    };
  }

  try {
    const isGlobal = flags.includes('g');
    const isUnicode = flags.includes('u');
    const { regex, hasIndices } = createCompiledRegExp(pattern, flags);

    const matches: RegexMatch[] = [];
    let rawMatch: RegExpExecArray | null = null;
    let matchCount = 0;
    let truncated = false;

    while ((rawMatch = regex.exec(text)) !== null) {
      matchCount++;

      const matchValue = rawMatch[0];
      const startIndex = rawMatch.index;
      const endIndex = startIndex + matchValue.length;

      // Extract capture groups
      const groups: MatchGroup[] = [];
      const namedGroups: Record<string, string> = {};

      if (rawMatch.groups) {
        Object.assign(namedGroups, rawMatch.groups);
      }

      // Check for numbered groups
      for (let i = 1; i < rawMatch.length; i++) {
        const val = rawMatch[i];
        if (val !== undefined) {
          let gStart = -1;
          let gEnd = -1;

          if (hasIndices && rawMatch.indices && rawMatch.indices[i]) {
            const idxRange = rawMatch.indices[i]!;
            gStart = idxRange[0];
            gEnd = idxRange[1];
          } else {
            // Fallback: search within match span
            const relIdx = matchValue.indexOf(val);
            gStart = relIdx >= 0 ? startIndex + relIdx : startIndex;
            gEnd = gStart + val.length;
          }

          // Check if this group had a name
          let groupName: string | undefined;
          if (rawMatch.groups) {
            for (const [name, gVal] of Object.entries(rawMatch.groups)) {
              if (gVal === val) {
                // If indices match named group
                if (
                  hasIndices &&
                  rawMatch.indices?.groups &&
                  rawMatch.indices.groups[name] &&
                  rawMatch.indices.groups[name]![0] === gStart
                ) {
                  groupName = name;
                  break;
                } else if (!hasIndices) {
                  groupName = name;
                  break;
                }
              }
            }
          }

          groups.push({
            index: i,
            name: groupName,
            value: val,
            start: gStart,
            end: gEnd,
          });
        }
      }

      // Context preview (20 chars before and after)
      const prefix = text.slice(Math.max(0, startIndex - 20), startIndex);
      const suffix = text.slice(endIndex, Math.min(text.length, endIndex + 20));

      matches.push({
        index: matchCount,
        value: matchValue,
        start: startIndex,
        end: endIndex,
        groups,
        namedGroups: Object.keys(namedGroups).length > 0 ? namedGroups : undefined,
        inputContext: {
          prefix,
          match: matchValue,
          suffix,
        },
      });

      if (matches.length >= maxMatches) {
        truncated = true;
        break;
      }

      // Non-global mode stops after first match
      if (!isGlobal) {
        break;
      }

      // Zero-length match protection
      if (rawMatch[0].length === 0) {
        if (regex.lastIndex === text.length) {
          // Reached end of input with zero-length match
          break;
        }

        // Advance lastIndex by one Unicode code point
        if (isUnicode) {
          const code = text.charCodeAt(regex.lastIndex);
          if (code >= 0xd800 && code <= 0xdbff && regex.lastIndex + 1 < text.length) {
            const nextCode = text.charCodeAt(regex.lastIndex + 1);
            if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
              regex.lastIndex += 2;
              continue;
            }
          }
        }
        regex.lastIndex += 1;
      }
    }

    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      id,
      status: matches.length > 0 ? 'success' : 'no-match',
      matches,
      totalMatches: matches.length,
      executionTimeMs: elapsed,
      truncated,
    };
  } catch (err) {
    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      id,
      status: 'error',
      matches: [],
      totalMatches: 0,
      executionTimeMs: elapsed,
      error: err instanceof Error ? err.message : 'Execution error.',
    };
  }
}

/**
 * Performs replacement following standard JavaScript replacement semantics.
 */
export function executeReplace(request: ReplaceRunRequest): ReplaceRunResult {
  const startTime = performance.now();
  const { id, pattern, flags, text, replacement } = request;

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      id,
      status: 'error',
      resultText: text,
      replacementCount: 0,
      executionTimeMs: 0,
      error: `Test text exceeds maximum allowed length of ${MAX_TEXT_LENGTH.toLocaleString()} characters.`,
    };
  }

  const validation = validateRegex(pattern, flags);
  if (!validation.valid) {
    return {
      id,
      status: 'error',
      resultText: text,
      replacementCount: 0,
      executionTimeMs: 0,
      error: validation.error,
    };
  }

  if (pattern === '') {
    return {
      id,
      status: 'success',
      resultText: text,
      replacementCount: 0,
      executionTimeMs: 0,
    };
  }

  try {
    const isGlobal = flags.includes('g');
    const regex = new RegExp(pattern, flags);

    let replacementCount = 0;

    const resultText = text.replace(regex, (...args) => {
      replacementCount++;
      // Standard JS replacement expansion
      const match = args[0] as string;
      const offset = typeof args[args.length - 2] === 'number' ? (args[args.length - 2] as number) : (args[args.length - 3] as number);
      const wholeString = typeof args[args.length - 1] === 'string' ? (args[args.length - 1] as string) : (args[args.length - 2] as string);
      const namedGroups = typeof args[args.length - 1] === 'object' ? (args[args.length - 1] as Record<string, string> | undefined) : undefined;

      // Expand replacement tokens: $&, $`, $', $$, $1..$99, $<name>
      return replacement.replace(/\$([$&'`]|\d{1,2}|<[^>]+>|\$)/g, (token, key: string) => {
        if (token === '$$') return '$';
        if (token === '$&') return match;
        if (token === '$`') return wholeString.slice(0, offset);
        if (token === "$'") return wholeString.slice(offset + match.length);

        if (token.startsWith('$<') && token.endsWith('>')) {
          const name = token.slice(2, -1);
          return namedGroups?.[name] ?? '';
        }

        const groupNum = parseInt(key, 10);
        if (!Number.isNaN(groupNum) && groupNum >= 1 && groupNum < args.length - 2) {
          const val = args[groupNum];
          return typeof val === 'string' ? val : '';
        }

        return token;
      });
    });

    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      id,
      status: 'success',
      resultText,
      replacementCount: isGlobal ? replacementCount : Math.min(replacementCount, 1),
      executionTimeMs: elapsed,
    };
  } catch (err) {
    const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      id,
      status: 'error',
      resultText: text,
      replacementCount: 0,
      executionTimeMs: elapsed,
      error: err instanceof Error ? err.message : 'Replacement execution error.',
    };
  }
}
