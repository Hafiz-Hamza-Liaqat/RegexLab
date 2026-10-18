import type { Achievement } from '../types/regex.ts';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-match',
    title: 'First Match',
    description: 'Successfully run your first regular expression that matches text.',
    icon: 'Search',
    badge: '🔎',
  },
  {
    id: 'capture-expert',
    title: 'Capture Expert',
    description: 'Inspect numbered or named capture groups in a matched expression.',
    icon: 'Layers',
    badge: '📦',
  },
  {
    id: 'replace-wizard',
    title: 'Replacement Wizard',
    description: 'Perform a successful text replacement using group substitutions ($1 or $&).',
    icon: 'Sparkles',
    badge: '🪄',
  },
  {
    id: 'arcade-rookie',
    title: 'Arcade Rookie',
    description: 'Solve your first mission in the Regex Arcade.',
    icon: 'Award',
    badge: '🎯',
  },
  {
    id: 'arcade-finisher',
    title: 'Arcade Finisher',
    description: 'Complete all missions in the Regex Arcade.',
    icon: 'Trophy',
    badge: '🏆',
  },
  {
    id: 'regex-master',
    title: 'Regex Master',
    description: 'Earn 500 or more total XP across the platform.',
    icon: 'Crown',
    badge: '👑',
  },
  {
    id: 'detective-companion',
    title: 'Detective Companion',
    description: 'Solve a mission without revealing the full solution hint.',
    icon: 'ShieldCheck',
    badge: '🕵️',
  },
];
