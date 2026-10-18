import type { Preset } from '../types/regex.ts';

export const PRESETS: Preset[] = [
  {
    id: 'numbers',
    name: 'Numbers & Quantities',
    category: 'Basic',
    description: 'Finds integers and decimal numbers in natural sentences.',
    pattern: '\\b\\d+(?:\\.\\d+)?\\b',
    flags: 'g',
    text: `Room 12, floor 4, desk 205.
Inventory batch #8849 arrived with 150 units at $19.99 each.
Tax applied: 1.75%, net payable: 3042.85.
Non-numbers to ignore: model-A2, version-v3, zero-cost.`,
    explanation: 'Matches one or more digits optionally followed by a decimal point and more digits, bounded by word boundaries.',
    disclaimer: 'Simplified decimal pattern. Does not validate currency signs, scientific exponents, or localized comma grouping.',
  },
  {
    id: 'words',
    name: 'Words & Word Boundaries',
    category: 'Basic',
    description: 'Extracts discrete alphabetical words while respecting word boundaries.',
    pattern: '\\b[a-zA-Z]{4,}\\b',
    flags: 'g',
    text: `The quick brown fox jumps over twelve lazy sleeping dogs.
A cat sat on a mat. Code, build, test, animate, master!`,
    explanation: 'Finds discrete words with 4 or more alphabetical characters using \\b boundaries to exclude shorter words.',
  },
  {
    id: 'emails',
    name: 'Email-like Addresses',
    category: 'Practical',
    description: 'Identifies common email patterns with both positive and negative examples.',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    flags: 'g',
    text: `Team contact directory:
- Lead: alice.smith+filter@example.co.uk
- Developer: hamza@regexlab.dev
- Support: support@company.org

Invalid test cases that must NOT match:
- Missing username: @domain.com
- Multiple at-signs: user@@company.com
- Missing domain dot: john.doe@invalid
- Trailing symbol: user@site..com`,
    explanation: 'Matches local-part, @ symbol, domain name, and top-level domain.',
    disclaimer: 'Demonstrates common email detection. Does not guarantee strict RFC 5322 compliance or mailbox existence.',
  },
  {
    id: 'urls',
    name: 'Web URLs & Links',
    category: 'Practical',
    description: 'Matches HTTP and HTTPS links in text.',
    pattern: 'https?:\\/\\/[a-zA-Z0-9.-]+(?:\\.[a-zA-Z]{2,})+(?:\\/[^\\s]*)?',
    flags: 'g',
    text: `Check out our resources:
1. Documentation: https://regexlab.dev/docs?topic=lookaround#getting-started
2. API endpoint: http://api.service.internal:8080/v1/health
3. GitHub repo: https://github.com/Hafiz-Hamza-Liaqat/regexlab

Non-matching text:
- ftp://archive.org (different scheme)
- www.standalone-site.com (missing http/https scheme)
- just an email address user@example.com`,
    explanation: 'Matches http:// or https:// followed by domain host and optional path query.',
    disclaimer: 'Basic URL pattern. Does not validate full RFC 3986 URI specification or IP address ranges.',
  },
  {
    id: 'dates',
    name: 'ISO Dates with Named Groups',
    category: 'Structured',
    description: 'Captures Year, Month, and Day into distinct named groups.',
    pattern: '\\b(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})\\b',
    flags: 'g',
    text: `Project release schedule:
- v1.0.0 Alpha release: 2026-10-19
- v1.1.0 Feature sprint: 2026-11-15
- Annual security review: 2026-12-31

Invalid dates or alternate formats:
- EU format: 19/10/2026 (slashes)
- Invalid values: 2026-99-99 (semantic invalidity)
- Short year: 26-10-19`,
    explanation: 'Uses named capture groups (?<year>...), (?<month>...), and (?<day>...) to extract structured components.',
    disclaimer: 'Validates 4-2-2 digit formatting. Does not calculate leap years or valid days per month.',
  },
  {
    id: 'log-parser',
    name: 'Server Log Parser',
    category: 'Structured',
    description: 'Parses structured server log lines into severity, timestamp, and message.',
    pattern: '^\\[(?<level>INFO|WARN|ERROR)\\]\\s+(?<timestamp>\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+-\\s+(?<message>.*)$',
    flags: 'gm',
    text: `[INFO] 2026-10-19 08:30:12 - Application initialized successfully
[WARN] 2026-10-19 08:35:45 - High memory consumption detected: 89%
[ERROR] 2026-10-19 08:42:01 - Database connection pool exhausted after 3000ms
[DEBUG] 2026-10-19 08:43:00 - Routine ping discarded
Unstructured log banner: system booting up`,
    explanation: 'Matches line start ^, bracketed severity level, timestamp, and trailing message line using multiline mode.',
  },
  {
    id: 'whitespace',
    name: 'Code Indentation',
    category: 'Formatting',
    description: 'Finds indented code lines with two or more leading spaces.',
    pattern: '^[ ]{2,}',
    flags: 'gm',
    text: `function formatText(input) {
  let output = input.trim();
  if (output.length > 0) {
    output = output.toUpperCase();
  }
  return output;
}`,
    explanation: 'Matches lines starting with two or more space characters in multiline mode.',
  },
];
