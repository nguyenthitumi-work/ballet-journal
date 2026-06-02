'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES, type ThemeId } from '@/lib/themes';
import { updateColorThemeAction } from '../actions';

interface Props {
  current: ThemeId;
}

export default function ThemePicker({ current }: Props) {
  const [selected, setSelected] = useState<ThemeId>(current);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function choose(id: ThemeId) {
    if (id === selected || isPending) return;
    const previous = selected;

    // Apply instantly for feedback; the server revalidate + refresh below makes
    // it stick across the rest of the app (the theme lives on <html> in layout).
    setSelected(id);
    setError(null);
    document.documentElement.dataset.theme = id;

    startTransition(async () => {
      try {
        await updateColorThemeAction(id);
        router.refresh();
      } catch (e) {
        setSelected(previous);
        document.documentElement.dataset.theme = previous;
        setError(e instanceof Error ? e.message : 'Could not save your color.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map((theme) => {
          const active = theme.id === selected;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => choose(theme.id)}
              aria-pressed={active}
              disabled={isPending}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-60 ${
                active
                  ? 'border-violet-600 ring-2 ring-violet-300'
                  : 'border-violet-200 hover:border-violet-400'
              }`}
            >
              <span
                className="h-6 w-6 shrink-0 rounded-full border border-black/10"
                style={{ background: theme.swatch }}
              />
              <span className="text-sm font-medium text-violet-900">{theme.label}</span>
            </button>
          );
        })}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
