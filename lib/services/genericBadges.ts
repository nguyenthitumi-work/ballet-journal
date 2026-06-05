// Discipline-agnostic badges. Ballet has its own rich, skill-name-specific set
// (lib/services/badges.ts); yoga and gym share this generic set computed only
// from primitives every discipline records: streak, completed sessions,
// distinct subjects practiced, mastered subjects, and milestones. No discipline
// content is hard-coded — descriptions read naturally via the unit labels.

export interface GenericBadge {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

export interface GenericBadgeStatus {
  badge: GenericBadge;
  earned: boolean;
  progress?: { current: number; target: number };
}

export interface GenericBadgeInput {
  streak: number;
  completedSessions: number;
  distinctSubjectsPracticed: number;
  masteredCount: number;
  totalSubjects: number;
  hasMilestone: boolean;
  unit: string;
  unitPlural: string;
}

const SESSION_TARGETS = { committed: 10, regular: 25 } as const;
const EXPLORE_TARGETS = { explorer: 5, 'well-rounded': 15 } as const;
const STREAK_TARGETS = { 'week-warrior': 7, 'month-devotee': 30 } as const;

export function computeGenericBadges(input: GenericBadgeInput): GenericBadgeStatus[] {
  const {
    streak,
    completedSessions,
    distinctSubjectsPracticed,
    masteredCount,
    totalSubjects,
    hasMilestone,
    unit,
    unitPlural,
  } = input;

  const countable = (
    badge: GenericBadge,
    current: number,
    target: number,
  ): GenericBadgeStatus => ({
    badge,
    earned: current >= target,
    progress: { current: Math.min(current, target), target },
  });

  return [
    countable(
      { id: 'first-session', emoji: '✅', name: 'First Session', description: 'Finish your first session.' },
      completedSessions,
      1,
    ),
    countable(
      { id: 'committed', emoji: '📅', name: 'Committed', description: 'Finish ten sessions.' },
      completedSessions,
      SESSION_TARGETS.committed,
    ),
    countable(
      { id: 'regular', emoji: '🏅', name: 'Regular', description: 'Finish twenty-five sessions.' },
      completedSessions,
      SESSION_TARGETS.regular,
    ),
    countable(
      {
        id: 'explorer',
        emoji: '🧭',
        name: 'Explorer',
        description: `Practice five different ${unitPlural}.`,
      },
      distinctSubjectsPracticed,
      EXPLORE_TARGETS.explorer,
    ),
    countable(
      {
        id: 'well-rounded',
        emoji: '🌈',
        name: 'Well-Rounded',
        description: `Practice fifteen different ${unitPlural}.`,
      },
      distinctSubjectsPracticed,
      EXPLORE_TARGETS['well-rounded'],
    ),
    countable(
      {
        id: 'first-mastery',
        emoji: '🌱',
        name: 'First Mastery',
        description: `Master your first ${unit}.`,
      },
      masteredCount,
      1,
    ),
    {
      badge: {
        id: 'all-mastered',
        emoji: '👑',
        name: 'All Mastered',
        description: `Master every ${unit} in your library.`,
      },
      earned: totalSubjects > 0 && masteredCount === totalSubjects,
      progress: { current: masteredCount, target: totalSubjects },
    },
    countable(
      { id: 'week-warrior', emoji: '🔥', name: 'Week Warrior', description: 'Reach a 7-day streak.' },
      streak,
      STREAK_TARGETS['week-warrior'],
    ),
    countable(
      { id: 'month-devotee', emoji: '🌟', name: 'Month Devotee', description: 'Reach a 30-day streak.' },
      streak,
      STREAK_TARGETS['month-devotee'],
    ),
    {
      badge: {
        id: 'milestone-memory',
        emoji: '📸',
        name: 'Milestone Memory',
        description: 'Mark your first milestone.',
      },
      earned: hasMilestone,
    },
  ];
}
