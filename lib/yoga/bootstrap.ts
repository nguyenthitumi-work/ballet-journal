import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import { SEED_ASANAS } from './seedAsanas';
import { SEED_FLOWS } from './seedFlows';

// Seed the per-user yoga content the first time a user opens /yoga.
//
// Kept separate from lib/db/bootstrap.ts (which seeds ballet on first sign-in)
// so existing ballet users — who were bootstrapped before yoga existed — still
// get yoga content seeded lazily on their first visit, and the ballet hot path
// is untouched.
//
// Idempotent: guarded by an existence check on the user's asanas. Only the
// /yoga page calls this (the layout does not), so a double-call race is
// unlikely; the count guard keeps it from re-seeding on every visit.
export async function ensureYogaBootstrapped(userId: string): Promise<void> {
  const supabase = await getServerSupabase();

  const { count, error: countError } = await supabase
    .from('asana')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (countError) throw new Error(`Failed to check yoga seed state: ${countError.message}`);
  if ((count ?? 0) > 0) return; // already seeded

  const asanaRows = SEED_ASANAS.map((a) => ({
    user_id: userId,
    category: a.category,
    name: a.name,
    sanskrit_name: a.sanskritName,
    description: a.description,
    benefits: a.benefits,
    cues: a.cues,
    focus: a.focus,
    contraindications: a.contraindications,
    difficulty: a.difficulty,
    level: a.level,
    default_hold_seconds: a.defaultHoldSeconds,
    reference_url: a.referenceUrl,
  }));

  const { data: insertedAsanas, error: asanaError } = await supabase
    .from('asana')
    .insert(asanaRows)
    .select('id, name');
  if (asanaError) throw new Error(`Failed to seed asanas: ${asanaError.message}`);

  // Seed slug (e.g. "downward-dog") → inserted asana uuid, resolved via name.
  const nameBySlug = new Map(SEED_ASANAS.map((a) => [a.id, a.name]));
  const uuidByName = new Map((insertedAsanas ?? []).map((r) => [r.name, r.id]));

  const flowRows = SEED_FLOWS.map((f) => ({
    user_id: userId,
    name: f.name,
    description: f.description,
    style: f.style,
    level: f.level,
    is_built_in: true,
    poses: f.poses
      .map((p) => {
        const uuid = uuidByName.get(nameBySlug.get(p.asanaId) ?? '');
        if (!uuid) return null;
        return {
          asanaId: uuid,
          holdSeconds: p.holdSeconds,
          side: p.side,
          breathCue: p.breathCue,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null),
  }));

  const { error: flowError } = await supabase.from('yoga_flow').insert(flowRows);
  if (flowError) throw new Error(`Failed to seed yoga flows: ${flowError.message}`);
}
