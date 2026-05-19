// Generates 24 placeholder SVGs for the Swan Lake reward journey.
// Re-run after editing if the look needs tweaking; replace individual files
// with commissioned art when ready (same path, same viewBox).
//
//   node scripts/gen-reward-placeholders.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/rewards/swan-lake');
mkdirSync(OUT_DIR, { recursive: true });

// Four act palettes — scenes 1-6 / 7-12 / 13-18 / 19-24.
// Tinting cues the narrative arc even with placeholder geometry.
const PALETTES = [
  // Act I — court / daytime celebration
  { bgStart: '#fff7ed', bgEnd: '#fde68a', border: '#f59e0b', ink: '#92400e', beak: '#fb923c' },
  // Act II — moonlit lake
  { bgStart: '#eff6ff', bgEnd: '#bfdbfe', border: '#60a5fa', ink: '#1e3a8a', beak: '#f59e0b' },
  // Act III — palace ball, deception
  { bgStart: '#fff1f2', bgEnd: '#fecdd3', border: '#fb7185', ink: '#881337', beak: '#f59e0b' },
  // Act IV — storm, finale (brand violet)
  { bgStart: '#f5f3ff', bgEnd: '#ddd6fe', border: '#a78bfa', ink: '#4c1d95', beak: '#f59e0b' },
];

function paletteFor(n) {
  return PALETTES[Math.floor((n - 1) / 6)];
}

function sceneSvg(n) {
  const p = paletteFor(n);
  const num = String(n).padStart(2, '0');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width="240" height="320" role="img" aria-label="Swan Lake scene ${num}">
  <defs>
    <linearGradient id="bg-${num}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.bgStart}"/>
      <stop offset="100%" stop-color="${p.bgEnd}"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="228" height="308" rx="20" fill="url(#bg-${num})" stroke="${p.border}" stroke-width="2"/>
  <text x="120" y="38" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="${p.ink}">SWAN LAKE</text>
  <g transform="translate(120 165)" fill="${p.ink}">
    <ellipse cx="22" cy="22" rx="58" ry="26"/>
    <path d="M72 12 L96 -2 L80 28 Z"/>
    <path d="M-22 12 C-52 -8 -52 -60 -20 -70 C-4 -76 8 -64 2 -54 C-20 -44 -26 -22 -14 -6 Z"/>
    <circle cx="-14" cy="-66" r="8"/>
    <path d="M-22 -66 L-34 -62 L-22 -58 Z" fill="${p.beak}"/>
    <circle cx="-11" cy="-68" r="1.6" fill="#0f172a"/>
  </g>
  <text x="120" y="268" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="700" fill="${p.ink}">${num}</text>
  <text x="120" y="290" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" letter-spacing="2" fill="${p.ink}" opacity="0.6">SCENE ${num} OF 24</text>
</svg>
`;
}

for (let n = 1; n <= 24; n++) {
  const num = String(n).padStart(2, '0');
  writeFileSync(resolve(OUT_DIR, `${num}.svg`), sceneSvg(n));
}

console.log(`Wrote 24 SVGs to ${OUT_DIR}`);
