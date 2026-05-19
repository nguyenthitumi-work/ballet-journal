import type { CategoryId, Level, Skill } from '@/lib/types';

export type BadgeId =
  | 'first-step'
  | 'getting-the-hang'
  | 'class-star'
  | 'all-the-skills'
  | 'beginner-barre-done'
  | 'beginner-stretches-done'
  | 'beginner-conditioning-done'
  | 'first-spin'
  | 'flying'
  | 'week-warrior'
  | 'month-devotee'
  | 'milestone-memory';

export interface Badge {
  id: BadgeId;
  emoji: string;
  name: string;
  description: string;
}

export interface BadgeStatus {
  badge: Badge;
  earned: boolean;
  // Optional fractional progress for unearned countable badges. Earned ones omit it.
  progress?: { current: number; target: number };
}

// Display order is the order returned. Earned badges aren't reordered — kids
// can see what's coming next in context.
const BADGES: readonly Badge[] = [
  {
    id: 'first-step',
    emoji: '🌱',
    name: 'First Step',
    description: 'Master your first skill.',
  },
  {
    id: 'getting-the-hang',
    emoji: '🪻',
    name: 'Getting the Hang',
    description: 'Master five skills.',
  },
  {
    id: 'class-star',
    emoji: '⭐',
    name: 'Class Star',
    description: 'Master ten skills.',
  },
  {
    id: 'all-the-skills',
    emoji: '👑',
    name: 'All the Skills',
    description: 'Master every skill in the catalog.',
  },
  {
    id: 'beginner-barre-done',
    emoji: '🩰',
    name: 'Beginner Barre Done',
    description: 'Master every Beginner Barre skill.',
  },
  {
    id: 'beginner-stretches-done',
    emoji: '🤸',
    name: 'Beginner Stretches Done',
    description: 'Master every Beginner Stretch.',
  },
  {
    id: 'beginner-conditioning-done',
    emoji: '💪',
    name: 'Beginner Conditioning Done',
    description: 'Master every Beginner Conditioning skill.',
  },
  {
    id: 'first-spin',
    emoji: '🌀',
    name: 'First Spin',
    description: 'Master Pirouette en Dehors.',
  },
  {
    id: 'flying',
    emoji: '🦋',
    name: 'Flying',
    description: 'Master Grand Jeté.',
  },
  {
    id: 'week-warrior',
    emoji: '🔥',
    name: 'Week Warrior',
    description: 'Reach a 7-day practice streak.',
  },
  {
    id: 'month-devotee',
    emoji: '🌟',
    name: 'Month Devotee',
    description: 'Reach a 30-day practice streak.',
  },
  {
    id: 'milestone-memory',
    emoji: '📸',
    name: 'Milestone Memory',
    description: 'Mark your first practice attempt as a milestone.',
  },
];

const COUNT_TARGETS: Record<'first-step' | 'getting-the-hang' | 'class-star', number> = {
  'first-step': 1,
  'getting-the-hang': 5,
  'class-star': 10,
};

const STREAK_TARGETS: Record<'week-warrior' | 'month-devotee', number> = {
  'week-warrior': 7,
  'month-devotee': 30,
};

function masteredCountInBucket(
  skills: Skill[],
  categoryId: CategoryId,
  level: Level,
): { mastered: number; total: number } {
  const bucket = skills.filter((s) => s.categoryId === categoryId && s.level === level);
  const mastered = bucket.filter((s) => s.progressStatus === 'mastered').length;
  return { mastered, total: bucket.length };
}

function masteredByName(skills: Skill[], name: string): boolean {
  return skills.some((s) => s.name === name && s.progressStatus === 'mastered');
}

export function computeBadges(args: {
  skills: Skill[];
  streak: number;
  hasMilestone: boolean;
}): BadgeStatus[] {
  const { skills, streak, hasMilestone } = args;
  const masteredCount = skills.filter((s) => s.progressStatus === 'mastered').length;
  const totalCount = skills.length;

  return BADGES.map((badge): BadgeStatus => {
    switch (badge.id) {
      case 'first-step':
      case 'getting-the-hang':
      case 'class-star': {
        const target = COUNT_TARGETS[badge.id];
        return {
          badge,
          earned: masteredCount >= target,
          progress: { current: Math.min(masteredCount, target), target },
        };
      }
      case 'all-the-skills':
        return {
          badge,
          earned: totalCount > 0 && masteredCount === totalCount,
          progress: { current: masteredCount, target: totalCount },
        };
      case 'beginner-barre-done': {
        const { mastered, total } = masteredCountInBucket(skills, 'barre', 'Beginner');
        return {
          badge,
          earned: total > 0 && mastered === total,
          progress: { current: mastered, target: total },
        };
      }
      case 'beginner-stretches-done': {
        const { mastered, total } = masteredCountInBucket(skills, 'stretches', 'Beginner');
        return {
          badge,
          earned: total > 0 && mastered === total,
          progress: { current: mastered, target: total },
        };
      }
      case 'beginner-conditioning-done': {
        const { mastered, total } = masteredCountInBucket(
          skills,
          'conditioning',
          'Beginner',
        );
        return {
          badge,
          earned: total > 0 && mastered === total,
          progress: { current: mastered, target: total },
        };
      }
      case 'first-spin':
        return { badge, earned: masteredByName(skills, 'Pirouette en Dehors') };
      case 'flying':
        return { badge, earned: masteredByName(skills, 'Grand Jeté') };
      case 'week-warrior':
      case 'month-devotee': {
        const target = STREAK_TARGETS[badge.id];
        return {
          badge,
          earned: streak >= target,
          progress: { current: Math.min(streak, target), target },
        };
      }
      case 'milestone-memory':
        return { badge, earned: hasMilestone };
    }
  });
}
