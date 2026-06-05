import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { SUBJECT_CONFIG, listSubjectCatalog } from '@/lib/services/disciplineSubject';
import type { Discipline, WeeklySummary } from '@/lib/types';

const WEEK_MS = 7 * 86_400_000;
const MIN_ATTEMPTS_FOR_IMPROVED = 2;

interface SessionWindowRow {
  started_at: string;
  duration_seconds: number | null;
}

interface AttemptWindowRow {
  attempted_at: string;
  rating: number;
  duration_seconds: number;
  is_milestone: boolean;
  [key: string]: string | number | boolean | null;
}

interface MasteredRow {
  id: string;
  progress_status_changed_at: string;
}

// Weekly recap for a single discipline. Ballet (the default) keeps its original
// behavior: skill-backed attempts and "mastered this week" from the skill
// table's progress_status_changed_at. Yoga/gym key off asana_id/exercise_id and
// omit "mastered this week" (those catalogs have no mastery timestamp).
export async function getWeeklySummary(
  userId: string,
  now: Date,
  discipline: Discipline = 'ballet',
): Promise<WeeklySummary> {
  const cfg = SUBJECT_CONFIG[discipline];
  const idColumn = cfg.idColumn;
  const endIso = now.toISOString();
  const startIso = new Date(now.getTime() - WEEK_MS).toISOString();
  const priorStartIso = new Date(now.getTime() - 2 * WEEK_MS).toISOString();

  const supabase = await getServerSupabase();

  // Mastered-this-week only exists for ballet (skill.progress_status_changed_at).
  const masteredQuery = cfg.hasMasteryTimestamp
    ? supabase
        .from('skill')
        .select('id, progress_status_changed_at')
        .eq('user_id', userId)
        .eq('progress_status', 'mastered')
        .gte('progress_status_changed_at', startIso)
        .lt('progress_status_changed_at', endIso)
    : Promise.resolve({ data: [], error: null });

  // Pull both weeks in one query each; bucket in app.
  const [sessionsRes, attemptsRes, masteredRes, catalog] = await Promise.all([
    supabase
      .from('practice_session')
      .select('started_at, duration_seconds')
      .eq('user_id', userId)
      .eq('discipline', discipline)
      .not('ended_at', 'is', null)
      .gte('started_at', priorStartIso)
      .lt('started_at', endIso),
    supabase
      .from('skill_attempt')
      .select(`${idColumn}, attempted_at, rating, duration_seconds, is_milestone`)
      .eq('user_id', userId)
      .not(idColumn, 'is', null)
      .gte('attempted_at', priorStartIso)
      .lt('attempted_at', endIso),
    masteredQuery,
    listSubjectCatalog(userId, discipline),
  ]);

  if (sessionsRes.error) throw new Error(sessionsRes.error.message);
  if (attemptsRes.error) throw new Error(attemptsRes.error.message);
  if (masteredRes.error) throw new Error(masteredRes.error.message);

  const sessions = (sessionsRes.data ?? []) as SessionWindowRow[];
  const attempts = (attemptsRes.data ?? []) as AttemptWindowRow[];
  const mastered = (masteredRes.data ?? []) as MasteredRow[];
  const skillNameById = new Map(catalog.map((s) => [s.id, s.name]));

  // Sessions: split current vs prior.
  let practiceTimeSec = 0;
  let practiceTimeSecPrior = 0;
  let sessionsCount = 0;
  let sessionsCountPrior = 0;
  for (const s of sessions) {
    const dur = s.duration_seconds ?? 0;
    if (s.started_at >= startIso) {
      practiceTimeSec += dur;
      sessionsCount += 1;
    } else {
      practiceTimeSecPrior += dur;
      sessionsCountPrior += 1;
    }
  }

  // Attempts: aggregate per skill for current and prior.
  interface PerSkill {
    totalSec: number;
    ratingSum: number;
    count: number;
  }
  const current = new Map<string, PerSkill>();
  const prior = new Map<string, PerSkill>();
  let milestonesCount = 0;
  for (const a of attempts) {
    const subjectId = a[idColumn] as string | null;
    if (!subjectId) continue;
    const target = a.attempted_at >= startIso ? current : prior;
    const bucket = target.get(subjectId) ?? { totalSec: 0, ratingSum: 0, count: 0 };
    bucket.totalSec += a.duration_seconds;
    bucket.ratingSum += a.rating;
    bucket.count += 1;
    target.set(subjectId, bucket);
    if (a.attempted_at >= startIso && a.is_milestone) milestonesCount += 1;
  }

  const skillsPracticedCount = current.size;

  let mostPracticed: WeeklySummary['mostPracticed'] = null;
  for (const [skillId, b] of current) {
    if (!mostPracticed || b.totalSec > mostPracticed.totalSec) {
      mostPracticed = {
        skillId,
        skillName: skillNameById.get(skillId) ?? 'Unknown skill',
        totalSec: b.totalSec,
      };
    }
  }

  const improvedSkills: WeeklySummary['improvedSkills'] = [];
  for (const [skillId, c] of current) {
    if (c.count < MIN_ATTEMPTS_FOR_IMPROVED) continue;
    const p = prior.get(skillId);
    if (!p || p.count < MIN_ATTEMPTS_FOR_IMPROVED) continue;
    const currentAvg = c.ratingSum / c.count;
    const priorAvg = p.ratingSum / p.count;
    if (currentAvg > priorAvg) {
      improvedSkills.push({
        id: skillId,
        name: skillNameById.get(skillId) ?? 'Unknown skill',
        priorAvg,
        currentAvg,
        priorAttempts: p.count,
        currentAttempts: c.count,
      });
    }
  }
  improvedSkills.sort((a, b) => (b.currentAvg - b.priorAvg) - (a.currentAvg - a.priorAvg));

  const masteredSkills = mastered
    .map((r) => ({
      id: r.id,
      name: skillNameById.get(r.id) ?? 'Unknown skill',
      changedAt: r.progress_status_changed_at,
    }))
    .sort((a, b) => (a.changedAt < b.changedAt ? 1 : -1));

  const hasAnyActivity = sessionsCount > 0 || current.size > 0;
  const hasPriorBaseline = sessionsCountPrior > 0 || prior.size > 0;

  return {
    windowStartIso: startIso,
    windowEndIso: endIso,
    priorWindowStartIso: priorStartIso,
    practiceTimeSec,
    practiceTimeSecPrior,
    sessionsCount,
    sessionsCountPrior,
    skillsPracticedCount,
    mostPracticed,
    milestonesCount,
    masteredSkills,
    improvedSkills,
    hasAnyActivity,
    hasPriorBaseline,
  };
}

export function formatDurationCompact(sec: number): string {
  if (sec <= 0) return '0m';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDeltaPercent(current: number, prior: number): string | null {
  if (prior <= 0) return null;
  const delta = ((current - prior) / prior) * 100;
  const rounded = Math.round(delta);
  if (rounded === 0) return '±0%';
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}
