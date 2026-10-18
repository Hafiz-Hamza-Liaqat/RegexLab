import React, { useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { explainRegexTokens } from '../../lib/regex/tokenizer.ts';

interface LearningTopic {
  title: string;
  category: string;
  pattern: string;
  flags: string;
  sampleText: string;
  description: string;
  syntax: Array<{ code: string; meaning: string }>;
}

const LEARNING_TOPICS: LearningTopic[] = [
  {
    title: 'Character Classes & Shorthands',
    category: 'Foundations',
    pattern: '\\d+\\s\\w+',
    flags: 'g',
    sampleText: 'Order 102 apples, 45 oranges, and 12 bananas.',
    description: 'Shorthands represent sets of related characters such as numbers, letters, or whitespace.',
    syntax: [
      { code: '\\d', meaning: 'Any digit [0-9]' },
      { code: '\\D', meaning: 'Any non-digit [^0-9]' },
      { code: '\\w', meaning: 'Any word character [a-zA-Z0-9_]' },
      { code: '\\W', meaning: 'Any non-word character' },
      { code: '\\s', meaning: 'Any whitespace (space, tab, newline)' },
      { code: '\\S', meaning: 'Any non-whitespace character' },
      { code: '.', meaning: 'Any character except newline (matches newline with "s" flag)' },
    ],
  },
  {
    title: 'Character Sets & Ranges',
    category: 'Foundations',
    pattern: '[A-Z][a-z]+',
    flags: 'g',
    sampleText: 'Alice went to Paris with Bob and Charlie.',
    description: 'Square brackets define a set or range of characters to match at that position.',
    syntax: [
      { code: '[abc]', meaning: 'Matches any single character a, b, or c' },
      { code: '[^abc]', meaning: 'Negation: matches any character EXCEPT a, b, or c' },
      { code: '[a-z]', meaning: 'Range: matches any lowercase letter from a to z' },
      { code: '[0-9A-F]', meaning: 'Multiple ranges: hexadecimal characters' },
    ],
  },
  {
    title: 'Quantifiers (Greedy & Lazy)',
    category: 'Repetition',
    pattern: '<.+?>',
    flags: 'g',
    sampleText: '<div><span>First</span><span>Second</span></div>',
    description: 'Quantifiers specify how many times the preceding character or group may repeat.',
    syntax: [
      { code: '*', meaning: 'Zero or more times (greedy)' },
      { code: '+', meaning: 'One or more times (greedy)' },
      { code: '?', meaning: 'Zero or one time (optional)' },
      { code: '{n}', meaning: 'Exactly n times' },
      { code: '{n,m}', meaning: 'Between n and m times' },
      { code: '*?, +?, ??', meaning: 'Lazy variants: matches as few characters as possible' },
    ],
  },
  {
    title: 'Anchors & Word Boundaries',
    category: 'Positioning',
    pattern: '^\\b[A-Z]\\w+\\b',
    flags: 'gm',
    sampleText: 'First line starts here.\nsecond line is lowercase.\nThird line is capitalized.',
    description: 'Anchors assert positions rather than consuming text characters.',
    syntax: [
      { code: '^', meaning: 'Start of string (or start of line with "m" flag)' },
      { code: '$', meaning: 'End of string (or end of line with "m" flag)' },
      { code: '\\b', meaning: 'Word boundary (transition between \\w and \\W)' },
      { code: '\\B', meaning: 'Non-word boundary' },
    ],
  },
  {
    title: 'Capturing & Non-Capturing Groups',
    category: 'Grouping',
    pattern: '(\\w+):\\s*(\\d+)',
    flags: 'g',
    sampleText: 'port: 8080, timeout: 30, retries: 5',
    description: 'Parentheses group sub-expressions and capture matches for backreferences ($1, $2).',
    syntax: [
      { code: '(...)', meaning: 'Capturing group: records match for $1, $2' },
      { code: '(?:...)', meaning: 'Non-capturing group: groups without recording backreferences' },
      { code: '(?<name>...)', meaning: 'Named capture group: accessible via $<name> or match.groups' },
      { code: 'a|b', meaning: 'Alternation: matches either expression a OR expression b' },
    ],
  },
  {
    title: 'Lookahead & Lookbehind Assertions',
    category: 'Advanced',
    pattern: '(?<=\\$)\\d+(?:\\.\\d{2})?',
    flags: 'g',
    sampleText: 'Item price: $29.99, shipping fee: $4.50, units: 10.',
    description: 'Lookaround assertions inspect surrounding characters without consuming them.',
    syntax: [
      { code: '(?=...)', meaning: 'Positive lookahead: asserts pattern matches immediately ahead' },
      { code: '(?!...)', meaning: 'Negative lookahead: asserts pattern does NOT match ahead' },
      { code: '(?<=...)', meaning: 'Positive lookbehind: asserts pattern matches immediately before' },
      { code: '(?<!...)', meaning: 'Negative lookbehind: asserts pattern does NOT match before' },
    ],
  },
  {
    title: 'Regex Flags & Modifiers',
    category: 'Configuration',
    pattern: 'hello',
    flags: 'gi',
    sampleText: 'Hello world, HELLO team, hello friend.',
    description: 'Flags modify how regular expressions are compiled and executed across the entire string.',
    syntax: [
      { code: 'g', meaning: 'Global: find all matches rather than stopping at the first' },
      { code: 'i', meaning: 'Ignore case: treat uppercase and lowercase identically' },
      { code: 'm', meaning: 'Multiline: ^ and $ match line starts and ends' },
      { code: 's', meaning: 'DotAll: allows . to match newline characters' },
      { code: 'u', meaning: 'Unicode: enable full Unicode code-point matching and surrogate handling' },
    ],
  },
];

interface RegexLearningViewProps {
  onOpenInClassicLab: (pattern: string, flags: string, text: string) => void;
}

export const RegexLearningView: React.FC<RegexLearningViewProps> = ({
  onOpenInClassicLab,
}) => {
  const [interactivePattern, setInteractivePattern] = useState<string>('(?<year>\\d{4})-(?<month>\\d{2})');
  const tokenBreakdown = explainRegexTokens(interactivePattern);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Regex Handbook & Token Explainer
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Comprehensive guide to JavaScript regular expressions with interactive breakdowns and instant testing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Token Explainer Widget */}
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-950/80 bg-gradient-to-r from-indigo-50/50 via-slate-50 to-purple-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 p-4 md:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Interactive Token Explainer
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Type any regex to inspect its constituent tokens
          </span>
        </div>

        {/* Input */}
        <div className="flex items-stretch rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <div className="px-3 flex items-center justify-center font-mono text-slate-400 text-base">/</div>
          <input
            type="text"
            value={interactivePattern}
            onChange={(e) => setInteractivePattern(e.target.value)}
            placeholder="Type regex pattern to decompose..."
            className="flex-1 py-2 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <div className="px-3 flex items-center justify-center font-mono text-slate-400 text-base">/</div>
        </div>

        {/* Token Badges & Breakdown */}
        <div className="space-y-3">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="font-semibold">{tokenBreakdown.summary}</span>
            {tokenBreakdown.hasUninterpreted && (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Notice: contains advanced or uninterpreted tokens</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {tokenBreakdown.tokens.map((token, idx) => (
              <div
                key={`tok-${idx}-${token.startIndex}`}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <code className="font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {token.raw}
                  </code>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    {token.type}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {token.label}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {token.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Parser scope:</strong> The token explainer uses a deliberately safe, pedagogical tokenizer for standard expressions. Complex syntax and nested lookarounds may not be fully decomposed in this widget, but the regex engine executes every valid JavaScript pattern accurately.
            </span>
          </div>
        </div>
      </div>

      {/* Categorized Learning Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LEARNING_TOPICS.map((topic, i) => (
          <div
            key={`topic-${i}`}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {topic.category}
                </span>
                <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  /{topic.pattern}/{topic.flags}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {topic.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {topic.description}
              </p>

              {/* Syntax table */}
              <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <tbody>
                    {topic.syntax.map((s, sIdx) => (
                      <tr
                        key={`s-${sIdx}`}
                        className="border-b border-slate-100 dark:border-slate-800/80 last:border-b-0"
                      >
                        <td className="py-1.5 px-2.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-slate-50/60 dark:bg-slate-950/60 w-24 shrink-0">
                          {s.code}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-700 dark:text-slate-300">
                          {s.meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Try in Lab Button */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                Sample: "{topic.sampleText.slice(0, 30)}..."
              </span>
              <button
                type="button"
                onClick={() =>
                  onOpenInClassicLab(topic.pattern, topic.flags, topic.sampleText)
                }
                className="btn-secondary text-xs"
              >
                <span>Try in Classic Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
