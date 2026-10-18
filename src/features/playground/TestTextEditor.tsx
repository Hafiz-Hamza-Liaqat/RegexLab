import React, { useState } from 'react';
import { FileText, Eye, Edit3, Trash2 } from 'lucide-react';
import type { RegexMatch } from '../../types/regex.ts';

interface TestTextEditorProps {
  text: string;
  matches: RegexMatch[];
  activeMatchIndex?: number;
  onTextChange: (newText: string) => void;
  onClearText: () => void;
}

export const TestTextEditor: React.FC<TestTextEditorProps> = ({
  text,
  matches,
  activeMatchIndex,
  onTextChange,
  onClearText,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'highlight'>('split');

  // Compute text statistics
  const charCount = text.length;
  const lineCount = text.length === 0 ? 0 : text.split('\n').length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  /**
   * Safely slices text and wraps matches with styled React spans without innerHTML.
   */
  const renderHighlightedContent = () => {
    if (!text) {
      return (
        <span className="text-slate-400 dark:text-slate-500 italic select-none">
          No test text provided. Type above or choose a preset.
        </span>
      );
    }

    if (matches.length === 0) {
      return <span>{text}</span>;
    }

    // Sort matches strictly by start index
    const sortedMatches = [...matches].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    for (let i = 0; i < sortedMatches.length; i++) {
      const match = sortedMatches[i]!;
      // Prevent overlapping bugs
      if (match.start < lastIndex) {
        continue;
      }

      // Add text before the match
      if (match.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.start)}</span>
        );
      }

      // Add highlighted match span
      const isActive = activeMatchIndex !== undefined && match.index === activeMatchIndex;
      elements.push(
        <mark
          key={`match-${match.index}-${match.start}`}
          data-match-index={match.index}
          className={`match-highlight ${
            isActive ? 'match-highlight-active' : ''
          }`}
          title={`Match #${match.index} [${match.start} → ${match.end}]`}
        >
          {match.value.length === 0 ? '·' : match.value}
        </mark>
      );

      lastIndex = match.end;
    }

    // Add trailing text after the last match
    if (lastIndex < text.length) {
      elements.push(<span key={`text-end-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <label htmlFor="test-text-area" className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Test Text</span>
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({charCount.toLocaleString()} chars · {wordCount} words · {lineCount} lines)
          </span>
        </div>

        {/* View toggle & Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3 h-3 inline mr-1" />
              Editor Only
            </button>
            <button
              type="button"
              onClick={() => setViewMode('highlight')}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                viewMode === 'highlight'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3 inline mr-1" />
              Highlights
            </button>
          </div>

          <button
            type="button"
            onClick={onClearText}
            className="btn-ghost text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
            title="Clear all test text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor & Highlight Container */}
      <div
        className={`grid gap-4 ${
          viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Multiline textarea input */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className="flex flex-col">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Raw Text Editor</span>
              <span className="text-[11px] text-slate-400">Type or paste text here</span>
            </div>
            <textarea
              id="test-text-area"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Paste or write your test text here..."
              rows={9}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 p-3 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y transition-all"
            />
          </div>
        )}

        {/* Highlighted text preview */}
        {(viewMode === 'split' || viewMode === 'highlight') && (
          <div className="flex flex-col">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Highlighted Matches</span>
              <span className="text-[11px] text-slate-400">
                {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
              </span>
            </div>
            <div
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-sm text-slate-900 dark:text-slate-100 min-h-[14rem] max-h-[28rem] overflow-y-auto whitespace-pre-wrap break-all leading-relaxed"
              aria-label="Highlighted match preview"
            >
              {renderHighlightedContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
