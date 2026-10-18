export type RegexFlagKey = 'g' | 'i' | 'm' | 's' | 'u';

export interface RegexFlags {
  g: boolean;
  i: boolean;
  m: boolean;
  s: boolean;
  u: boolean;
}

export interface MatchGroup {
  index: number;
  name?: string;
  value: string;
  start: number;
  end: number;
}

export interface MatchContext {
  prefix: string;
  match: string;
  suffix: string;
}

export interface RegexMatch {
  index: number;
  value: string;
  start: number;
  end: number;
  groups: MatchGroup[];
  namedGroups?: Record<string, string>;
  inputContext: MatchContext;
}

export interface RegexRunRequest {
  id: string;
  pattern: string;
  flags: string;
  text: string;
  maxMatches?: number;
  timeoutMs?: number;
}

export type RegexRunStatus = 'idle' | 'running' | 'success' | 'no-match' | 'error' | 'timeout';

export interface RegexRunResult {
  id: string;
  status: RegexRunStatus;
  matches: RegexMatch[];
  totalMatches: number;
  executionTimeMs: number;
  error?: string;
  truncated?: boolean;
}

export interface ReplaceRunRequest {
  id: string;
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  timeoutMs?: number;
}

export type ReplaceRunStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout';

export interface ReplaceRunResult {
  id: string;
  status: ReplaceRunStatus;
  resultText: string;
  replacementCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface Preset {
  id: string;
  name: string;
  category: string;
  description: string;
  pattern: string;
  flags: string;
  text: string;
  explanation: string;
  disclaimer?: string;
}

export type MascotMood = 'idle' | 'scanning' | 'thinking' | 'happy' | 'confused' | 'champion';

export interface MissionTestCase {
  input: string;
  shouldMatch: boolean;
  expectedMatches?: string[];
  description?: string;
}

export interface Mission {
  id: string;
  title: string;
  difficulty: 'Novice' | 'Intermediate' | 'Advanced';
  order: number;
  xpReward: number;
  objective: string;
  sampleText: string;
  startingPattern: string;
  startingFlags: string;
  testCases: MissionTestCase[];
  hints: [string, string, string];
  solutionExample: {
    pattern: string;
    flags: string;
    explanation: string;
  };
  concepts: string[];
}

export interface UserProgress {
  version: number;
  completedMissionIds: string[];
  hintsUsedByMission: Record<string, number>;
  earnedXpEvents: string[];
  totalXp: number;
  unlockedAchievementIds: string[];
  lastActive: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
}
