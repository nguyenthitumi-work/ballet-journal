import type { CategoryId, Level, ProgressStatus } from '@/lib/types';
import { formatLocalDate } from '@/lib/services/streak';

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

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DayTemplate = {
  theme: string;
  emphasis: CategoryId[];
  targetCount?: number;
};

// Classic ballet week. Emphasis categories are a *soft* bias applied on top of
// the focus/stale/rediscovery logic — they reorder within each bucket but don't
// exclude other categories. Friday and Saturday intentionally leave emphasis
// empty so the bucket logic alone decides (focus-heavy on Fri, full mix on Sat).
export const WEEKLY_TEMPLATE: Record<DayOfWeek, DayTemplate> = {
  0: { theme: 'Stretches', emphasis: ['stretches'], targetCount: 4 },
  1: { theme: 'Barre', emphasis: ['barre'] },
  2: { theme: 'Center', emphasis: ['center'] },
  3: { theme: 'Jumps + Turns', emphasis: ['jumps', 'turns'] },
  4: { theme: 'Stretches + Conditioning', emphasis: ['stretches', 'conditioning'] },
  5: { theme: 'Focus skills', emphasis: [] },
  6: { theme: 'Full mix', emphasis: [] },
};

export function localDayOfWeek(now: Date, tz: string): DayOfWeek {
  const ymd = formatLocalDate(now, tz);
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as DayOfWeek;
}

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

// Stable reorder that pulls emphasis-category items to the front while keeping
// the relative order of everything else (so the shuffle upstream still drives
// randomness within each group).
function sortByEmphasis(items: SkillInput[], emphasis: CategoryId[]): SkillInput[] {
  if (emphasis.length === 0) return items;
  const set = new Set(emphasis);
  const front: SkillInput[] = [];
  const back: SkillInput[] = [];
  for (const s of items) {
    if (set.has(s.categoryId)) front.push(s);
    else back.push(s);
  }
  return front.concat(back);
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
  dayOfWeek?: DayOfWeek;
  targetCount?: number;
  rng?: () => number;
}): SuggestionPick[] {
  const { skills, userLevel, now, dayOfWeek, rng = Math.random } = args;
  if (skills.length === 0) return [];

  const pool = filterToLevelPool(skills, userLevel);
  if (pool.length === 0) return [];

  const template = dayOfWeek !== undefined ? WEEKLY_TEMPLATE[dayOfWeek] : null;
  const emphasis = template?.emphasis ?? [];
  const targetCount = args.targetCount ?? template?.targetCount ?? 6;

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

  const prep = (items: SkillInput[]) => sortByEmphasis(shuffle(items, rng), emphasis);

  const picks: SuggestionPick[] = [];

  if (focus.length < MIN_FOCUS_SKILLS) {
    picks.push(
      ...takeWithCategoryCap(prep(focus), focus.length, 'focus', catCounts, taken, cap),
    );
    picks.push(
      ...takeWithCategoryCap(
        prep(stale),
        targetCount - picks.length,
        'stale',
        catCounts,
        taken,
        cap,
      ),
    );
    picks.push(
      ...takeWithCategoryCap(
        prep(pool),
        targetCount - picks.length,
        'default',
        catCounts,
        taken,
        cap,
      ),
    );
  } else {
    picks.push(
      ...takeWithCategoryCap(prep(focus), focusTarget, 'focus', catCounts, taken, cap),
    );
    picks.push(
      ...takeWithCategoryCap(prep(stale), staleTarget, 'stale', catCounts, taken, cap),
    );
    picks.push(
      ...takeWithCategoryCap(
        prep(rediscovery),
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
          prep(pool),
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
