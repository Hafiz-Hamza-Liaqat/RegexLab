import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Shuffle,
} from 'lucide-react';
import type { RegexFlags, RegexRunStatus } from '../../types/regex.ts';

interface PatternEditorProps {
  pattern: string;
  flags: RegexFlags;
  status: RegexRunStatus;
  errorMessage?: string;
  isLive: boolean;
  manualRunFeedback?: string | null;
  onPatternChange: (pattern: string) => void;
  onFlagToggle: (flag: keyof RegexFlags) => void;
  onRun: () => void;
  onNextPattern: () => void;
  onClear: () => void;
  onReset: () => void;
  onToggleLive: () => void;
  onCopyMatches: () => void;
  hasMatches: boolean;
}

const FLAG_DESCRIPTIONS: Record<keyof RegexFlags, { label: string; name: string; desc: string }> = {
  g: { label: 'g', name: 'Global', desc: 'Find all matches rather than stopping after the first' },
  i: { label: 'i', name: 'Ignore Case', desc: 'Case-insensitive matching (A-Z matches a-z)' },
  m: { label: 'm', name: 'Multiline', desc: '^ and $ match the beginning and end of each line' },
  s: { label: 's', name: 'Dot All', desc: '. matches all characters, including newlines' },
  u: { label: 'u', name: 'Unicode', desc: 'Treat pattern as a sequence of Unicode code points' },
};

export const PatternEditor: React.FC<PatternEditorProps> = ({
  pattern,
  flags,
  status,
  errorMessage,
  isLive,
  manualRunFeedback,
  onPatternChange,
  onFlagToggle,
  onRun,
  onNextPattern,
  onClear,
  onReset,
  onToggleLive,
  onCopyMatches,
  hasMatches,
}) => {
  const [copiedPattern, setCopiedPattern] = useState(false);
  const [copiedMatches, setCopiedMatches] = useState(false);

  const activeFlagsString = (Object.keys(flags) as (keyof RegexFlags)[])
    .filter((k) => flags[k])
    .join('');

  const compiledRegexString = `/${pattern || ''}/${activeFlagsString}`;

  const handleCopyPattern = async () => {
    try {
      await navigator.clipboard.writeText(compiledRegexString);
      setCopiedPattern(true);
      setTimeout(() => setCopiedPattern(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyMatches = () => {
    onCopyMatches();
    setCopiedMatches(true);
    setTimeout(() => setCopiedMatches(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
        <div>
          <label htmlFor="pattern-input" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>Regular Expression Pattern</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              (JavaScript standard)
            </span>
          </label>
        </div>

        {/* Live Evaluation & Controls */}
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isLive}
              onChange={onToggleLive}
              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span>Live evaluation</span>
          </label>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
            Compiled: <code className="text-indigo-600 dark:text-indigo-400 font-semibold">{compiledRegexString}</code>
          </div>
        </div>
      </div>

      {/* Main Pattern Bar */}
      <div className="flex items-stretch rounded-lg border border-slate-300 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden transition-all">
        {/* Leading slash */}
        <div className="px-3 flex items-center justify-center font-mono text-slate-400 select-none text-lg">
          /
        </div>

        {/* Pattern input */}
        <input
          id="pattern-input"
          type="text"
          value={pattern}
          onChange={(e) => onPatternChange(e.target.value)}
          placeholder="e.g. [A-Z]\d{3} or (?<name>\w+)"
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent py-2.5 px-1 font-mono text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-w-0"
        />

        {/* Trailing slash */}
        <div className="px-3 flex items-center justify-center font-mono text-slate-400 select-none text-lg">
          /
        </div>

        {/* Flag toggles group */}
        <div className="flex items-center px-1.5 bg-slate-100 dark:bg-slate-800/80 border-l border-slate-200 dark:border-slate-700 gap-1">
          {(Object.keys(FLAG_DESCRIPTIONS) as (keyof RegexFlags)[]).map((flag) => {
            const isActive = flags[flag];
            const info = FLAG_DESCRIPTIONS[flag];
            return (
              <button
                key={flag}
                type="button"
                role="button"
                aria-pressed={isActive}
                aria-label={`${info.name} flag`}
                title={`${info.name} (${flag}): ${info.desc}`}
                onClick={() => onFlagToggle(flag)}
                className={`w-7 h-7 rounded font-mono text-xs font-bold transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                }`}
              >
                {flag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation error display */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-2.5 flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Run button */}
          <button
            type="button"
            onClick={onRun}
            disabled={status === 'running'}
            className="btn-primary"
            aria-label="Run regular expression"
          >
            {status === 'running' ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run</span>
              </>
            )}
          </button>

          {/* Next Pattern button */}
          <button
            type="button"
            onClick={onNextPattern}
            className="btn-secondary"
            title="Load the next regex pattern with its sample text and flags."
            aria-label="Load the next regex pattern with its sample text and flags."
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Next Pattern</span>
          </button>

          {/* Clear pattern */}
          <button
            type="button"
            onClick={onClear}
            className="btn-secondary"
            title="Clear pattern"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary"
            title="Reset pattern and flags to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Manual Run feedback message */}
          {manualRunFeedback && (
            <span
              role="status"
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-indigo-500" />
              <span>{manualRunFeedback}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy pattern */}
          <button
            type="button"
            onClick={handleCopyPattern}
            className="btn-secondary"
            title="Copy compiled regex"
          >
            {copiedPattern ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Pattern</span>
              </>
            )}
          </button>

          {/* Copy matches */}
          <button
            type="button"
            onClick={handleCopyMatches}
            disabled={!hasMatches}
            className="btn-secondary"
            title="Copy all match values to clipboard"
          >
            {copiedMatches ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Matches Copied!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Copy Matches</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
