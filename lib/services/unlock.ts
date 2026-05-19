import { SEED_SKILLS } from '@/lib/data/seedSkills';
import type { Skill } from '@/lib/types';

export type LockState =
  | { locked: false }
  | { locked: true; missingPrereqNames: string[] };

// Authored prerequisites live in the seed file keyed by skill name. Per-user
// skill rows are created from that same seed at bootstrap (lib/db/bootstrap.ts),
// so name is a stable join key within one user's catalog.
const PREREQS_BY_NAME: ReadonlyMap<string, readonly string[]> = new Map(
  SEED_SKILLS.filter((s) => s.prerequisites && s.prerequisites.length > 0).map(
    (s) => [s.name, s.prerequisites as readonly string[]],
  ),
);

// One-time check at module load: a typo in seedSkills.ts that creates a cycle
// would otherwise deadlock half the catalog. Throwing here fails fast in dev.
assertNoCycles(PREREQS_BY_NAME);

export function computeLockStates(skills: Skill[]): Map<string, LockState> {
  const masteredNames = new Set(
    skills.filter((s) => s.progressStatus === 'mastered').map((s) => s.name),
  );
  // Restrict prereq checks to skills the user actually has. A prereq that isn't
  // in the user's catalog (shouldn't happen post-bootstrap) is ignored rather
  // than treated as missing — otherwise a partially-seeded user would be locked
  // out of everything.
  const userSkillNames = new Set(skills.map((s) => s.name));

  const out = new Map<string, LockState>();
  for (const skill of skills) {
    const prereqs = PREREQS_BY_NAME.get(skill.name);
    if (!prereqs || prereqs.length === 0) {
      out.set(skill.id, { locked: false });
      continue;
    }
    const missing = prereqs.filter(
      (name) => userSkillNames.has(name) && !masteredNames.has(name),
    );
    out.set(
      skill.id,
      missing.length === 0
        ? { locked: false }
        : { locked: true, missingPrereqNames: missing },
    );
  }
  return out;
}

function assertNoCycles(graph: ReadonlyMap<string, readonly string[]>): void {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();

  const visit = (node: string, stack: string[]): void => {
    const c = color.get(node) ?? WHITE;
    if (c === BLACK) return;
    if (c === GRAY) {
      const cycleStart = stack.indexOf(node);
      const cycle = [...stack.slice(cycleStart), node].join(' → ');
      throw new Error(`Cycle in seed prerequisites: ${cycle}`);
    }
    color.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      visit(next, stack);
    }
    stack.pop();
    color.set(node, BLACK);
  };

  for (const node of graph.keys()) {
    visit(node, []);
  }
}
