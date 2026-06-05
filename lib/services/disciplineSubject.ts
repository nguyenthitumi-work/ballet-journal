import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import type { Discipline } from '@/lib/types';

// Maps a discipline onto its "subject" — the thing a practice attempt is about.
// Ballet attempts reference a skill, yoga a pose (asana), gym an exercise. The
// shared practice_session / skill_attempt tables already carry all three via the
// nullable skill_id / asana_id / exercise_id columns; this config lets one code
// path serve every discipline instead of forking ballet-only services.

export type SubjectIdColumn = 'skill_id' | 'asana_id' | 'exercise_id';

export interface SubjectConfig {
  discipline: Discipline;
  // Which nullable column on skill_attempt identifies this discipline's subject.
  idColumn: SubjectIdColumn;
  // Catalog table holding the subjects (id, name, progress_status).
  table: 'skill' | 'asana' | 'exercise';
  unit: string; // singular, e.g. "skill" | "pose" | "exercise"
  unitPlural: string;
  // Only ballet's skill table records progress_status_changed_at, so only it can
  // answer "what did you master *this week*". Yoga/gym omit that summary line.
  hasMasteryTimestamp: boolean;
}

export const SUBJECT_CONFIG: Record<Discipline, SubjectConfig> = {
  ballet: {
    discipline: 'ballet',
    idColumn: 'skill_id',
    table: 'skill',
    unit: 'skill',
    unitPlural: 'skills',
    hasMasteryTimestamp: true,
  },
  yoga: {
    discipline: 'yoga',
    idColumn: 'asana_id',
    table: 'asana',
    unit: 'pose',
    unitPlural: 'poses',
    hasMasteryTimestamp: false,
  },
  gym: {
    discipline: 'gym',
    idColumn: 'exercise_id',
    table: 'exercise',
    unit: 'exercise',
    unitPlural: 'exercises',
    hasMasteryTimestamp: false,
  },
};

export interface CatalogItem {
  id: string;
  name: string;
  progressStatus: string;
}

// Minimal catalog read for the subject of a discipline: id, name and mastery
// state. Used to build name lookups and count mastered subjects. Reads
// progress_status directly because the yoga/gym domain mappers drop it.
export async function listSubjectCatalog(
  userId: string,
  discipline: Discipline,
): Promise<CatalogItem[]> {
  const cfg = SUBJECT_CONFIG[discipline];
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from(cfg.table)
    .select('id, name, progress_status')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data as { id: string; name: string; progress_status: string }[]).map((r) => ({
    id: r.id,
    name: r.name,
    progressStatus: r.progress_status,
  }));
}
