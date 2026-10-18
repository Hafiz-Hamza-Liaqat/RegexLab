import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProgress,
  awardMissionCompletion,
  unlockAchievement,
  resetProgress,
  PROGRESS_STORAGE_KEY,
  DEFAULT_PROGRESS,
} from '../../src/features/progress/storage.ts';
import { MISSIONS } from '../../src/data/missions.ts';

describe('Progress & Achievements Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default progress on clean storage', () => {
    const progress = loadProgress();
    expect(progress.version).toBe(1);
    expect(progress.totalXp).toBe(0);
    expect(progress.completedMissionIds).toHaveLength(0);
    expect(progress.unlockedAchievementIds).toHaveLength(0);
  });

  it('awards XP on first mission completion and persists it', () => {
    const initial = loadProgress();
    const { progress: updated, xpAwarded, newlyUnlockedAchievements } = awardMissionCompletion(
      initial,
      'mission-1-number-scout',
      50,
      1
    );

    expect(xpAwarded).toBe(50);
    expect(updated.totalXp).toBe(50);
    expect(updated.completedMissionIds).toContain('mission-1-number-scout');
    expect(newlyUnlockedAchievements).toContain('arcade-rookie');
    expect(newlyUnlockedAchievements).toContain('detective-companion'); // <3 hints used

    // Reload from storage
    const loaded = loadProgress();
    expect(loaded.totalXp).toBe(50);
    expect(loaded.completedMissionIds).toContain('mission-1-number-scout');
  });

  it('is completely idempotent: replaying a completed mission awards 0 additional XP', () => {
    const initial = loadProgress();
    const firstRun = awardMissionCompletion(initial, 'mission-1-number-scout', 50, 0);
    expect(firstRun.xpAwarded).toBe(50);

    // Replay same mission
    const secondRun = awardMissionCompletion(firstRun.progress, 'mission-1-number-scout', 50, 0);
    expect(secondRun.xpAwarded).toBe(0);
    expect(secondRun.progress.totalXp).toBe(50);
    expect(secondRun.newlyUnlockedAchievements).toHaveLength(0);
  });

  it('unlocks arcade-finisher when all missions are completed', () => {
    let progress = loadProgress();
    for (const m of MISSIONS) {
      const res = awardMissionCompletion(progress, m.id, m.xpReward, 0);
      progress = res.progress;
    }

    expect(progress.unlockedAchievementIds).toContain('arcade-finisher');
    expect(progress.unlockedAchievementIds).toContain('regex-master'); // total XP >= 500
  });

  it('idempotently unlocks individual achievements', () => {
    const initial = loadProgress();
    const res1 = unlockAchievement(initial, 'first-match');
    expect(res1.newlyUnlocked).toBe(true);
    expect(res1.progress.unlockedAchievementIds).toContain('first-match');

    const res2 = unlockAchievement(res1.progress, 'first-match');
    expect(res2.newlyUnlocked).toBe(false);
  });

  it('gracefully recovers when localStorage contains corrupted JSON', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, '{invalid-json:broken');
    const progress = loadProgress();
    expect(progress).toEqual(DEFAULT_PROGRESS);
  });

  it('gracefully recovers when localStorage schema version mismatches', () => {
    localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 999, completedMissionIds: ['fake'] })
    );
    const progress = loadProgress();
    expect(progress).toEqual(DEFAULT_PROGRESS);
  });

  it('resets progress cleanly', () => {
    const initial = loadProgress();
    const updated = awardMissionCompletion(initial, 'mission-1-number-scout', 50, 0).progress;
    expect(updated.totalXp).toBe(50);

    const reset = resetProgress();
    expect(reset.totalXp).toBe(0);
    expect(reset.completedMissionIds).toHaveLength(0);
  });
});
