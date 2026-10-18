import type { UserProgress } from '../../types/regex.ts';
import { MISSIONS } from '../../data/missions.ts';

export const PROGRESS_STORAGE_KEY = 'regexlab_progress_v1';
export const CURRENT_PROGRESS_VERSION = 1;

export const DEFAULT_PROGRESS: UserProgress = {
  version: CURRENT_PROGRESS_VERSION,
  completedMissionIds: [],
  hintsUsedByMission: {},
  earnedXpEvents: [],
  totalXp: 0,
  unlockedAchievementIds: [],
  lastActive: Date.now(),
};

/**
 * Safely loads user learning progress from localStorage.
 * Gracefully handles missing, corrupted, or older schema versions.
 */
export function loadProgress(): UserProgress {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...DEFAULT_PROGRESS };
  }

  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PROGRESS };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== CURRENT_PROGRESS_VERSION) {
      return { ...DEFAULT_PROGRESS };
    }

    return {
      version: CURRENT_PROGRESS_VERSION,
      completedMissionIds: Array.isArray(parsed.completedMissionIds) ? parsed.completedMissionIds : [],
      hintsUsedByMission: typeof parsed.hintsUsedByMission === 'object' && parsed.hintsUsedByMission !== null ? parsed.hintsUsedByMission : {},
      earnedXpEvents: Array.isArray(parsed.earnedXpEvents) ? parsed.earnedXpEvents : [],
      totalXp: typeof parsed.totalXp === 'number' && !Number.isNaN(parsed.totalXp) ? parsed.totalXp : 0,
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds) ? parsed.unlockedAchievementIds : [],
      lastActive: typeof parsed.lastActive === 'number' ? parsed.lastActive : Date.now(),
    };
  } catch (e) {
    console.warn('Failed to parse RegexLab progress from storage, resetting to default:', e);
    return { ...DEFAULT_PROGRESS };
  }
}

/**
 * Safely saves user progress to localStorage.
 */
export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    const dataToSave: UserProgress = {
      ...progress,
      lastActive: Date.now(),
    };
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('Failed to save RegexLab progress to localStorage:', e);
  }
}

/**
 * Awards mission completion XP and evaluates newly unlocked achievements idempotently.
 */
export function awardMissionCompletion(
  current: UserProgress,
  missionId: string,
  xpReward: number,
  hintsUsedCount: number
): { progress: UserProgress; xpAwarded: number; newlyUnlockedAchievements: string[] } {
  const isAlreadyCompleted = current.completedMissionIds.includes(missionId);
  const eventKey = `mission-${missionId}`;
  const isXpAlreadyAwarded = current.earnedXpEvents.includes(eventKey);

  const newlyUnlockedAchievements: string[] = [];

  const updatedCompletedMissions = isAlreadyCompleted
    ? current.completedMissionIds
    : [...current.completedMissionIds, missionId];

  const updatedHintsUsed = {
    ...current.hintsUsedByMission,
    [missionId]: hintsUsedCount,
  };

  const xpAwarded = isXpAlreadyAwarded ? 0 : xpReward;
  const newTotalXp = current.totalXp + xpAwarded;

  const updatedEarnedEvents = isXpAlreadyAwarded
    ? current.earnedXpEvents
    : [...current.earnedXpEvents, eventKey];

  const unlocked = new Set<string>(current.unlockedAchievementIds);

  // Check achievements
  if (updatedCompletedMissions.length >= 1 && !unlocked.has('arcade-rookie')) {
    unlocked.add('arcade-rookie');
    newlyUnlockedAchievements.push('arcade-rookie');
  }

  const allMissionIds = MISSIONS.map((m) => m.id);
  const hasFinishedAll = allMissionIds.every((id) => updatedCompletedMissions.includes(id));
  if (hasFinishedAll && !unlocked.has('arcade-finisher')) {
    unlocked.add('arcade-finisher');
    newlyUnlockedAchievements.push('arcade-finisher');
  }

  if (hintsUsedCount < 3 && !unlocked.has('detective-companion')) {
    unlocked.add('detective-companion');
    newlyUnlockedAchievements.push('detective-companion');
  }

  if (newTotalXp >= 500 && !unlocked.has('regex-master')) {
    unlocked.add('regex-master');
    newlyUnlockedAchievements.push('regex-master');
  }

  const updatedProgress: UserProgress = {
    ...current,
    completedMissionIds: updatedCompletedMissions,
    hintsUsedByMission: updatedHintsUsed,
    earnedXpEvents: updatedEarnedEvents,
    totalXp: newTotalXp,
    unlockedAchievementIds: Array.from(unlocked),
    lastActive: Date.now(),
  };

  saveProgress(updatedProgress);

  return {
    progress: updatedProgress,
    xpAwarded,
    newlyUnlockedAchievements,
  };
}

/**
 * Idempotently unlocks an achievement.
 */
export function unlockAchievement(
  current: UserProgress,
  achievementId: string
): { progress: UserProgress; newlyUnlocked: boolean } {
  if (current.unlockedAchievementIds.includes(achievementId)) {
    return { progress: current, newlyUnlocked: false };
  }

  const updated: UserProgress = {
    ...current,
    unlockedAchievementIds: [...current.unlockedAchievementIds, achievementId],
    lastActive: Date.now(),
  };

  saveProgress(updated);
  return { progress: updated, newlyUnlocked: true };
}

/**
 * Clears saved learning progress.
 */
export function resetProgress(): UserProgress {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_PROGRESS };
}
