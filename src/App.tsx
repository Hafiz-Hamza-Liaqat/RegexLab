import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header, type AppMode } from './components/Header.tsx';
import { PatternEditor } from './features/playground/PatternEditor.tsx';
import { PresetSelector } from './features/playground/PresetSelector.tsx';
import { TestTextEditor } from './features/playground/TestTextEditor.tsx';
import { MatchInspector } from './features/playground/MatchInspector.tsx';
import { AnimatedReplayStage } from './features/animated-replay/AnimatedReplayStage.tsx';
import { FindReplacePanel } from './features/replace/FindReplacePanel.tsx';
import { RegexArcadeView } from './features/arcade/RegexArcadeView.tsx';
import { RegexLearningView } from './features/learning/RegexLearningView.tsx';
import { DotMascot } from './features/mascot/DotMascot.tsx';
import { useTheme } from './hooks/useTheme.ts';
import { useReducedMotion } from './hooks/useReducedMotion.ts';
import { PRESETS } from './data/presets.ts';
import { defaultWorkerManager } from './lib/regex/workerManager.ts';
import {
  loadProgress,
  unlockAchievement,
} from './features/progress/storage.ts';
import type {
  RegexFlags,
  RegexRunResult,
  ReplaceRunResult,
  Preset,
  MascotMood,
  UserProgress,
} from './types/regex.ts';

const DEFAULT_FLAGS: RegexFlags = {
  g: true,
  i: false,
  m: false,
  s: false,
  u: false,
};

export const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { prefersReduced: prefersReducedMotion, toggleReducedMotion } = useReducedMotion();

  const [mode, setMode] = useState<AppMode>('classic');
  const [activePresetId, setActivePresetId] = useState<string>('numbers');

  const initialPreset = PRESETS.find((p) => p.id === 'numbers') || PRESETS[0]!;

  const [pattern, setPattern] = useState<string>(initialPreset.pattern);
  const [flags, setFlags] = useState<RegexFlags>(() => {
    const f: RegexFlags = { ...DEFAULT_FLAGS };
    f.g = initialPreset.flags.includes('g');
    f.i = initialPreset.flags.includes('i');
    f.m = initialPreset.flags.includes('m');
    f.s = initialPreset.flags.includes('s');
    f.u = initialPreset.flags.includes('u');
    return f;
  });
  const [testText, setTestText] = useState<string>(initialPreset.text);

  const [isLive, setIsLive] = useState<boolean>(true);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState<boolean>(false);
  const [replacementTemplate, setReplacementTemplate] = useState<string>('[$&]');

  const [matchResult, setMatchResult] = useState<RegexRunResult>({
    id: 'initial',
    status: 'idle',
    matches: [],
    totalMatches: 0,
    executionTimeMs: 0,
  });

  const [replaceResult, setReplaceResult] = useState<ReplaceRunResult | null>(null);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number | undefined>(undefined);

  // Mascot state
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [mascotMessage, setMascotMessage] = useState<string>('Ready to analyze regular expressions!');

  // User progress state
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flagsString = (Object.keys(flags) as (keyof RegexFlags)[])
    .filter((k) => flags[k])
    .join('');

  /**
   * Executes regex matching using safe worker
   */
  const handleExecuteRegex = useCallback(async () => {
    const reqId = `req-${Date.now()}-${Math.random()}`;
    setMatchResult((prev) => ({ ...prev, status: 'running' }));
    setMascotMood('scanning');
    setMascotMessage('Dot is scanning the text!');

    const result = await defaultWorkerManager.runMatch({
      id: reqId,
      pattern,
      flags: flagsString,
      text: testText,
    });

    setMatchResult(result);

    if (result.status === 'success') {
      setMascotMood('happy');
      setMascotMessage(
        result.totalMatches === 1
          ? 'Found 1 match. Case closed!'
          : `Found ${result.totalMatches} matches. Case closed!`
      );

      // Unlock first match achievement
      setProgress((prev) => {
        const { progress: p1 } = unlockAchievement(prev, 'first-match');
        if (result.matches.some((m) => m.groups.length > 0)) {
          const { progress: p2 } = unlockAchievement(p1, 'capture-expert');
          return p2;
        }
        return p1;
      });
    } else if (result.status === 'no-match') {
      setMascotMood('confused');
      setMascotMessage('No matches yet. Want to try a different pattern or flag?');
    } else if (result.status === 'timeout') {
      setMascotMood('confused');
      setMascotMessage('Execution timed out! The worker was safely terminated to prevent freezing.');
    } else if (result.status === 'error') {
      setMascotMood('thinking');
      setMascotMessage('Pattern error. Check your brackets or escape characters!');
    }
  }, [pattern, flagsString, testText]);

  /**
   * Executes replacement
   */
  const handleExecuteReplace = useCallback(async () => {
    if (!pattern) {
      setReplaceResult(null);
      return;
    }
    const reqId = `rep-${Date.now()}-${Math.random()}`;
    const result = await defaultWorkerManager.runReplace({
      id: reqId,
      pattern,
      flags: flagsString,
      text: testText,
      replacement: replacementTemplate,
    });
    setReplaceResult(result);

    if (result.status === 'success' && result.replacementCount > 0) {
      setProgress((prev) => {
        const { progress: p } = unlockAchievement(prev, 'replace-wizard');
        return p;
      });
    }
  }, [pattern, flagsString, testText, replacementTemplate]);

  // Debounced live evaluation
  useEffect(() => {
    if (!isLive) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleExecuteRegex();
      if (isFindReplaceOpen) {
        handleExecuteReplace();
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pattern, flags, testText, isLive, isFindReplaceOpen, replacementTemplate, handleExecuteRegex, handleExecuteReplace]);

  // Preset loading handler
  const handleSelectPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setPattern(preset.pattern);
    const newFlags: RegexFlags = {
      g: preset.flags.includes('g'),
      i: preset.flags.includes('i'),
      m: preset.flags.includes('m'),
      s: preset.flags.includes('s'),
      u: preset.flags.includes('u'),
    };
    setFlags(newFlags);
    setTestText(preset.text);
    setActiveMatchIndex(undefined);
  };

  const handleFlagToggle = (flagKey: keyof RegexFlags) => {
    setFlags((prev) => ({ ...prev, [flagKey]: !prev[flagKey] }));
  };

  const handleClearPattern = () => {
    setPattern('');
    setActiveMatchIndex(undefined);
  };

  const handleReset = () => {
    handleSelectPreset(initialPreset);
  };

  const handleCopyMatches = async () => {
    const matchStrings = matchResult.matches.map((m) => m.value).join('\n');
    try {
      await navigator.clipboard.writeText(matchStrings);
    } catch {
      // fallback
    }
  };

  const handleOpenInClassicLab = (p: string, f: string, t: string) => {
    setPattern(p);
    const updatedFlags: RegexFlags = {
      g: f.includes('g'),
      i: f.includes('i'),
      m: f.includes('m'),
      s: f.includes('s'),
      u: f.includes('u'),
    };
    setFlags(updatedFlags);
    setTestText(t);
    setMode('classic');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <Header
        currentMode={mode}
        onSelectMode={(m) => setMode(m)}
        isFindReplaceOpen={isFindReplaceOpen}
        onToggleFindReplace={() => setIsFindReplaceOpen((prev) => !prev)}
        totalXp={progress.totalXp}
        theme={theme}
        onToggleTheme={toggleTheme}
        prefersReducedMotion={prefersReducedMotion}
        onToggleReducedMotion={toggleReducedMotion}
        matchCount={matchResult.totalMatches}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Mascot Banner in Classic Lab */}
        {mode === 'classic' && (
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xs">
            <DotMascot mood={mascotMood} message={mascotMessage} size="sm" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Need guided practice?</span>
              <button
                type="button"
                onClick={() => setMode('arcade')}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Explore Regex Arcade →
              </button>
            </div>
          </div>
        )}

        {/* View Mode 1: Classic Lab */}
        {mode === 'classic' && (
          <div className="space-y-6">
            {/* Pattern Editor & Flags */}
            <PatternEditor
              pattern={pattern}
              flags={flags}
              status={matchResult.status}
              errorMessage={matchResult.status === 'error' ? matchResult.error : undefined}
              isLive={isLive}
              onPatternChange={(p) => setPattern(p)}
              onFlagToggle={handleFlagToggle}
              onRun={() => {
                handleExecuteRegex();
                if (isFindReplaceOpen) handleExecuteReplace();
              }}
              onClear={handleClearPattern}
              onReset={handleReset}
              onToggleLive={() => setIsLive((prev) => !prev)}
              onCopyMatches={handleCopyMatches}
              hasMatches={matchResult.matches.length > 0}
            />

            {/* Presets Bar */}
            <PresetSelector
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
            />

            {/* Optional Find & Replace Panel */}
            {isFindReplaceOpen && (
              <FindReplacePanel
                pattern={pattern}
                flags={flagsString}
                originalText={testText}
                replacementTemplate={replacementTemplate}
                replaceResult={replaceResult}
                onReplacementChange={(val) => setReplacementTemplate(val)}
                onClearReplacement={() => setReplacementTemplate('')}
                onExecuteReplace={handleExecuteReplace}
              />
            )}

            {/* Test Text Editor & Highlights */}
            <TestTextEditor
              text={testText}
              matches={matchResult.matches}
              activeMatchIndex={activeMatchIndex}
              onTextChange={(val) => setTestText(val)}
              onClearText={() => setTestText('')}
            />

            {/* Match Inspection Cards */}
            <MatchInspector
              status={matchResult.status}
              matches={matchResult.matches}
              totalMatches={matchResult.totalMatches}
              executionTimeMs={matchResult.executionTimeMs}
              truncated={matchResult.truncated}
              errorMessage={matchResult.error}
              activeMatchIndex={activeMatchIndex}
              onSelectMatch={(idx) => setActiveMatchIndex(idx)}
            />
          </div>
        )}

        {/* View Mode 2: Animated Replay (Signature Feature) */}
        {mode === 'replay' && (
          <AnimatedReplayStage
            text={testText}
            pattern={pattern}
            flags={flagsString}
            matches={matchResult.matches}
            replacementTemplate={replacementTemplate}
            isReplacementEnabled={isFindReplaceOpen}
            prefersReducedMotion={prefersReducedMotion}
            onReturnToClassic={() => setMode('classic')}
          />
        )}

        {/* View Mode 3: Regex Arcade */}
        {mode === 'arcade' && (
          <RegexArcadeView
            progress={progress}
            onUpdateProgress={(p) => setProgress(p)}
            onOpenInClassicLab={handleOpenInClassicLab}
          />
        )}

        {/* View Mode 4: Learn Regex & Token Explainer */}
        {mode === 'learn' && (
          <RegexLearningView
            onOpenInClassicLab={handleOpenInClassicLab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              RegexLab
            </span>
            <span>— Test. Animate. Master.</span>
            <span>· MIT License</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span>Runs locally with Web Worker ReDoS safety</span>
            <span>·</span>
            <a
              href="https://github.com/Hafiz-Hamza-Liaqat/regexlab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
