// Color themes the user can pick in Settings ▸ Appearance.
//
// The whole UI is styled with hardcoded Tailwind `violet-*` classes, which in
// Tailwind v4 compile to `var(--color-violet-NNN)`. Each theme below recolors
// the app by remapping that violet scale to a different palette — see the
// `[data-theme="..."]` blocks in app/globals.css. This file is just the
// registry the server (layout) and the picker UI read from.
//
// `swatch` is a representative color used only for the selector dot in the UI.
// Keep these ids in sync with the `[data-theme]` blocks in globals.css.

export interface ThemeMeta {
  id: string;
  label: string;
  swatch: string;
}

export const THEMES = [
  { id: 'lavender', label: 'Lavender', swatch: 'oklch(60.6% 0.25 292.717)' },
  { id: 'rose', label: 'Rose', swatch: 'oklch(64.5% 0.246 16.439)' },
  { id: 'sky', label: 'Sky', swatch: 'oklch(68.5% 0.169 237.323)' },
  { id: 'mint', label: 'Mint', swatch: 'oklch(69.6% 0.17 162.48)' },
  { id: 'peach', label: 'Peach', swatch: 'oklch(75% 0.183 55.934)' },
  { id: 'slate', label: 'Slate', swatch: 'oklch(55.4% 0.046 257.417)' },
] as const satisfies readonly ThemeMeta[];

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'lavender';

const THEME_IDS: readonly string[] = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.includes(value);
}

/** Coerce any stored/incoming value to a valid theme, falling back to default. */
export function normalizeTheme(value: unknown): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME;
}
