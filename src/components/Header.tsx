import React from 'react';
import {
  Sparkles,
  Gamepad2,
  BookOpen,
  FlaskConical,
  Sun,
  Moon,
  Activity,
  Replace,
} from 'lucide-react';
import type { Theme } from '../hooks/useTheme.ts';

export type AppMode = 'classic' | 'replay' | 'arcade' | 'learn';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  isFindReplaceOpen: boolean;
  onToggleFindReplace: () => void;
  totalXp: number;
  theme: Theme;
  onToggleTheme: () => void;
  prefersReducedMotion: boolean;
  onToggleReducedMotion: () => void;
  matchCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  isFindReplaceOpen,
  onToggleFindReplace,
  totalXp,
  theme,
  onToggleTheme,
  prefersReducedMotion,
  onToggleReducedMotion,
  matchCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectMode('classic')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm ring-1 ring-indigo-500/30">
                <span className="font-mono font-black text-lg">.*</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                    RegexLab
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold">
                    v1.0
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Test. Animate. Master.
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Mode Tabs */}
          <nav
            className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            role="tablist"
            aria-label="Application modes"
          >
            <button
              type="button"
              role="tab"
              aria-selected={currentMode === 'classic'}
              onClick={() => onSelectMode('classic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentMode === 'classic'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Classic Lab</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentMode === 'replay'}
              onClick={() => onSelectMode('replay')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentMode === 'replay'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Animated Replay</span>
              {matchCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-mono font-bold">
                  {matchCount}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentMode === 'arcade'}
              onClick={() => onSelectMode('arcade')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentMode === 'arcade'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Regex Arcade</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentMode === 'learn'}
              onClick={() => onSelectMode('learn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentMode === 'learn'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>Learn Regex</span>
            </button>
          </nav>

          {/* Right actions: Find & Replace, XP, Theme, Reduced Motion, GitHub */}
          <div className="flex items-center gap-2">
            {/* Find & Replace toggle */}
            {currentMode === 'classic' && (
              <button
                type="button"
                onClick={onToggleFindReplace}
                className={`btn-secondary text-xs hidden sm:inline-flex ${
                  isFindReplaceOpen
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50'
                    : ''
                }`}
                aria-label="Toggle Find and Replace"
                title="Toggle Find & Replace panel"
              >
                <Replace className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
            )}

            {/* Total XP badge */}
            <div
              className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              onClick={() => onSelectMode('arcade')}
              title="Total Detective XP. Click to view Arcade missions and achievements."
            >
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{totalXp} XP</span>
            </div>

            {/* Reduced motion toggle */}
            <button
              type="button"
              onClick={onToggleReducedMotion}
              className={`btn-ghost text-xs p-2 ${
                prefersReducedMotion ? 'text-amber-500' : 'text-slate-500'
              }`}
              title={
                prefersReducedMotion
                  ? 'Reduced motion is enabled. Click to allow motion effects.'
                  : 'Click to enable reduced motion mode.'
              }
              aria-label="Toggle reduced motion"
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="btn-ghost text-xs p-2 text-slate-500 dark:text-slate-400"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* GitHub repo link */}
            <a
              href="https://github.com/Hafiz-Hamza-Liaqat/regexlab"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-xs p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              title="View on GitHub (Hafiz-Hamza-Liaqat/regexlab)"
              aria-label="GitHub repository"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800/80 max-w-full">
          <button
            type="button"
            onClick={() => onSelectMode('classic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentMode === 'classic'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
            }`}
          >
            Classic Lab
          </button>
          <button
            type="button"
            onClick={() => onSelectMode('replay')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              currentMode === 'replay'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
            }`}
          >
            <span>Animated Replay</span>
            {matchCount > 0 && <span>({matchCount})</span>}
          </button>
          <button
            type="button"
            onClick={() => onSelectMode('arcade')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentMode === 'arcade'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
            }`}
          >
            Arcade
          </button>
          <button
            type="button"
            onClick={() => onSelectMode('learn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentMode === 'learn'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
            }`}
          >
            Learn Regex
          </button>
          {currentMode === 'classic' && (
            <button
              type="button"
              aria-label="Toggle Find and Replace (mobile)"
              onClick={onToggleFindReplace}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                isFindReplaceOpen
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
              }`}
            >
              Replace
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
