import type { LockState } from '@/lib/services/unlock';
import type { Level, Skill } from '@/lib/types';

export type NextSkillReason =
  | { kind: 'prereq-for-focus'; enablesSkillName: string }
  | { kind: 'continue' }
  | { kind: 'next-up' }
  | { kind: 'stretch' };

export type NextSkillPick = { skill: Skill; reason: NextSkillReason };

const LEVEL_ORDER: Record<Level, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

// Pure derivation. Returns the single highest-priority skill to surface as
// "do this next." Tiers, first match wins:
//   1. A missing prereq of a locked ♥-focus skill — the magic moment.
//   2. Continue something at-level the user is already practicing.
//   3. A new at-level skill — preferring never-attempted, then easiest.
//   4. Stretch one level up.
// Returns null when nothing fits (everything at-level mastered, nothing
// unlocked above) — the home page just hides the card.
export function pickNextSkill(args: {
  skills: Skill[];
  lockStates: Map<string, LockState>;
  userLevel: Level;
}): NextSkillPick | null {
  const { skills, lockStates, userLevel } = args;

  const isLocked = (s: Skill): boolean => lockStates.get(s.id)?.locked === true;
  const isReady = (s: Skill): boolean => !isLocked(s) && s.progressStatus !== 'mastered';
  const byName = (a: Skill, b: Skill): number => a.name.localeCompare(b.name);

  // Tier 1 — finishing a missing prereq unlocks something the user has hearted.
  const skillByName = new Map(skills.map((s) => [s.name, s]));
  const lockedFocus = skills
    .filter((s) => s.isCurrentlyWorkingOn && isLocked(s))
    .sort(byName);
  for (const focus of lockedFocus) {
    const lock = lockStates.get(focus.id);
    if (lock?.locked !== true) continue;
    for (const prereqName of lock.missingPrereqNames) {
      const prereq = skillByName.get(prereqName);
      if (prereq && isReady(prereq)) {
        return {
          skill: prereq,
          reason: { kind: 'prereq-for-focus', enablesSkillName: focus.name },
        };
      }
    }
  }

  // Tier 2 — already in flow on something at-level.
  const practicing = skills
    .filter(
      (s) => isReady(s) && s.level === userLevel && s.progressStatus === 'practicing',
    )
    .sort((a, b) => {
      const aT = a.lastAttemptedAt ? new Date(a.lastAttemptedAt).getTime() : 0;
      const bT = b.lastAttemptedAt ? new Date(b.lastAttemptedAt).getTime() : 0;
      if (aT !== bT) return bT - aT;
      return byName(a, b);
    });
  if (practicing[0]) return { skill: practicing[0], reason: { kind: 'continue' } };

  // Tier 3 — at-level, not mastered. Prefer fresh, then easiest.
  const atLevel = skills
    .filter((s) => isReady(s) && s.level === userLevel)
    .sort((a, b) => {
      const aFresh = a.lastAttemptedAt === null ? 0 : 1;
      const bFresh = b.lastAttemptedAt === null ? 0 : 1;
      if (aFresh !== bFresh) return aFresh - bFresh;
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
      return byName(a, b);
    });
  if (atLevel[0]) return { skill: atLevel[0], reason: { kind: 'next-up' } };

  // Tier 4 — one level up. Easiest stretch goal.
  const userRank = LEVEL_ORDER[userLevel];
  const stretch = skills
    .filter((s) => isReady(s) && LEVEL_ORDER[s.level] === userRank + 1)
    .sort((a, b) => {
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
      return byName(a, b);
    });
  if (stretch[0]) return { skill: stretch[0], reason: { kind: 'stretch' } };

  return null;
}
