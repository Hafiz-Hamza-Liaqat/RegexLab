import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Gauge,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { RegexMatch } from '../../types/regex.ts';
import { DotMascot } from '../mascot/DotMascot.tsx';

interface AnimatedReplayStageProps {
  text: string;
  pattern: string;
  flags: string;
  matches: RegexMatch[];
  replacementTemplate?: string;
  isReplacementEnabled?: boolean;
  prefersReducedMotion: boolean;
  onReturnToClassic: () => void;
}

export const AnimatedReplayStage: React.FC<AnimatedReplayStageProps> = ({
  text,
  pattern,
  flags,
  matches,
  replacementTemplate = '',
  isReplacementEnabled = false,
  prefersReducedMotion,
  onReturnToClassic,
}) => {
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5, 1, 2
  const [scanOffset, setScanOffset] = useState<number>(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalMatches = matches.length;
  const isCompleted = revealedCount >= totalMatches && totalMatches > 0;
  const activeMatch = revealedCount > 0 && revealedCount <= totalMatches ? matches[revealedCount - 1] : undefined;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /**
   * Performs step advancement during replay
   */
  const advanceReplayStep = useCallback(() => {
    setRevealedCount((prev) => {
      if (prev >= totalMatches) {
        setIsPlaying(false);
        return prev;
      }

      const nextIndex = prev + 1;
      const nextMatch = matches[prev];
      if (nextMatch) {
        setScanOffset(nextMatch.end);
      }

      if (nextIndex >= totalMatches) {
        setIsPlaying(false);
      }
      return nextIndex;
    });
  }, [matches, totalMatches]);

  // Main playback loop
  useEffect(() => {
    if (!isPlaying || totalMatches === 0 || revealedCount >= totalMatches) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setRevealedCount(totalMatches);
        setScanOffset(text.length);
        setIsPlaying(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const delay = Math.max(200, Math.round(900 / speed));

    timerRef.current = setTimeout(() => {
      advanceReplayStep();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, revealedCount, totalMatches, speed, prefersReducedMotion, text.length, advanceReplayStep]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (revealedCount >= totalMatches) {
        // If already at end, restart
        setRevealedCount(0);
        setScanOffset(0);
      }
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRevealedCount(0);
    setScanOffset(0);
    setIsPlaying(true);
  };

  const handleNextMatch = () => {
    if (revealedCount < totalMatches) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
      const nextCount = revealedCount + 1;
      setRevealedCount(nextCount);
      const match = matches[revealedCount];
      if (match) setScanOffset(match.end);
    }
  };

  const handlePrevMatch = () => {
    if (revealedCount > 1) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
      const prevCount = revealedCount - 1;
      setRevealedCount(prevCount);
      const match = matches[prevCount - 1];
      if (match) setScanOffset(match.end);
    } else if (revealedCount === 1) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
      setRevealedCount(0);
      setScanOffset(0);
    }
  };

  const handleShowAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setRevealedCount(totalMatches);
    setScanOffset(text.length);
  };

  /**
   * Renders the test text with animated reveal spans
   */
  const renderAnimatedText = () => {
    if (!text) {
      return (
        <span className="text-slate-400 italic">No text provided. Return to Classic Lab to enter text.</span>
      );
    }

    if (totalMatches === 0) {
      return <span>{text}</span>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    for (let i = 0; i < totalMatches; i++) {
      const match = matches[i]!;
      if (match.start < lastIndex) continue;

      // Plain text before match
      if (match.start > lastIndex) {
        elements.push(
          <span key={`text-seg-${lastIndex}`}>{text.slice(lastIndex, match.start)}</span>
        );
      }

      const isRevealed = i < revealedCount;
      const isCurrentlyActive = i === revealedCount - 1;

      // Replacement preview expansion if enabled
      let displayContent = match.value.length === 0 ? '·' : match.value;
      if (isReplacementEnabled && isRevealed && replacementTemplate) {
        // Expand template
        displayContent = replacementTemplate
          .replace(/\$&/g, match.value)
          .replace(/\$1/g, match.groups[0]?.value ?? '')
          .replace(/\$2/g, match.groups[1]?.value ?? '')
          .replace(/\$3/g, match.groups[2]?.value ?? '');
      }

      elements.push(
        <span
          key={`match-replay-${match.index}`}
          className={`inline-block transition-all duration-300 rounded px-0.5 ${
            isRevealed
              ? isCurrentlyActive
                ? 'bg-indigo-500/40 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-400 scale-105 shadow-md font-bold'
                : 'bg-amber-400/30 text-amber-950 dark:text-amber-100 border-b-2 border-amber-500 font-semibold'
              : 'opacity-40 border-b border-dashed border-slate-400'
          }`}
          title={`Match #${match.index} [${match.start} → ${match.end}]`}
        >
          {displayContent}
        </span>
      );

      // Scanning indicator marker right after the active match
      if (isCurrentlyActive && isPlaying && !prefersReducedMotion) {
        elements.push(
          <span key={`scan-cursor-${match.index}`} className="replay-scanner-line mx-0.5" />
        );
      }

      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      elements.push(<span key={`text-end-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return elements;
  };

  const progressPercentage = totalMatches > 0 ? Math.round((revealedCount / totalMatches) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Deck */}
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-950/60 bg-gradient-to-r from-indigo-50/60 via-slate-50 to-purple-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 shadow-sm p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReturnToClassic}
              className="btn-secondary text-xs"
              title="Return to Classic Lab"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Classic Lab</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Animated Replay</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                  /{pattern}/{flags}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authentic step-by-step traversal of matches discovered in your test text
              </p>
            </div>
          </div>

          {/* Progress stats & Mascot */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {totalMatches === 0
                  ? 'No matches'
                  : `Match ${revealedCount} of ${totalMatches}`}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {progressPercentage}% scanned
              </div>
            </div>

            <DotMascot
              mood={
                totalMatches === 0
                  ? 'confused'
                  : isCompleted
                  ? 'happy'
                  : isPlaying
                  ? 'scanning'
                  : 'thinking'
              }
              size="sm"
              showBubble={false}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Control Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={totalMatches === 0}
              className="btn-primary"
              aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{revealedCount === 0 ? 'Run Animation' : isCompleted ? 'Replay' : 'Resume'}</span>
                </>
              )}
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={handleRestart}
              disabled={totalMatches === 0}
              className="btn-secondary"
              title="Replay from the beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            {/* Previous */}
            <button
              type="button"
              onClick={handlePrevMatch}
              disabled={revealedCount <= 0}
              className="btn-secondary"
              title="Previous match"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={handleNextMatch}
              disabled={revealedCount >= totalMatches}
              className="btn-secondary"
              title="Next match"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Show All Matches */}
            <button
              type="button"
              onClick={handleShowAll}
              disabled={isCompleted || totalMatches === 0}
              className="btn-secondary"
              title="Instantly reveal all matches"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Show All Matches</span>
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>Speed:</span>
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                    speed === s
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Replay Stage & Progressive Match Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Animated Text Presentation (2 Columns) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Live Replay Canvas
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Replay completed ({totalMatches} matches revealed)</span>
              </div>
            )}
          </div>

          <div
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-sm text-slate-900 dark:text-slate-100 min-h-[18rem] max-h-[30rem] overflow-y-auto whitespace-pre-wrap break-all leading-relaxed"
            aria-label="Animated regex match replay canvas"
          >
            {renderAnimatedText()}
          </div>

          {/* Replay Status Banner */}
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <div>
              Scanning position:{' '}
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {scanOffset} / {text.length} chars
              </span>
            </div>
            {prefersReducedMotion && (
              <span className="italic text-amber-500">
                Reduced motion active: instant reveals enabled
              </span>
            )}
          </div>
        </div>

        {/* Progressive Match Cards Stream (1 Column) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 flex flex-col">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
            <span>Revealed Match Cards</span>
            <span className="text-slate-400 font-normal">
              {revealedCount} / {totalMatches}
            </span>
          </div>

          {totalMatches === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <DotMascot mood="confused" size="sm" showBubble={false} />
              <p>No matches available to replay.</p>
            </div>
          ) : revealedCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <DotMascot mood="idle" size="sm" showBubble={false} />
              <p>Press "Run Animation" to begin scanning matches.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[26rem] pr-1">
              {matches.slice(0, revealedCount).map((match, idx) => {
                const isLatest = idx === revealedCount - 1;
                return (
                  <div
                    key={`revealed-card-${match.index}`}
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      isLatest
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        Match #{match.index}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        [{match.start} → {match.end}]
                      </span>
                    </div>

                    <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 break-all mb-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      "{match.value}"
                    </div>

                    {match.groups.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-indigo-500" />
                          <span>Groups ({match.groups.length})</span>
                        </div>
                        {match.groups.map((g) => (
                          <div
                            key={`rg-${match.index}-${g.index}`}
                            className="text-[10px] font-mono flex items-center justify-between text-slate-600 dark:text-slate-400"
                          >
                            <span>${g.index}{g.name ? ` (${g.name})` : ''}:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate ml-1">
                              "{g.value}"
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeMatch && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Active match focus:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                #{activeMatch.index} ({activeMatch.value.length} chars)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
