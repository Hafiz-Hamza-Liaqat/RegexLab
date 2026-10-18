import React, { useState } from 'react';
import {
  ListFilter,
  Layers,
  Clock,
  Search,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type { RegexMatch, RegexRunStatus } from '../../types/regex.ts';
import { DotMascot } from '../mascot/DotMascot.tsx';

interface MatchInspectorProps {
  status: RegexRunStatus;
  matches: RegexMatch[];
  totalMatches: number;
  executionTimeMs: number;
  truncated?: boolean;
  errorMessage?: string;
  activeMatchIndex?: number;
  onSelectMatch?: (index: number) => void;
}

export const MatchInspector: React.FC<MatchInspectorProps> = ({
  status,
  matches,
  totalMatches,
  executionTimeMs,
  truncated,
  errorMessage,
  activeMatchIndex,
  onSelectMatch,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredMatches = filterQuery.trim() === ''
    ? matches
    : matches.filter((m) =>
        m.value.toLowerCase().includes(filterQuery.toLowerCase()) ||
        m.groups.some((g) => g.value.toLowerCase().includes(filterQuery.toLowerCase()))
      );

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5 transition-colors">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Match Inspection
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {totalMatches} {totalMatches === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{executionTimeMs} ms</span>
          </div>
          {truncated && (
            <span className="text-amber-500 font-medium">
              (Results capped at 2,000 matches)
            </span>
          )}
        </div>
      </div>

      {/* Timeout Error State */}
      {status === 'timeout' && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Execution Timeout (ReDoS Protection)</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            {errorMessage ||
              'Regex evaluation exceeded the safety deadline (2,000ms). The background Web Worker was safely terminated to prevent freezing your browser. Simplify nested quantifiers like (a+)+ or check for unbounded repetition.'}
          </p>
        </div>
      )}

      {/* Pattern Error State */}
      {status === 'error' && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Pattern Error</span>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300">
            {errorMessage || 'Invalid regular expression syntax. Check brackets, escapes, or flags.'}
          </p>
        </div>
      )}

      {/* Empty / No Matches State */}
      {status === 'no-match' && (
        <div className="py-8 px-4 flex flex-col items-center text-center space-y-3">
          <DotMascot mood="confused" size="md" showBubble={false} />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No matches found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              The current regular expression did not match any text in your test dataset.
            </p>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 max-w-md text-left space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Detective Tips:</span>
            </div>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Try enabling the <code className="font-bold">i</code> flag for case-insensitive matching.</li>
              <li>Ensure anchors like <code className="font-bold">^</code> or <code className="font-bold">$</code> are not preventing matches.</li>
              <li>Test with a simpler sub-pattern to isolate the matching boundary.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Success Matches State */}
      {status === 'success' && matches.length > 0 && (
        <div className="space-y-3">
          {/* Match filter search */}
          {matches.length > 6 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter matches or capture groups..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Match Cards List */}
          <div className="space-y-2.5 max-h-[32rem] overflow-y-auto pr-1">
            {filteredMatches.map((match) => {
              const isSelected = activeMatchIndex === match.index;
              const hasGroups = match.groups.length > 0;

              return (
                <div
                  key={`match-card-${match.index}`}
                  onClick={() => onSelectMatch?.(match.index)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        Match #{match.index}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        Index {match.start} → {match.end} ({match.end - match.start} chars)
                      </span>
                    </div>

                    {hasGroups && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        <span>{match.groups.length} {match.groups.length === 1 ? 'group' : 'groups'}</span>
                      </span>
                    )}
                  </div>

                  {/* Matched text value */}
                  <div className="mb-2">
                    <code className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/60 break-all inline-block">
                      {match.value.length === 0 ? '<Zero-length match>' : match.value}
                    </code>
                  </div>

                  {/* Context snippet */}
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800/80 break-all truncate">
                    <span className="opacity-60">{match.inputContext.prefix}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-0.5 rounded">
                      [{match.value}]
                    </span>
                    <span className="opacity-60">{match.inputContext.suffix}</span>
                  </div>

                  {/* Capture groups inspection */}
                  {hasGroups && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Capture Groups:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {match.groups.map((group) => (
                          <div
                            key={`group-${match.index}-${group.index}`}
                            className="text-[11px] font-mono p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1"
                          >
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                              {group.name ? `$${group.index} (${group.name})` : `$${group.index}`}:
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 truncate font-medium">
                              "{group.value}"
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              [{group.start}-{group.end}]
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
