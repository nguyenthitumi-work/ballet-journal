import type { CategoryId, Level, ProgressStatus } from '@/lib/types';

type SkillInput = {
  id: string;
  name: string;
  categoryId: CategoryId;
  level: Level;
  progressStatus: ProgressStatus;
  isCurrentlyWorkingOn: boolean;
  lastAttemptedAt: Date | null;
};

export type SuggestionReason = 'focus' | 'stale' | 'rediscovery' | 'default';
export type SuggestionPick = { skillId: string; reason: SuggestionReason };

const STALE_DAYS = 7;
const REDISCOVERY_DAYS = 30;
const DAY_MS = 86_400_000;
const MIN_FOCUS_SKILLS = 3;
const DEFAULT_CAT_CAP = 2;
const RELAXED_CAT_CAP = 3;

const LEVEL_ORDER: Record<Level, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

function daysSince(date: Date | null, now: Date): number {
  if (date === null) return Infinity;
  return (now.getTime() - date.getTime()) / DAY_MS;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A skill is "in scope" for the user's curriculum level when it is at-level,
// or above-level (stretch goals), or below-level but not yet mastered (filling
// in gaps). Mastered skills below the user's level drop out of the pool — the
// whole point of level progression is to stop serving those once you've moved on.
function filterToLevelPool(skills: SkillInput[], userLevel: Level): SkillInput[] {
  const userRank = LEVEL_ORDER[userLevel];
  return skills.filter((s) => {
    const rank = LEVEL_ORDER[s.level];
    if (rank === userRank) return true;
    if (rank > userRank) return true;
    return s.progressStatus !== 'mastered';
  });
}

function takeWithCategoryCap(
  pool: SkillInput[],
  count: number,
  reason: SuggestionReason,
  categoryCounts: Map<CategoryId, number>,
  taken: Set<string>,
  cap: number,
): SuggestionPick[] {
  const out: SuggestionPick[] = [];
  for (const s of pool) {
    if (out.length >= count) break;
    if (taken.has(s.id)) continue;
    const used = categoryCounts.get(s.categoryId) ?? 0;
    if (used >= cap) continue;
    out.push({ skillId: s.id, reason });
    taken.add(s.id);
    categoryCounts.set(s.categoryId, used + 1);
  }
  return out;
}

function ensureCategoryPresent(
  categoryId: CategoryId,
  picks: SuggestionPick[],
  skills: SkillInput[],
  taken: Set<string>,
  rng: () => number,
): SuggestionPick[] {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const hasIt = picks.some((p) => byId.get(p.skillId)?.categoryId === categoryId);
  if (hasIt) return picks;

  const candidates = shuffle(
    skills.filter((s) => s.categoryId === categoryId && !taken.has(s.id)),
    rng,
  );
  if (candidates.length === 0) return picks;

  const reverseIdx = [...picks].reverse().findIndex((p) => p.reason !== 'focus');
  const insertion: SuggestionPick = { skillId: candidates[0].id, reason: 'default' };

  if (reverseIdx === -1) {
    picks.push(insertion);
    taken.add(insertion.skillId);
    return picks;
  }
  const realIdx = picks.length - 1 - reverseIdx;
  taken.delete(picks[realIdx].skillId);
  picks[realIdx] = insertion;
  taken.add(insertion.skillId);
  return picks;
}

export function pickDailySuggestion(args: {
  skills: SkillInput[];
  userLevel: Level;
  now: Date;
  targetCount?: number;
  rng?: () => number;
}): SuggestionPick[] {
  const { skills, userLevel, now, targetCount = 6, rng = Math.random } = args;
  if (skills.length === 0) return [];

  const pool = filterToLevelPool(skills, userLevel);
  if (pool.length === 0) return [];

  const focus = pool.filter((s) => s.isCurrentlyWorkingOn);
  const stale = pool.filter((s) => daysSince(s.lastAttemptedAt, now) >= STALE_DAYS);
  const rediscovery = pool.filter(
    (s) => daysSince(s.lastAttemptedAt, now) >= REDISCOVERY_DAYS,
  );

  const focusTarget = Math.round(targetCount * 0.6);
  const staleTarget = Math.round(targetCount * 0.3);
  const rediscoveryTarget = Math.max(1, targetCount - focusTarget - staleTarget);

  const taken = new Set<string>();
  const catCounts = new Map<CategoryId, number>();
  const cap = pool.length < targetCount * 2 ? RELAXED_CAT_CAP : DEFAULT_CAT_CAP;

  const picks: SuggestionPick[] = [];

  if (focus.length < MIN_FOCUS_SKILLS) {
    picks.push(
      ...takeWithCategoryCap(shuffle(focus, rng), focus.length, 'focus', catCounts, taken, cap),
    );
    picks.push(
      ...takeWithCategoryCap(
        shuffle(stale, rng),
        targetCount - picks.length,
        'stale',
        catCounts,
        taken,
        cap,
      ),
    );
    picks.push(
      ...takeWithCategoryCap(
        shuffle(pool, rng),
        targetCount - picks.length,
        'default',
        catCounts,
        taken,
        cap,
      ),
    );
  } else {
    picks.push(
      ...takeWithCategoryCap(shuffle(focus, rng), focusTarget, 'focus', catCounts, taken, cap),
    );
    picks.push(
      ...takeWithCategoryCap(shuffle(stale, rng), staleTarget, 'stale', catCounts, taken, cap),
    );
    picks.push(
      ...takeWithCategoryCap(
        shuffle(rediscovery, rng),
        rediscoveryTarget,
        'rediscovery',
        catCounts,
        taken,
        cap,
      ),
    );
    if (picks.length < targetCount) {
      picks.push(
        ...takeWithCategoryCap(
          shuffle(pool, rng),
          targetCount - picks.length,
          'default',
          catCounts,
          taken,
          cap,
        ),
      );
    }
  }

  ensureCategoryPresent('stretches', picks, pool, taken, rng);
  ensureCategoryPresent('barre', picks, pool, taken, rng);

  return picks.slice(0, targetCount);
}
