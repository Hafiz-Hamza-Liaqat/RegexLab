import React, { useState } from 'react';
import {
  Replace,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  FileText,
} from 'lucide-react';
import type { ReplaceRunResult } from '../../types/regex.ts';

interface FindReplacePanelProps {
  pattern: string;
  flags: string;
  originalText: string;
  replacementTemplate: string;
  replaceResult: ReplaceRunResult | null;
  onReplacementChange: (val: string) => void;
  onClearReplacement: () => void;
  onExecuteReplace: () => void;
}

export const FindReplacePanel: React.FC<FindReplacePanelProps> = ({
  pattern,
  flags,
  originalText,
  replacementTemplate,
  replaceResult,
  onReplacementChange,
  onClearReplacement,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyOutput = async () => {
    if (!replaceResult?.resultText) return;
    try {
      await navigator.clipboard.writeText(replaceResult.resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const insertToken = (token: string) => {
    onReplacementChange(replacementTemplate + token);
  };

  const isGlobal = flags.includes('g');

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5 transition-colors space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Replace className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Find & Replace Engine
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            Mode: {isGlobal ? 'Global (replace all)' : 'Single (first match only)'}
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Target pattern: <code className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">/{pattern}/{flags}</code>
        </div>
      </div>

      {/* Replacement Template Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="replace-template-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Replacement Template
          </label>
          {/* Quick substitution token pills */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Tokens:</span>
            <button
              type="button"
              onClick={() => insertToken('$&')}
              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono"
              title="Insert matched substring ($&)"
            >
              $&
            </button>
            <button
              type="button"
              onClick={() => insertToken('$1')}
              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono"
              title="Insert group 1 ($1)"
            >
              $1
            </button>
            <button
              type="button"
              onClick={() => insertToken('$2')}
              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono"
              title="Insert group 2 ($2)"
            >
              $2
            </button>
            <button
              type="button"
              onClick={() => insertToken('$<name>')}
              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono"
              title="Insert named group ($<name>)"
            >
              $&lt;name&gt;
            </button>
            <button
              type="button"
              onClick={() => insertToken('$$')}
              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono"
              title="Insert literal dollar sign ($$)"
            >
              $$
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            id="replace-template-input"
            type="text"
            value={replacementTemplate}
            onChange={(e) => onReplacementChange(e.target.value)}
            placeholder="e.g. [$1] or [REDACTED] or -$$-"
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 px-3 py-2 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <button
            type="button"
            onClick={onClearReplacement}
            className="btn-secondary"
            title="Clear replacement template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Comparison Preview (Original vs Replaced) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Text Reference */}
        <div className="flex flex-col space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Original Input</span>
            </span>
            <span className="text-[11px] text-slate-400">{originalText.length} chars</span>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-xs text-slate-800 dark:text-slate-200 min-h-[9rem] max-h-[16rem] overflow-y-auto whitespace-pre-wrap break-all leading-relaxed">
            {originalText || <span className="text-slate-400 italic">No input text.</span>}
          </div>
        </div>

        {/* Replacement Output Preview */}
        <div className="flex flex-col space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Replaced Result</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {replaceResult?.replacementCount ?? 0} {replaceResult?.replacementCount === 1 ? 'replacement' : 'replacements'}
              </span>
              <button
                type="button"
                onClick={handleCopyOutput}
                disabled={!replaceResult?.resultText}
                className="btn-ghost text-xs p-1 h-auto min-h-0 text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                title="Copy replaced result"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <div
            className="rounded-lg border border-indigo-200 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/20 p-3 font-mono text-xs text-slate-900 dark:text-slate-100 min-h-[9rem] max-h-[16rem] overflow-y-auto whitespace-pre-wrap break-all leading-relaxed"
            aria-label="Replaced output preview"
          >
            {replaceResult?.resultText !== undefined ? (
              replaceResult.resultText
            ) : (
              <span className="text-slate-400 italic">Enter a pattern to preview replacement.</span>
            )}
          </div>
        </div>
      </div>

      {/* Semantic Guide footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span><code className="font-bold">$$</code>: literal $</span>
        <span><code className="font-bold">$&</code>: matched text</span>
        <span><code className="font-bold">$1, $2</code>: capture groups</span>
        <span><code className="font-bold">$&lt;name&gt;</code>: named group</span>
        <span><code className="font-bold">$`</code>: prefix text</span>
        <span><code className="font-bold">$'</code>: suffix text</span>
      </div>
    </div>
  );
};
