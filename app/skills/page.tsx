import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { listCategories, listSkills } from '@/lib/db/skills';
import { CATEGORY_LABELS } from '@/lib/types';
import type { CategoryId, Skill, SkillCategory } from '@/lib/types';

const ALL_CATEGORY_IDS: CategoryId[] = [
  'barre',
  'center',
  'jumps',
  'turns',
  'stretches',
  'conditioning',
];

const MAX_DIFFICULTY = 5;

function isCategoryId(value: string | undefined): value is CategoryId {
  return typeof value === 'string' && (ALL_CATEGORY_IDS as string[]).includes(value);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function DifficultyDots({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(MAX_DIFFICULTY, value));
  const dots: React.ReactElement[] = [];
  for (let i = 0; i < MAX_DIFFICULTY; i += 1) {
    dots.push(
      <span
        key={i}
        aria-hidden
        className={i < filled ? 'text-pink-600' : 'text-pink-200'}
      >
        ●
      </span>,
    );
  }
  return (
    <span
      className="inline-flex gap-0.5 text-xs leading-none"
      aria-label={`Difficulty ${filled} of ${MAX_DIFFICULTY}`}
    >
      {dots}
    </span>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className="block rounded-2xl border border-pink-200 bg-white p-5 shadow-sm transition hover:border-pink-400"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight text-pink-900">
          {skill.name}
        </h3>
        {skill.isCurrentlyWorkingOn ? (
          <span
            aria-label="You're working on this"
            title="You're working on this"
            className="text-lg leading-none text-pink-600"
          >
            ♥
          </span>
        ) : null}
      </div>
      {skill.description ? (
        <p className="mt-1 line-clamp-1 text-sm text-pink-900/70">{skill.description}</p>
      ) : null}
      <div className="mt-3">
        <DifficultyDots value={skill.difficulty} />
      </div>
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

  const [categories, skills] = await Promise.all([listCategories(), listSkills(userId)]);

  // Filter
  const filtered = skills.filter((s) => {
    if (activeCat && s.categoryId !== activeCat) return false;
    if (q.length > 0) {
      const haystack = `${s.name} ${s.description ?? ''}`.toLowerCase();
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
        <h1 className="text-xl font-semibold tracking-tight text-pink-900">Skills</h1>
        <p className="text-sm text-pink-900/70">
          Pick something to learn, practice, or just peek at.
        </p>
      </header>

      <form
        method="get"
        action="/skills"
        className="flex flex-col gap-3"
        role="search"
      >
        {activeCat ? <input type="hidden" name="cat" value={activeCat} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={qRaw}
          placeholder="Search skills…"
          className="w-full rounded-full border border-pink-200 bg-white px-4 py-2 text-sm shadow-sm outline-none placeholder:text-pink-900/40 focus:border-pink-400"
        />
      </form>

      <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
        <CategoryChip
          href={buildHref(null, qRaw)}
          label="All"
          active={activeCat === null}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            href={buildHref(c.id, qRaw)}
            label={c.name}
            color={c.brandColorHex}
            active={activeCat === c.id}
          />
        ))}
      </nav>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-pink-200 bg-white p-5 text-sm text-pink-900/70 shadow-sm">
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

function buildHref(cat: CategoryId | null, q: string): string {
  const params = new URLSearchParams();
  if (cat) params.set('cat', cat);
  if (q.length > 0) params.set('q', q);
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
          ? 'bg-pink-600 text-white shadow-sm'
          : 'border border-pink-200 bg-white text-pink-700 hover:border-pink-400'
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
        <h2 className="text-xl font-semibold tracking-tight text-pink-900">{label}</h2>
        <span className="text-xs text-pink-900/60">
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
