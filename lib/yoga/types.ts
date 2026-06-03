// Yoga discipline types.
//
// Deliberately mirrors lib/types.ts (the ballet model) so the shared practice
// engine — sessions, attempts, history, streaks, pose overlay — can be reused
// with minimal divergence. Where ballet has "Skill", yoga has "Asana"; where
// ballet has "PracticePlan", yoga has "YogaFlow" (a *timed*, ordered sequence).
//
// Level and Difficulty are reused from the ballet model on purpose: a single
// shared scale keeps the cross-discipline UI (badges, filters) identical.
import type { Difficulty, Level } from '@/lib/types';

export type YogaStyle =
  | 'vinyasa'
  | 'hatha'
  | 'yin'
  | 'restorative'
  | 'power'
  | 'wakeup';

export const YOGA_STYLE_LABELS: Record<YogaStyle, string> = {
  vinyasa: 'Vinyasa',
  hatha: 'Hatha',
  yin: 'Yin',
  restorative: 'Restorative',
  power: 'Power',
  wakeup: 'Wake-Up',
};

export type AsanaCategory =
  | 'standing'
  | 'seated'
  | 'balance'
  | 'backbend'
  | 'forward-fold'
  | 'twist'
  | 'inversion'
  | 'restorative';

export const ASANA_CATEGORY_LABELS: Record<AsanaCategory, string> = {
  standing: 'Standing',
  seated: 'Seated',
  balance: 'Balance',
  backbend: 'Backbend',
  'forward-fold': 'Forward Fold',
  twist: 'Twist',
  inversion: 'Inversion',
  restorative: 'Restorative',
};

export type FlowSide = 'left' | 'right' | 'center';

/** A single yoga pose (asana). The yoga analog of a ballet Skill. */
export interface Asana {
  id: string;
  name: string; // English name, e.g. "Downward-Facing Dog"
  sanskritName: string; // e.g. "Adho Mukha Svanasana"
  category: AsanaCategory;
  description: string;
  benefits: string[];
  cues: string[]; // alignment cues — analog of Skill.techniqueTips
  focus: string[]; // body areas / qualities trained — analog of Skill.trains
  difficulty: Difficulty;
  level: Level;
  defaultHoldSeconds: number;
  contraindications: string[]; // safety notes — new to yoga, important for trust
  referenceUrl: string | null;
}

/** One step inside a flow: hold this asana, on this side, for this long. */
export interface FlowPose {
  asanaId: string;
  holdSeconds: number;
  side: FlowSide;
  breathCue: string | null; // e.g. "Inhale to lengthen, exhale to fold"
}

/** An ordered, timed sequence of poses. The yoga analog of a PracticePlan. */
export interface YogaFlow {
  id: string;
  name: string;
  description: string;
  style: YogaStyle;
  level: Level;
  isBuiltIn: boolean;
  poses: FlowPose[];
}

// --- DB row shapes + mappers (mirror the snake_case pattern in lib/types.ts) ---

export interface AsanaRow {
  id: string;
  user_id: string;
  category: AsanaCategory;
  name: string;
  sanskrit_name: string | null;
  description: string | null;
  benefits: string[];
  cues: string[];
  focus: string[];
  contraindications: string[];
  difficulty: number;
  level: Level;
  default_hold_seconds: number;
  is_currently_working_on: boolean;
  progress_status: string;
  reference_url: string | null;
  date_added: string;
  last_attempted_at: string | null;
}

export interface YogaFlowRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  style: YogaStyle;
  level: Level;
  is_built_in: boolean;
  poses: unknown; // jsonb — validated/coerced in flowFromRow
  created_at: string;
}

function coercePoses(value: unknown): FlowPose[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map((v) => ({
      asanaId: String(v.asanaId ?? ''),
      holdSeconds: Number(v.holdSeconds ?? 0),
      side: (v.side === 'left' || v.side === 'right' ? v.side : 'center') as FlowSide,
      breathCue: typeof v.breathCue === 'string' ? v.breathCue : null,
    }))
    .filter((p) => p.asanaId.length > 0);
}

export const asanaFromRow = (r: AsanaRow): Asana => ({
  id: r.id,
  name: r.name,
  sanskritName: r.sanskrit_name ?? '',
  category: r.category,
  description: r.description ?? '',
  benefits: r.benefits ?? [],
  cues: r.cues ?? [],
  focus: r.focus ?? [],
  difficulty: r.difficulty as Asana['difficulty'],
  level: r.level,
  defaultHoldSeconds: r.default_hold_seconds,
  contraindications: r.contraindications ?? [],
  referenceUrl: r.reference_url,
});

export const flowFromRow = (r: YogaFlowRow): YogaFlow => ({
  id: r.id,
  name: r.name,
  description: r.description ?? '',
  style: r.style,
  level: r.level,
  isBuiltIn: r.is_built_in,
  poses: coercePoses(r.poses),
});

/** Total flow duration in seconds, summed across every timed pose. */
export function flowDurationSeconds(flow: YogaFlow): number {
  return flow.poses.reduce((total, p) => total + p.holdSeconds, 0);
}

/** Human-friendly minutes label, e.g. "18 min". */
export function flowDurationLabel(flow: YogaFlow): string {
  const mins = Math.max(1, Math.round(flowDurationSeconds(flow) / 60));
  return `${mins} min`;
}
