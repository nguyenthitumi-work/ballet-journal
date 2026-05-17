import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listCategories, listSkills } from '@/lib/db/skills';
import { CATEGORY_LABELS } from '@/lib/types';
import type { CategoryId, Difficulty, Skill, SkillCategory } from '@/lib/types';
import { DifficultyBadge } from './_components/Difficulty';
import { FilterBar } from './_components/FilterBar';

const ALL_CATEGORY_IDS: CategoryId[] = [
  'barre',
  'center',
  'jumps',
  'turns',
  'stretches',
  'conditioning',
];

const MAX_CARD_TAGS = 3;

function isCategoryId(value: string | undefined): value is CategoryId {
  return typeof value === 'string' && (ALL_CATEGORY_IDS as string[]).includes(value);
}

function parseDifficulty(value: string | undefined): Difficulty | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (n >= 1 && n <= 5) return n as Difficulty;
  return null;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className="block rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-400"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight text-violet-900">
          {skill.name}
        </h3>
        {skill.isCurrentlyWorkingOn ? (
          <span
            aria-label="You're working on this"
            title="You're working on this"
            className="text-lg leading-none text-violet-600"
          >
            ♥
          </span>
        ) : null}
      </div>
      {skill.description ? (
        <p className="mt-1 line-clamp-1 text-sm text-violet-900/70">{skill.description}</p>
      ) : null}
      <div className="mt-3">
        <DifficultyBadge value={skill.difficulty} />
      </div>
      {skill.trains.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Trains">
          {skill.trains.slice(0, MAX_CARD_TAGS).map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700"
            >
              {tag}
            </li>
          ))}
          {skill.trains.length > MAX_CARD_TAGS ? (
            <li className="rounded-full px-2 py-0.5 text-xs text-violet-900/60">
              +{skill.trains.length - MAX_CARD_TAGS}
            </li>
          ) : null}
        </ul>
      ) : null}
    </Link>
  );
}

interface SkillsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SkillsPage(props: SkillsPageProps) {
  const { userId, onboarded } = await getSessionContext();
  if (!onboarded) redirect('/onboarding');

  const sp = await props.searchParams;
  const catParam = firstParam(sp.cat);
  const activeCat: CategoryId | null = isCategoryId(catParam) ? catParam : null;
  const qRaw = firstParam(sp.q) ?? '';
  const q = qRaw.trim().toLowerCase();
  const activeDiff = parseDifficulty(firstParam(sp.diff));
  const trainRaw = firstParam(sp.train)?.trim() ?? '';
  const activeTrain = trainRaw.length > 0 ? trainRaw : null;

  const [categories, skills] = await Promise.all([listCategories(), listSkills(userId)]);

  // Unique "trains" tags across the user's skill catalog, sorted, for the filter dropdown.
  const trainOptions = Array.from(
    new Set(skills.flatMap((s) => s.trains)),
  ).sort((a, b) => a.localeCompare(b));

  // Filter
  const filtered = skills.filter((s) => {
    if (activeCat && s.categoryId !== activeCat) return false;
    if (activeDiff && s.difficulty !== activeDiff) return false;
    if (activeTrain && !s.trains.includes(activeTrain)) return false;
    if (q.length > 0) {
      const haystack = `${s.name} ${s.description ?? ''} ${s.trains.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Group by category, preserving the category display order.
  const byCategory = new Map<CategoryId, Skill[]>();
  for (const s of filtered) {
    const bucket = byCategory.get(s.categoryId);
    if (bucket) bucket.push(s);
    else byCategory.set(s.categoryId, [s]);
  }
  const orderedCategories = categories.filter((c) => byCategory.has(c.id));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-violet-900">Skills</h1>
        <p className="text-sm text-violet-900/70">
          Pick something to learn, practice, or just peek at.
        </p>
      </header>

      <FilterBar
        q={qRaw}
        cat={activeCat}
        diff={activeDiff}
        train={activeTrain}
        trainOptions={trainOptions}
      />

      <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
        <CategoryChip
          href={buildHref({ cat: null, q: qRaw, diff: activeDiff, train: activeTrain })}
          label="All"
          active={activeCat === null}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            href={buildHref({ cat: c.id, q: qRaw, diff: activeDiff, train: activeTrain })}
            label={c.name}
            color={c.brandColorHex}
            active={activeCat === c.id}
          />
        ))}
      </nav>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-violet-200 bg-white p-5 text-sm text-violet-900/70 shadow-sm">
          No skills match that filter. Try clearing the search.
        </p>
      ) : (
        orderedCategories.map((c) => (
          <CategorySection
            key={c.id}
            category={c}
            skills={byCategory.get(c.id) ?? []}
          />
        ))
      )}
    </section>
  );
}

function buildHref({
  cat,
  q,
  diff,
  train,
}: {
  cat: CategoryId | null;
  q: string;
  diff: Difficulty | null;
  train: string | null;
}): string {
  const params = new URLSearchParams();
  if (cat) params.set('cat', cat);
  if (q.length > 0) params.set('q', q);
  if (diff) params.set('diff', String(diff));
  if (train) params.set('train', train);
  const qs = params.toString();
  return qs.length > 0 ? `/skills?${qs}` : '/skills';
}

function CategoryChip({
  href,
  label,
  color,
  active,
}: {
  href: string;
  label: string;
  color?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-violet-600 text-white shadow-sm'
          : 'border border-violet-200 bg-white text-violet-700 hover:border-violet-400'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {color ? (
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      <span>{label}</span>
    </Link>
  );
}

function CategorySection({
  category,
  skills,
}: {
  category: SkillCategory;
  skills: Skill[];
}) {
  const label = CATEGORY_LABELS[category.id] ?? category.name;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: category.brandColorHex }}
        />
        <h2 className="text-xl font-semibold tracking-tight text-violet-900">{label}</h2>
        <span className="text-xs text-violet-900/60">
          {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {skills.map((s) => (
          <SkillCard key={s.id} skill={s} />
        ))}
      </div>
    </section>
  );
}
