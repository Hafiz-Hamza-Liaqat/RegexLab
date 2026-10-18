import React, { useState } from 'react';
import {
  Gamepad2,
  Trophy,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Lightbulb,
  Check,
  X,
} from 'lucide-react';
import { MISSIONS } from '../../data/missions.ts';
import { ACHIEVEMENTS } from '../../data/achievements.ts';
import { evaluateMission, type MissionEvaluationResult } from './evaluator.ts';
import { awardMissionCompletion } from '../progress/storage.ts';
import type { Mission, UserProgress } from '../../types/regex.ts';
import { DotMascot } from '../mascot/DotMascot.tsx';

interface RegexArcadeViewProps {
  progress: UserProgress;
  onUpdateProgress: (newProgress: UserProgress) => void;
  onOpenInClassicLab: (pattern: string, flags: string, text: string) => void;
}

export const RegexArcadeView: React.FC<RegexArcadeViewProps> = ({
  progress,
  onUpdateProgress,
  onOpenInClassicLab,
}) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    MISSIONS[0]?.id ?? 'mission-1-number-scout'
  );
  const [candidatePattern, setCandidatePattern] = useState<string>('');
  const [candidateFlags, setCandidateFlags] = useState<string>('g');
  const [unlockedHints, setUnlockedHints] = useState<number>(0);
  const [evalResult, setEvalResult] = useState<MissionEvaluationResult | null>(null);
  const [justSolved, setJustSolved] = useState<boolean>(false);

  const currentMission: Mission =
    MISSIONS.find((m) => m.id === selectedMissionId) || MISSIONS[0]!;

  const isCompleted = progress.completedMissionIds.includes(currentMission.id);

  const handleSelectMission = (mission: Mission) => {
    setSelectedMissionId(mission.id);
    setCandidatePattern(mission.startingPattern);
    setCandidateFlags(mission.startingFlags);
    setUnlockedHints(progress.hintsUsedByMission[mission.id] ?? 0);
    setEvalResult(null);
    setJustSolved(false);
  };

  const handleFlagToggle = (f: string) => {
    if (candidateFlags.includes(f)) {
      setCandidateFlags(candidateFlags.replace(f, ''));
    } else {
      setCandidateFlags(candidateFlags + f);
    }
  };

  const handleUnlockNextHint = () => {
    if (unlockedHints < 3) {
      const nextHints = unlockedHints + 1;
      setUnlockedHints(nextHints);
    }
  };

  const handleEvaluate = () => {
    const result = evaluateMission(currentMission, candidatePattern, candidateFlags);
    setEvalResult(result);

    if (result.passed) {
      setJustSolved(true);
      // Award XP and achievements
      const { progress: updated } = awardMissionCompletion(
        progress,
        currentMission.id,
        currentMission.xpReward,
        unlockedHints
      );
      onUpdateProgress(updated);
    } else {
      setJustSolved(false);
    }
  };

  const handleNextMission = () => {
    const currentIndex = MISSIONS.findIndex((m) => m.id === currentMission.id);
    if (currentIndex < MISSIONS.length - 1) {
      handleSelectMission(MISSIONS[currentIndex + 1]!);
    }
  };

  const completedCount = progress.completedMissionIds.length;
  const progressRatio = Math.round((completedCount / MISSIONS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Arcade Header & XP Dashboard */}
      <div className="rounded-xl border border-indigo-200 dark:border-indigo-950/80 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-purple-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 p-4 md:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Regex Detective Arcade
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{progress.totalXp} XP</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Master regular expressions through guided detective cases, hints, and rewards.
              </p>
            </div>
          </div>

          {/* Progress gauge */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {completedCount} of {MISSIONS.length} Solved
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {progressRatio}% Arcade completion
              </div>
            </div>

            <DotMascot
              mood={justSolved ? 'champion' : isCompleted ? 'happy' : 'thinking'}
              size="sm"
              showBubble={false}
            />
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressRatio}%` }}
          />
        </div>
      </div>

      {/* Main Arcade Layout: Mission list sidebar + Current Mission Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Missions Selector Sidebar */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Mission Dossiers
          </div>
          <div className="space-y-1.5">
            {MISSIONS.map((mission) => {
              const isSelected = mission.id === selectedMissionId;
              const isSolved = progress.completedMissionIds.includes(mission.id);

              return (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => handleSelectMission(mission)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isSolved ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="text-xs text-slate-900 dark:text-slate-100 truncate">
                        {mission.order}. {mission.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {mission.difficulty} · +{mission.xpReward} XP
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Achievements Summary Pill Card */}
          <div className="mt-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Achievements</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {progress.unlockedAchievementIds.length} / {ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = progress.unlockedAchievementIds.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    title={`${ach.title}: ${ach.description} (${isUnlocked ? 'Unlocked' : 'Locked'})`}
                    className={`h-8 rounded flex items-center justify-center text-sm border ${
                      isUnlocked
                        ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 opacity-30 grayscale'
                    }`}
                  >
                    <span>{ach.badge}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Active Mission Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">
            {/* Mission Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {currentMission.difficulty}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Mission #{currentMission.order}: {currentMission.title}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                  {currentMission.objective}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  +{currentMission.xpReward} XP
                </span>
                {isCompleted && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Solved</span>
                  </span>
                )}
              </div>
            </div>

            {/* Sample Case Text */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span>Mission Sample Text</span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenInClassicLab(
                      candidatePattern,
                      candidateFlags,
                      currentMission.sampleText
                    )
                  }
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
                >
                  Open in Classic Lab →
                </button>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {currentMission.sampleText}
              </div>
            </div>

            {/* Pattern Input Bar */}
            <div className="space-y-2 mb-4">
              <label htmlFor="mission-pattern-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Your Regex Solution:
              </label>
              <div className="flex items-stretch rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <div className="px-3 flex items-center justify-center font-mono text-slate-400 select-none text-base">
                  /
                </div>
                <input
                  id="mission-pattern-input"
                  type="text"
                  value={candidatePattern}
                  onChange={(e) => setCandidatePattern(e.target.value)}
                  placeholder="Enter your regular expression..."
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 bg-transparent py-2.5 px-1 font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-w-0"
                />
                <div className="px-3 flex items-center justify-center font-mono text-slate-400 select-none text-base">
                  /
                </div>

                {/* Flags toggles */}
                <div className="flex items-center px-1.5 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 gap-1">
                  {['g', 'i', 'm'].map((f) => {
                    const active = candidateFlags.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => handleFlagToggle(f)}
                        className={`w-6 h-6 rounded font-mono text-xs font-bold transition-all ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grading Button & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleEvaluate}
                className="btn-primary"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Test Solution</span>
              </button>

              {evalResult?.passed && (
                <button
                  type="button"
                  onClick={handleNextMission}
                  className="btn-secondary text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                >
                  <span>Next Case</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Test Case Feedback Results */}
            {evalResult && (
              <div
                className={`mt-4 p-4 rounded-xl border space-y-3 ${
                  evalResult.passed
                    ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                    : 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {evalResult.passed ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>Case Solved! (+{isCompleted ? 0 : currentMission.xpReward} XP awarded)</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5 text-rose-500" />
                        <span>Case Incomplete — Review test results below:</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-medium">{evalResult.summary}</span>
                </div>

                {/* Individual test results */}
                <div className="space-y-1.5 text-xs font-mono">
                  {evalResult.results.map((r, i) => (
                    <div
                      key={`tc-result-${i}`}
                      className={`p-2 rounded flex items-start gap-2 ${
                        r.passed
                          ? 'bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-100'
                          : 'bg-rose-100/60 dark:bg-rose-900/40 text-rose-950 dark:text-rose-100'
                      }`}
                    >
                      {r.passed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="font-semibold">{r.testCase.description}</div>
                        <div className="text-[11px] opacity-80">{r.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progressive Hint Drawer */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Detective Hint System ({unlockedHints} / 3 revealed)</span>
              </div>

              {unlockedHints < 3 && (
                <button
                  type="button"
                  onClick={handleUnlockNextHint}
                  className="btn-ghost text-xs text-amber-600 dark:text-amber-400 font-medium"
                >
                  Reveal Hint #{unlockedHints + 1}
                </button>
              )}
            </div>

            {unlockedHints === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Hints are available if you get stuck. Unlock Hint 1 to review the key concept!
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {unlockedHints >= 1 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                    <span className="font-bold">Hint 1 (Concept): </span>
                    {currentMission.hints[0]}
                  </div>
                )}
                {unlockedHints >= 2 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                    <span className="font-bold">Hint 2 (Structure): </span>
                    {currentMission.hints[1]}
                  </div>
                )}
                {unlockedHints >= 3 && (
                  <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200">
                    <span className="font-bold">Hint 3 (Reference Solution): </span>
                    <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border">
                      /{currentMission.solutionExample.pattern}/{currentMission.solutionExample.flags}
                    </code>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {currentMission.solutionExample.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
