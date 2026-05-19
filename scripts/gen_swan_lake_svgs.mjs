// Generator for the 24 Swan Lake reward SVGs.
// Each file is a 240x320 card with the same outer frame (SWAN LAKE banner +
// scene number) as the original assets, but with a hand-illustrated young
// dancer in a scene-specific pose instead of the generic swan.
//
// Character is parameterized via the `head()` and pose helpers so the same
// 10-year-old reads as the same girl across all 24 frames.

import fs from "node:fs";
import path from "node:path";

const OUT = "/sessions/kind-lucid-einstein/mnt/ballet-journal/public/rewards/swan-lake";

// ---------- character building blocks ----------

// A consistent head/face/hair-bun + neck, rotated as a unit.
// All faces share the same proportions; only rotation and small expression
// tweaks vary. Skin tone fixed.
function head({ rotate = 0, ribbon = "#fff5e1", expr = "soft" } = {}) {
  // expr: 'soft' | 'awe' | 'smile' | 'laugh' | 'serious' | 'sad'
  const mouths = {
    soft: `<path d="M-1.5 -10.5 Q0 -10 1.5 -10.5" stroke="#a44a4a" stroke-width="0.5" fill="none"/>`,
    awe: `<ellipse cx="0" cy="-10.2" rx="0.9" ry="0.6" fill="#a44a4a"/>`,
    smile: `<path d="M-2 -10.5 Q0 -9.4 2 -10.5" stroke="#a44a4a" stroke-width="0.6" fill="none"/>`,
    laugh: `<path d="M-2.2 -10.6 Q0 -9 2.2 -10.6 Q0 -9.6 -2.2 -10.6 Z" fill="#a44a4a"/>`,
    serious: `<path d="M-1.5 -10.4 L1.5 -10.4" stroke="#a44a4a" stroke-width="0.5"/>`,
    sad: `<path d="M-1.6 -10 Q0 -10.6 1.6 -10" stroke="#a44a4a" stroke-width="0.5" fill="none"/>`,
  };
  return `<g transform="rotate(${rotate})">
    <ellipse cx="0" cy="-16" rx="8" ry="9" fill="#f9e3c7"/>
    <path d="M-8 -16 C-8 -23 -4 -27 0 -27 C4 -27 8 -23 8 -16 C8 -14 6 -12 4 -12 L-4 -12 C-6 -12 -8 -14 -8 -16 Z" fill="#6b3410"/>
    <path d="M0 -27 L0 -16" stroke="#3d1d08" stroke-width="0.5"/>
    <ellipse cx="0" cy="-9" rx="5" ry="3.5" fill="#6b3410" stroke="#3d1d08" stroke-width="0.3"/>
    <path d="M-5 -10 L-7 -7 L-2 -8 Z M5 -10 L7 -7 L2 -8 Z" fill="${ribbon}" stroke="#c9924d" stroke-width="0.3"/>
    <path d="M-3.5 -16 L-2 -16 M2 -16 L3.5 -16" stroke="#3d1d08" stroke-width="0.7" stroke-linecap="round"/>
    <path d="M-3 -15.5 L-2.5 -15 M3 -15.5 L2.5 -15" stroke="#3d1d08" stroke-width="0.4"/>
    <path d="M0 -14 L-0.5 -12.5" stroke="#c9924d" stroke-width="0.4" fill="none"/>
    ${mouths[expr] || mouths.soft}
    <circle cx="-4" cy="-12.5" r="1.2" fill="#f4a8a8" opacity="0.6"/>
    <circle cx="4" cy="-12.5" r="1.2" fill="#f4a8a8" opacity="0.6"/>
  </g>
  <path d="M-2.5 -4 L-2.5 -8 L2.5 -8 L2.5 -4 Z" fill="#f9e3c7"/>`;
}

// Standard bodice + tutu in given colors. Tutu shape options: 'romantic',
// 'classical', 'peasant', 'long'.
function torso({ bodice = "#f9e3c7", trim = "#c9924d", accent = "#d4a017", tutu = "url(#tutu-default)", shape = "romantic" } = {}) {
  let tutuPath;
  if (shape === "classical") {
    // wide flat plate
    tutuPath = `<path d="M-26 22 L-30 26 L-26 30 L26 30 L30 26 L26 22 C24 18 -24 18 -26 22 Z" fill="${tutu}" stroke="${trim}" stroke-width="0.4"/>
    <path d="M-24 24 L24 24" stroke="${trim}" stroke-width="0.3" opacity="0.6"/>`;
  } else if (shape === "peasant") {
    // A-line skirt to mid-thigh
    tutuPath = `<path d="M-9 20 L-18 42 L18 42 L9 20 Z" fill="${tutu}" stroke="${trim}" stroke-width="0.4"/>
    <path d="M-12 30 L12 30 M-14 36 L14 36" stroke="${trim}" stroke-width="0.3" opacity="0.5"/>`;
  } else if (shape === "long") {
    // floor-length gown
    tutuPath = `<path d="M-9 20 L-16 64 L16 64 L9 20 Z" fill="${tutu}" stroke="${trim}" stroke-width="0.4"/>
    <path d="M-13 40 L13 40 M-15 54 L15 54" stroke="${trim}" stroke-width="0.3" opacity="0.4"/>`;
  } else {
    // romantic (default): below-knee soft layered
    tutuPath = `<path d="M-22 22 C-26 30 -24 38 -16 40 L16 40 C24 38 26 30 22 22 C18 18 -18 18 -22 22 Z" fill="${tutu}" stroke="${trim}" stroke-width="0.4"/>
    <path d="M-20 26 C-24 32 -22 38 -16 40 L16 40 C22 38 24 32 20 26" fill="#fff5e1" opacity="0.4"/>`;
  }
  return `${tutuPath}
    <path d="M-9 -2 C-10 8 -10 16 -8 22 L8 22 C10 16 10 8 9 -2 C7 -4 -7 -4 -9 -2 Z" fill="${bodice}" stroke="${trim}" stroke-width="0.4"/>
    <path d="M-7 -2 C-3 -3 3 -3 7 -2" stroke="${accent}" stroke-width="0.8" fill="none"/>`;
}

// Skin-tone for arms/legs
const SKIN = "#f9e3c7";
const SLIPPER = "#f9a8c1";

// Tights legs in different positions. Returns SVG.
function legs(pose) {
  switch (pose) {
    case "fifth":
      // closed 5th position straight stance, feet small triangles
      return `<path d="M-4 24 C-5 40 -5 58 -5 66 L5 66 C5 58 5 40 4 24 Z" fill="${SKIN}"/>
        <path d="M-9 66 C-9 70 -4 70 -2 70 L2 70 C4 70 9 70 9 66 L5 64 L-5 64 Z" fill="${SLIPPER}"/>
        <path d="M-5 62 L-4 66 M5 62 L4 66" stroke="${SLIPPER}" stroke-width="0.6"/>`;
    case "tendu_devant":
      // supporting left leg straight, right leg pointing forward
      return `<path d="M-5 24 C-6 40 -6 58 -6 66 L1 66 L1 24 Z" fill="${SKIN}"/>
        <path d="M1 24 L8 26 L20 52 L26 56 L22 60 L14 56 L4 36 Z" fill="${SKIN}"/>
        <path d="M-10 66 C-10 70 -5 70 -3 70 L1 70 L1 64 L-7 64 Z" fill="${SLIPPER}"/>
        <path d="M20 52 L30 58 L26 60 L18 55 Z" fill="${SLIPPER}"/>`;
    case "attitude_derriere_low":
      // standing on left, right leg lifted low behind, knee bent
      return `<path d="M-6 24 C-7 40 -7 58 -7 66 L0 66 L0 24 Z" fill="${SKIN}"/>
        <path d="M0 24 C8 28 16 32 18 40 C10 38 0 32 0 24 Z" fill="${SKIN}"/>
        <path d="M18 40 L8 50 L4 46 L14 38 Z" fill="${SKIN}"/>
        <path d="M-11 66 C-11 70 -6 70 -4 70 L0 70 L0 64 L-8 64 Z" fill="${SLIPPER}"/>
        <path d="M8 50 L0 54 L4 50 Z" fill="${SLIPPER}"/>`;
    case "attitude_croise_devant":
      // standing on left, right leg lifted crossed in front
      return `<path d="M-6 24 C-7 40 -7 58 -7 66 L0 66 L0 24 Z" fill="${SKIN}"/>
        <path d="M0 24 C-8 28 -16 30 -20 24 C-12 22 -4 22 0 24 Z" fill="${SKIN}"/>
        <path d="M-20 24 L-30 14 L-26 10 L-16 22 Z" fill="${SKIN}"/>
        <path d="M-11 66 C-11 70 -6 70 -4 70 L0 70 L0 64 L-8 64 Z" fill="${SLIPPER}"/>
        <path d="M-30 14 L-36 6 L-32 4 L-26 12 Z" fill="${SLIPPER}"/>`;
    case "jete":
      // mid-jump, front leg up forward, back leg trailing
      return `<path d="M-4 24 C2 30 16 36 28 36 C30 36 32 38 30 40 C18 42 0 36 -6 26 Z" fill="${SKIN}"/>
        <path d="M28 36 L40 38 L38 42 L26 40 Z" fill="${SLIPPER}"/>
        <path d="M-2 24 C-12 28 -22 36 -28 50 C-30 52 -28 54 -26 52 C-18 44 -8 36 0 32 Z" fill="${SKIN}"/>
        <path d="M-28 50 L-36 58 L-34 62 L-26 54 Z" fill="${SLIPPER}"/>`;
    case "arabesque":
      // supporting left leg, right leg extended straight back at hip level
      return `<path d="M-6 24 C-7 40 -7 58 -7 66 L0 66 L0 24 Z" fill="${SKIN}"/>
        <path d="M0 24 C12 22 28 22 44 24 C44 26 44 28 42 28 C28 28 14 28 0 30 Z" fill="${SKIN}"/>
        <path d="M44 24 L56 22 L56 26 L46 28 Z" fill="${SLIPPER}"/>
        <path d="M-11 66 C-11 70 -6 70 -4 70 L0 70 L0 64 L-8 64 Z" fill="${SLIPPER}"/>`;
    case "passe":
      // standing on left, right foot drawn up to left knee
      return `<path d="M-6 24 C-7 40 -7 58 -7 66 L0 66 L0 24 Z" fill="${SKIN}"/>
        <path d="M0 24 L-2 38 L-12 38 L-14 42 L-10 42 L-2 42 L4 38 L6 24 Z" fill="${SKIN}"/>
        <path d="M-14 42 L-20 42 L-18 44 L-12 44 Z" fill="${SLIPPER}"/>
        <path d="M-11 66 C-11 70 -6 70 -4 70 L0 70 L0 64 L-8 64 Z" fill="${SLIPPER}"/>`;
    case "b_plus":
      // weight on left, right foot pointed behind softly
      return `<path d="M-5 24 C-6 40 -6 58 -6 66 L1 66 L1 24 Z" fill="${SKIN}"/>
        <path d="M1 24 C4 36 6 50 8 60 L4 64 L0 50 Z" fill="${SKIN}"/>
        <path d="M-10 66 C-10 70 -5 70 -3 70 L1 70 L1 64 L-7 64 Z" fill="${SLIPPER}"/>
        <path d="M8 60 L14 66 L10 68 L6 64 Z" fill="${SLIPPER}"/>`;
    case "kneeling":
      // one knee on ground, other foot forward
      return `<path d="M-10 24 L-14 50 L-22 60 L-18 64 L-8 56 L-2 36 Z" fill="${SKIN}"/>
        <path d="M2 24 L4 36 L0 50 L8 64 L14 66 L18 62 L10 50 L8 36 Z" fill="${SKIN}"/>
        <path d="M-22 60 L-28 64 L-22 66 L-16 64 Z" fill="${SLIPPER}"/>
        <path d="M14 66 L20 68 L20 64 Z" fill="${SLIPPER}"/>`;
    case "running":
      // mid-stride
      return `<path d="M-3 24 C-8 36 -14 50 -18 60 L-12 64 L-6 50 L0 32 Z" fill="${SKIN}"/>
        <path d="M3 24 C10 32 18 40 24 50 L20 56 L12 46 L4 32 Z" fill="${SKIN}"/>
        <path d="M-18 60 L-26 64 L-20 66 L-14 64 Z" fill="${SLIPPER}"/>
        <path d="M24 50 L32 54 L30 58 L22 54 Z" fill="${SLIPPER}"/>`;
    case "sitting":
      // seated, legs to side
      return `<path d="M-2 24 L-30 38 L-32 42 L-28 42 L-2 30 Z" fill="${SKIN}"/>
        <path d="M2 24 L20 36 L34 36 L36 40 L32 42 L18 40 L2 30 Z" fill="${SKIN}"/>
        <path d="M-32 42 L-38 44 L-34 46 L-30 44 Z" fill="${SLIPPER}"/>
        <path d="M34 36 L42 36 L40 40 L34 40 Z" fill="${SLIPPER}"/>`;
    case "fouette":
      // turn, working leg out at second
      return `<path d="M-6 24 C-7 40 -7 58 -7 66 L0 66 L0 24 Z" fill="${SKIN}"/>
        <path d="M0 24 L26 18 L42 14 L46 18 L42 22 L28 22 L0 30 Z" fill="${SKIN}"/>
        <path d="M-11 66 C-11 70 -6 70 -4 70 L0 70 L0 64 L-8 64 Z" fill="${SLIPPER}"/>
        <path d="M46 18 L54 16 L54 22 L46 22 Z" fill="${SLIPPER}"/>`;
    case "relevé":
      // up on tippy-toes, both feet
      return `<path d="M-4 24 C-5 40 -5 58 -5 64 L5 64 C5 58 5 40 4 24 Z" fill="${SKIN}"/>
        <path d="M-7 64 L-7 68 L-4 70 L-3 68 L-3 64 Z" fill="${SLIPPER}"/>
        <path d="M3 64 L3 68 L4 70 L7 68 L7 64 Z" fill="${SLIPPER}"/>`;
    default:
      return legs("fifth");
  }
}

// Arms in various positions
function arms(pose) {
  switch (pose) {
    case "bras_bas":
      // low oval
      return `<path d="M-9 4 C-14 12 -12 22 -4 26" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C14 12 12 22 4 26" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-3" cy="26" r="1.6" fill="${SKIN}"/>
        <circle cx="3" cy="26" r="1.6" fill="${SKIN}"/>`;
    case "first":
      // rounded in front at chest height
      return `<path d="M-9 4 C-18 10 -16 18 -6 18" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C18 10 16 18 6 18" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-4" cy="18" r="1.6" fill="${SKIN}"/>
        <circle cx="4" cy="18" r="1.6" fill="${SKIN}"/>`;
    case "second":
      // out to sides at shoulder height
      return `<path d="M-9 4 C-22 4 -32 6 -36 8" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C22 4 32 6 36 8" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-36" cy="8" r="1.6" fill="${SKIN}"/>
        <circle cx="36" cy="8" r="1.6" fill="${SKIN}"/>`;
    case "fifth_en_haut":
      // rounded overhead
      return `<path d="M-9 4 C-18 -8 -10 -22 -2 -28" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C18 -8 10 -22 2 -28" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-2" cy="-28" r="1.6" fill="${SKIN}"/>
        <circle cx="2" cy="-28" r="1.6" fill="${SKIN}"/>`;
    case "third_arabesque":
      // right arm forward & up, left arm low and behind
      return `<path d="M-9 4 C-20 14 -28 18 -34 22" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C20 -2 32 -8 40 -14" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-34" cy="22" r="1.6" fill="${SKIN}"/>
        <circle cx="40" cy="-14" r="1.6" fill="${SKIN}"/>`;
    case "welcoming":
      // right arm extended forward, left out to side
      return `<path d="M-9 4 C-18 6 -28 4 -34 6" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C18 0 26 -4 32 -6" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-34" cy="6" r="1.6" fill="${SKIN}"/>
        <circle cx="32" cy="-6" r="1.6" fill="${SKIN}"/>`;
    case "open_v_up":
      // open arms up high in a V
      return `<path d="M-9 4 C-18 -8 -28 -22 -34 -32" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C18 -8 28 -22 34 -32" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-34" cy="-32" r="1.6" fill="${SKIN}"/>
        <circle cx="34" cy="-32" r="1.6" fill="${SKIN}"/>`;
    case "reverence":
      // right hand holds tutu edge, left extended to side palm up
      return `<path d="M9 4 C14 14 18 22 14 28" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M-9 4 C-18 8 -28 14 -34 18" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="14" cy="28" r="1.6" fill="${SKIN}"/>
        <circle cx="-34" cy="18" r="1.6" fill="${SKIN}"/>`;
    case "folded_front":
      // arms gently folded across body
      return `<path d="M-9 4 C-4 10 6 14 12 18" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C4 10 -6 16 -10 22" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="12" cy="18" r="1.6" fill="${SKIN}"/>
        <circle cx="-10" cy="22" r="1.6" fill="${SKIN}"/>`;
    case "low_fourth":
      // right arm curved in front at waist, left out to side
      return `<path d="M9 4 C4 12 -2 16 -8 18" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M-9 4 C-18 6 -28 8 -34 12" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-8" cy="18" r="1.6" fill="${SKIN}"/>
        <circle cx="-34" cy="12" r="1.6" fill="${SKIN}"/>`;
    case "hand_to_mouth":
      // right hand at mouth (surprise/laugh), left out low
      return `<path d="M9 4 C8 -2 4 -6 0 -9" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M-9 4 C-18 12 -28 18 -34 22" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="0" cy="-9" r="1.8" fill="${SKIN}"/>
        <circle cx="-34" cy="22" r="1.6" fill="${SKIN}"/>`;
    case "hands_to_face":
      // both hands cupped near face (despair)
      return `<path d="M-9 4 C-10 -6 -8 -12 -4 -14" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C10 -6 8 -12 4 -14" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-4" cy="-14" r="1.8" fill="${SKIN}"/>
        <circle cx="4" cy="-14" r="1.8" fill="${SKIN}"/>`;
    case "reaching_back":
      // left arm reaches back, right forward low
      return `<path d="M-9 4 C-18 -2 -28 -6 -38 -10" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C16 10 22 14 28 16" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-38" cy="-10" r="1.6" fill="${SKIN}"/>
        <circle cx="28" cy="16" r="1.6" fill="${SKIN}"/>`;
    case "embrace":
      // arms reach out forward (about to embrace)
      return `<path d="M-9 4 C-12 -2 -10 -8 -6 -10" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C12 -2 10 -8 6 -10" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-6" cy="-10" r="1.6" fill="${SKIN}"/>
        <circle cx="6" cy="-10" r="1.6" fill="${SKIN}"/>`;
    case "cygnets":
      // arms crossed low at sides linking with imaginary partners
      return `<path d="M-9 4 C-22 12 -36 8 -42 16" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C22 12 36 8 42 16" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-42" cy="16" r="1.6" fill="${SKIN}"/>
        <circle cx="42" cy="16" r="1.6" fill="${SKIN}"/>`;
    case "dramatic_back":
      // left arm thrown high back, right low front (Odile flair)
      return `<path d="M-9 4 C-20 -10 -34 -22 -42 -28" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C16 10 22 14 26 14" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-42" cy="-28" r="1.6" fill="${SKIN}"/>
        <circle cx="26" cy="14" r="1.6" fill="${SKIN}"/>`;
    case "pointing_forward":
      // right arm pointing forward, finger leading
      return `<path d="M-9 4 C-14 12 -12 22 -4 26" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C20 6 32 6 42 4" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-3" cy="26" r="1.6" fill="${SKIN}"/>
        <circle cx="42" cy="4" r="1.8" fill="${SKIN}"/>`;
    case "looking_down":
      // both arms low, slightly forward (peering at ground)
      return `<path d="M-9 4 C-12 14 -8 22 -4 28" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M9 4 C12 14 8 22 4 28" stroke="${SKIN}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="-4" cy="28" r="1.6" fill="${SKIN}"/>
        <circle cx="4" cy="28" r="1.6" fill="${SKIN}"/>`;
    default:
      return arms("bras_bas");
  }
}

// Shadow at feet
const FOOT_SHADOW = `<ellipse cx="0" cy="68" rx="14" ry="2.5" fill="#000" fill-opacity="0.3"/>`;

// Compose a dancer at given translation
function dancer({ x = 120, y = 168, legs: lp, arms: ap, torso: tp = {}, head: hp = {}, shadow = true } = {}) {
  return `<g transform="translate(${x} ${y})">
    ${shadow ? FOOT_SHADOW : ""}
    ${legs(lp)}
    ${torso(tp)}
    ${arms(ap)}
    ${head(hp)}
  </g>`;
}

// ---------- frame helper ----------

function card({ n, title, defs, body }) {
  const num = String(n).padStart(2, "0");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width="240" height="320" role="img" aria-label="Swan Lake scene ${num} — ${title}">
  <defs>
    ${defs}
  </defs>
  <rect x="6" y="6" width="228" height="308" rx="20" fill="url(#card-bg-${num})" stroke="#f59e0b" stroke-width="2"/>
  <text x="120" y="38" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="#92400e">SWAN LAKE</text>
  <clipPath id="stage-${num}"><rect x="22" y="50" width="196" height="200" rx="6"/></clipPath>
  <g clip-path="url(#stage-${num})">
    ${body}
  </g>
  <rect x="22" y="50" width="196" height="200" rx="6" fill="none" stroke="#92400e" stroke-width="0.6" opacity="0.6"/>
  <text x="120" y="278" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-style="italic" fill="#92400e">${title}</text>
  <text x="120" y="298" text-anchor="middle" font-family="system-ui, sans-serif" font-size="8" letter-spacing="2" fill="#92400e" opacity="0.6">SCENE ${num} OF 24</text>
</svg>
`;
}

// Reusable mini-gradient defs builder
function cardBgDef(num, top, bot) {
  return `<linearGradient id="card-bg-${num}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${top}"/>
    <stop offset="100%" stop-color="${bot}"/>
  </linearGradient>`;
}

function tutuDef(id, top, bot) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${top}"/>
    <stop offset="100%" stop-color="${bot}"/>
  </linearGradient>`;
}

// ---------- scene definitions ----------

const SCENES = [];

// 01 — The curtain rises
SCENES.push({
  n: 1, title: "The curtain rises",
  defs: () => `${cardBgDef("01", "#fff7ed", "#fde68a")}
    ${tutuDef("tutu-01", "#fffaf0", "#fde4c5")}
    <linearGradient id="curtain-01" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7f1d1d"/><stop offset="60%" stop-color="#b91c1c"/><stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>
    <radialGradient id="spot-01" cx="0.5" cy="0.2" r="0.6">
      <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.85"/><stop offset="100%" stop-color="#fffbeb" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="floor-01" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#78350f"/><stop offset="100%" stop-color="#451a03"/>
    </linearGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1c1410"/>
    <path d="M22 50 L218 50 L218 78 C200 90 175 96 150 92 C130 88 110 80 90 78 C70 76 45 82 22 92 Z" fill="url(#curtain-01)"/>
    <path d="M22 50 L22 250 L52 250 C46 200 50 140 36 95 C30 80 22 70 22 50 Z" fill="url(#curtain-01)"/>
    <path d="M218 50 L218 250 L188 250 C194 200 190 140 204 95 C210 80 218 70 218 50 Z" fill="url(#curtain-01)"/>
    <g fill="#d4a017"><circle cx="58" cy="95" r="2"/><circle cx="82" cy="88" r="2"/><circle cx="120" cy="92" r="2"/><circle cx="158" cy="88" r="2"/><circle cx="182" cy="95" r="2"/></g>
    <ellipse cx="120" cy="240" rx="56" ry="14" fill="#fffbeb" fill-opacity="0.15"/>
    <rect x="22" y="50" width="196" height="200" fill="url(#spot-01)"/>
    <rect x="22" y="232" width="196" height="18" fill="url(#floor-01)"/>
    ${dancer({ legs: "fifth", arms: "bras_bas", torso: { tutu: "url(#tutu-01)" }, head: { rotate: 8, ribbon: "#fff5e1", expr: "soft" } })}`,
});

// 02 — Prince Siegfried enters the courtyard
SCENES.push({
  n: 2, title: "Prince Siegfried enters the courtyard",
  defs: () => `${cardBgDef("02", "#fef9ec", "#fce7c2")}
    ${tutuDef("tutu-02", "#fffaf0", "#fde4c5")}
    <linearGradient id="sky-02" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#fcd34d"/>
    </linearGradient>
    <linearGradient id="floor-02" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d6b78a"/><stop offset="100%" stop-color="#a17244"/>
    </linearGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="url(#sky-02)"/>
    <rect x="22" y="220" width="196" height="30" fill="url(#floor-02)"/>
    <g stroke="#8a5a2d" stroke-width="0.5" opacity="0.6">
      <line x1="22" y1="232" x2="218" y2="232"/>
      <line x1="60" y1="220" x2="60" y2="250"/><line x1="100" y1="220" x2="100" y2="250"/>
      <line x1="140" y1="220" x2="140" y2="250"/><line x1="180" y1="220" x2="180" y2="250"/>
    </g>
    <g fill="#c9924d" stroke="#8a5a2d" stroke-width="0.5">
      <rect x="170" y="80" width="42" height="140"/>
      <path d="M170 110 L191 80 L212 110 Z"/>
      <rect x="184" y="120" width="14" height="50" rx="7" fill="#1c1410"/>
    </g>
    <g fill="#1c1410" opacity="0.6">
      <ellipse cx="178" cy="160" rx="3" ry="6"/>
      <rect x="176" y="150" width="6" height="20"/>
    </g>
    <g fill="#9aa589" opacity="0.4">
      <circle cx="40" cy="200" r="14"/><circle cx="56" cy="208" r="10"/>
    </g>
    ${dancer({ x: 110, y: 168, legs: "attitude_derriere_low", arms: "welcoming", torso: { tutu: "url(#tutu-02)", accent: "#7eb6d9" }, head: { rotate: 14, ribbon: "#bfdbfe", expr: "smile" } })}`,
});

// 03 — A birthday celebration
SCENES.push({
  n: 3, title: "A birthday celebration",
  defs: () => `${cardBgDef("03", "#fff2db", "#fbbf77")}
    ${tutuDef("tutu-03", "#fdf3c4", "#f5cf78")}
    <linearGradient id="sky-03" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="url(#sky-03)"/>
    <rect x="22" y="220" width="196" height="30" fill="#78350f"/>
    <g stroke="#fb923c" stroke-width="0.6" fill="none">
      <path d="M30 60 Q60 75 90 60 Q120 75 150 60 Q180 75 210 60"/>
    </g>
    <g fill="#f9a8c1"><circle cx="40" cy="65" r="2"/><circle cx="80" cy="68" r="2"/><circle cx="120" cy="65" r="2"/><circle cx="160" cy="68" r="2"/><circle cx="200" cy="65" r="2"/></g>
    <g fill="#fcd34d" opacity="0.9"><circle cx="50" cy="170" r="6"/><circle cx="190" cy="170" r="6"/></g>
    <g fill="#d4a017"><rect x="46" y="170" width="8" height="20" rx="2"/><rect x="186" y="170" width="8" height="20" rx="2"/></g>
    <g fill="#7f1d1d" opacity="0.7">
      <rect x="60" y="190" width="120" height="30" rx="3"/>
      <circle cx="80" cy="200" r="4" fill="#fde68a"/><circle cx="120" cy="200" r="4" fill="#fde68a"/><circle cx="160" cy="200" r="4" fill="#fde68a"/>
    </g>
    ${dancer({ legs: "tendu_devant", arms: "fifth_en_haut", torso: { tutu: "url(#tutu-03)", accent: "#d4a017" }, head: { rotate: -6, ribbon: "#fdf3c4", expr: "smile" } })}
    <g fill="#9aa589" opacity="0.4"><circle cx="120" cy="62" r="2"/><circle cx="125" cy="60" r="1.5"/></g>`,
});

// 04 — A bow to the Queen
SCENES.push({
  n: 4, title: "A bow to the Queen",
  defs: () => `${cardBgDef("04", "#fef3e2", "#f0c98a")}
    ${tutuDef("tutu-04", "#fdf3c4", "#f5cf78")}
    <radialGradient id="candle-04" cx="0.7" cy="0.3" r="0.7">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.7"/><stop offset="100%" stop-color="#92400e" stop-opacity="0"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#3b1f0d"/>
    <rect x="22" y="50" width="196" height="200" fill="url(#candle-04)"/>
    <rect x="22" y="225" width="196" height="25" fill="#5b3013"/>
    <g stroke="#c9924d" stroke-width="0.4" opacity="0.5"><path d="M22 235 L218 235"/></g>
    <g fill="#8b1a1a" stroke="#5b0e0e" stroke-width="0.5">
      <rect x="166" y="120" width="50" height="120"/>
      <path d="M166 120 L191 100 L216 120 Z"/>
      <rect x="180" y="135" width="22" height="65" rx="2" fill="#5b0e0e"/>
    </g>
    <g fill="#d4a017"><circle cx="191" cy="115" r="3"/></g>
    <g fill="#5b3013" opacity="0.5">
      <rect x="30" y="80" width="40" height="120"/>
      <rect x="80" y="80" width="40" height="120"/>
    </g>
    <g fill="#fcd34d" opacity="0.6">
      <circle cx="50" cy="100" r="6"/><circle cx="100" cy="100" r="6"/>
    </g>
    ${dancer({ legs: "b_plus", arms: "reverence", torso: { tutu: "url(#tutu-04)", accent: "#d4a017" }, head: { rotate: 20, ribbon: "#fdf3c4", expr: "soft" } })}`,
});

// 05 — Off to the lake by moonlight
SCENES.push({
  n: 5, title: "Off to the lake by moonlight",
  defs: () => `${cardBgDef("05", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-05", "#e0e7ff", "#a5b4fc")}
    <radialGradient id="moon-05" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <circle cx="180" cy="90" r="18" fill="url(#moon-05)"/>
    <g fill="#fef3c7" opacity="0.7">
      <circle cx="60" cy="80" r="0.6"/><circle cx="90" cy="65" r="0.5"/><circle cx="110" cy="90" r="0.6"/>
      <circle cx="140" cy="60" r="0.5"/><circle cx="40" cy="110" r="0.5"/><circle cx="200" cy="130" r="0.6"/>
    </g>
    <rect x="22" y="200" width="196" height="50" fill="#0f172a"/>
    <g stroke="#475569" stroke-width="0.5" opacity="0.5">
      <path d="M22 215 L218 215"/>
    </g>
    <g fill="#1e3a2e" opacity="0.8">
      <path d="M30 200 C30 180 36 160 30 140 L40 140 C36 160 42 180 42 200 Z"/>
      <path d="M195 200 C195 180 201 160 195 140 L205 140 C201 160 207 180 207 200 Z"/>
      <ellipse cx="36" cy="155" rx="14" ry="20"/>
      <ellipse cx="201" cy="155" rx="14" ry="20"/>
    </g>
    ${dancer({ legs: "tendu_devant", arms: "pointing_forward", torso: { tutu: "url(#tutu-05)", bodice: "#e0e7ff", accent: "#7eb6d9" }, head: { rotate: -8, ribbon: "#bfdbfe", expr: "serious" } })}`,
});

// 06 — Footprints in the moonlight
SCENES.push({
  n: 6, title: "Footprints in the moonlight",
  defs: () => `${cardBgDef("06", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-06", "#e0e7ff", "#a5b4fc")}
    <radialGradient id="moon-06" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <circle cx="60" cy="85" r="16" fill="url(#moon-06)"/>
    <g fill="#fef3c7" opacity="0.6"><circle cx="120" cy="70" r="0.6"/><circle cx="170" cy="100" r="0.5"/><circle cx="200" cy="65" r="0.6"/></g>
    <path d="M22 200 Q120 195 218 200 L218 250 L22 250 Z" fill="#cbd5e1" opacity="0.7"/>
    <path d="M22 210 Q120 205 218 210" stroke="#94a3b8" stroke-width="0.5" fill="none" opacity="0.6"/>
    <g fill="#1e3a8a" opacity="0.55">
      <ellipse cx="60" cy="230" rx="3.5" ry="2.4"/><ellipse cx="80" cy="222" rx="3.5" ry="2.4"/>
      <ellipse cx="100" cy="232" rx="3.5" ry="2.4"/><ellipse cx="125" cy="225" rx="3.5" ry="2.4"/>
      <ellipse cx="150" cy="234" rx="3.5" ry="2.4"/><ellipse cx="175" cy="226" rx="3.5" ry="2.4"/>
    </g>
    ${dancer({ x: 120, y: 168, legs: "passe", arms: "looking_down", torso: { tutu: "url(#tutu-06)", bodice: "#e0e7ff", accent: "#7eb6d9" }, head: { rotate: 22, ribbon: "#bfdbfe", expr: "soft" } })}`,
});

// 07 — A flock of swans appears
SCENES.push({
  n: 7, title: "A flock of swans appears",
  defs: () => `${cardBgDef("07", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-07", "#f1f5f9", "#cbd5e1")}
    <radialGradient id="moon-07" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <circle cx="155" cy="100" r="22" fill="url(#moon-07)" opacity="0.95"/>
    <g fill="#f8fafc" opacity="0.85">
      <path d="M60 110 C66 106 74 104 80 110 C76 114 70 116 64 114 Z"/>
      <path d="M90 95 C96 91 104 89 110 95 C106 99 100 101 94 99 Z"/>
      <path d="M125 115 C131 111 139 109 145 115 C141 119 135 121 129 119 Z"/>
      <path d="M165 130 C171 126 179 124 185 130 C181 134 175 136 169 134 Z"/>
      <path d="M48 145 C54 141 62 139 68 145 C64 149 58 151 52 149 Z"/>
    </g>
    <g fill="#cbd5e1" opacity="0.5">
      <path d="M62 110 L66 108 L60 110 Z"/><path d="M92 95 L96 93 L90 95 Z"/>
    </g>
    <rect x="22" y="210" width="196" height="40" fill="#0f172a"/>
    ${dancer({ x: 120, y: 178, legs: "attitude_croise_devant", arms: "open_v_up", torso: { tutu: "url(#tutu-07)", bodice: "#e0e7ff", accent: "#bfdbfe" }, head: { rotate: -18, ribbon: "#f1f5f9", expr: "awe" } })}`,
});

// 08 — Odette emerges from the lake
SCENES.push({
  n: 8, title: "Odette emerges from the lake",
  defs: () => `${cardBgDef("08", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-08", "#f8fafc", "#cbd5e1")}
    <radialGradient id="mist-08" cx="0.5" cy="0.7" r="0.6">
      <stop offset="0%" stop-color="#e0e7ff" stop-opacity="0.55"/><stop offset="100%" stop-color="#e0e7ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moon-08" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <circle cx="50" cy="85" r="14" fill="url(#moon-08)"/>
    <path d="M22 200 Q120 195 218 200 L218 250 L22 250 Z" fill="#1e3a8a" opacity="0.7"/>
    <rect x="22" y="50" width="196" height="200" fill="url(#mist-08)"/>
    <g stroke="#7eb6d9" stroke-width="0.4" fill="none" opacity="0.55">
      <path d="M40 215 Q70 213 100 215"/><path d="M120 220 Q150 218 180 220"/>
      <path d="M60 225 Q90 223 120 225"/><path d="M150 230 Q180 228 210 230"/>
    </g>
    <g fill="#f1f5f9" opacity="0.7"><ellipse cx="80" cy="215" rx="6" ry="1.6"/><ellipse cx="160" cy="225" rx="5" ry="1.4"/></g>
    ${dancer({ x: 120, y: 178, legs: "relevé", arms: "fifth_en_haut", torso: { tutu: "url(#tutu-08)", bodice: "#f1f5f9", accent: "#bfdbfe", shape: "romantic" }, head: { rotate: -4, ribbon: "#e0e7ff", expr: "soft" } })}
    <g fill="#f8fafc" opacity="0.4"><circle cx="100" cy="160" r="22"/><circle cx="140" cy="170" r="20"/></g>`,
});

// 09 — She tells her story
SCENES.push({
  n: 9, title: "She tells her story",
  defs: () => `${cardBgDef("09", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-09", "#f8fafc", "#cbd5e1")}
    <radialGradient id="moon-09" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <circle cx="190" cy="80" r="14" fill="url(#moon-09)"/>
    <g fill="#fef3c7" opacity="0.5"><circle cx="50" cy="70" r="0.5"/><circle cx="120" cy="65" r="0.5"/><circle cx="155" cy="95" r="0.5"/></g>
    <path d="M22 195 Q120 190 218 195 L218 250 L22 250 Z" fill="#1e3a8a" opacity="0.65"/>
    <g stroke="#7eb6d9" stroke-width="0.4" fill="none" opacity="0.5">
      <path d="M30 210 Q80 208 130 210"/><path d="M130 220 Q180 218 218 220"/>
    </g>
    <g fill="#1e3a2e" opacity="0.7">
      <path d="M170 195 L172 180 L168 195 Z"/><path d="M174 195 L176 175 L172 195 Z"/>
      <path d="M178 195 L180 182 L176 195 Z"/><path d="M40 198 L42 184 L38 198 Z"/>
      <path d="M44 198 L46 178 L42 198 Z"/>
    </g>
    ${dancer({ x: 110, y: 178, legs: "sitting", arms: "first", torso: { tutu: "url(#tutu-09)", bodice: "#f1f5f9", accent: "#bfdbfe" }, head: { rotate: 14, ribbon: "#e0e7ff", expr: "sad" } })}`,
});

// 10 — A vow under the stars
SCENES.push({
  n: 10, title: "A vow under the stars",
  defs: () => `${cardBgDef("10", "#1e1b4b", "#312e81")}
    ${tutuDef("tutu-10", "#f8fafc", "#cbd5e1")}
    <radialGradient id="moon-10" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e1b4b"/>
    <circle cx="50" cy="80" r="12" fill="url(#moon-10)"/>
    <g fill="#fef3c7">
      <path d="M120 70 L121 72 L123 72.5 L121 73 L120 75 L119 73 L117 72.5 L119 72 Z"/>
      <path d="M170 90 L171 92 L173 92.5 L171 93 L170 95 L169 93 L167 92.5 L169 92 Z"/>
      <path d="M90 95 L91 97 L93 97.5 L91 98 L90 100 L89 98 L87 97.5 L89 97 Z"/>
      <path d="M200 130 L201 132 L203 132.5 L201 133 L200 135 L199 133 L197 132.5 L199 132 Z"/>
      <circle cx="60" cy="125" r="0.6"/><circle cx="100" cy="60" r="0.5"/><circle cx="150" cy="65" r="0.5"/>
      <circle cx="180" cy="120" r="0.6"/><circle cx="30" cy="130" r="0.5"/>
    </g>
    <path d="M22 220 Q120 215 218 220 L218 250 L22 250 Z" fill="#312e81" opacity="0.8"/>
    ${dancer({ x: 120, y: 170, legs: "tendu_devant", arms: "first", torso: { tutu: "url(#tutu-10)", bodice: "#f1f5f9", accent: "#bfdbfe" }, head: { rotate: -12, ribbon: "#e0e7ff", expr: "soft" } })}
    <g fill="#fef3c7" opacity="0.5"><circle cx="120" cy="135" r="14"/></g>`,
});

// 11 — Siegfried lifts Odette
SCENES.push({
  n: 11, title: "Siegfried lifts Odette",
  defs: () => `${cardBgDef("11", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-11", "#f8fafc", "#cbd5e1")}
    <radialGradient id="moon-11" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <circle cx="180" cy="85" r="14" fill="url(#moon-11)"/>
    <path d="M22 215 Q120 210 218 215 L218 250 L22 250 Z" fill="#1e3a8a" opacity="0.7"/>
    <g fill="#2d2218" opacity="0.95">
      <path d="M120 250 L116 200 L124 200 Z"/>
      <ellipse cx="120" cy="200" rx="14" ry="12"/>
      <path d="M120 188 L120 170" stroke="#2d2218" stroke-width="3"/>
      <ellipse cx="120" cy="167" rx="6" ry="7"/>
      <path d="M114 188 L98 180" stroke="#2d2218" stroke-width="3" stroke-linecap="round"/>
      <path d="M126 188 L142 180" stroke="#2d2218" stroke-width="3" stroke-linecap="round"/>
    </g>
    ${dancer({ x: 120, y: 130, legs: "arabesque", arms: "open_v_up", torso: { tutu: "url(#tutu-11)", bodice: "#f1f5f9", accent: "#bfdbfe", shape: "classical" }, head: { rotate: -10, ribbon: "#e0e7ff", expr: "soft" } })}`,
});

// 12 — The Pas de Quatre begins
SCENES.push({
  n: 12, title: "The Pas de Quatre begins",
  defs: () => `${cardBgDef("12", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-12", "#f8fafc", "#cbd5e1")}`,
  body: () => {
    // Three small background cygnets + central main dancer
    const mini = (cx) => `<g transform="translate(${cx} 178) scale(0.7)">
      ${FOOT_SHADOW}
      ${legs("relevé")}
      ${torso({ tutu: "url(#tutu-12)", bodice: "#f1f5f9", accent: "#bfdbfe" })}
      ${arms("cygnets")}
      ${head({ rotate: 0, ribbon: "#e0e7ff", expr: "smile" })}
    </g>`;
    return `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
      <path d="M22 220 Q120 215 218 220 L218 250 L22 250 Z" fill="#1e3a8a" opacity="0.7"/>
      <g opacity="0.5">${mini(50)}${mini(190)}</g>
      <g opacity="0.7">${mini(80)}</g>
      ${dancer({ x: 120, y: 168, legs: "relevé", arms: "cygnets", torso: { tutu: "url(#tutu-12)", bodice: "#f1f5f9", accent: "#bfdbfe" }, head: { rotate: 0, ribbon: "#e0e7ff", expr: "smile" } })}`;
  },
});

// 13 — Cygnets in a row (close-up of the famous cygnet line)
SCENES.push({
  n: 13, title: "Cygnets in a row",
  defs: () => `${cardBgDef("13", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-13", "#f8fafc", "#cbd5e1")}`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <path d="M22 220 Q120 215 218 220 L218 250 L22 250 Z" fill="#1e3a8a" opacity="0.7"/>
    <g opacity="0.6">
      <g transform="translate(58 178) scale(0.8)">${FOOT_SHADOW}${legs("relevé")}${torso({ tutu: "url(#tutu-13)", bodice: "#f1f5f9", accent: "#bfdbfe" })}${arms("cygnets")}${head({ rotate: 6, ribbon: "#e0e7ff", expr: "smile" })}</g>
      <g transform="translate(180 178) scale(0.8)">${FOOT_SHADOW}${legs("relevé")}${torso({ tutu: "url(#tutu-13)", bodice: "#f1f5f9", accent: "#bfdbfe" })}${arms("cygnets")}${head({ rotate: -6, ribbon: "#e0e7ff", expr: "smile" })}</g>
    </g>
    ${dancer({ x: 120, y: 178, legs: "relevé", arms: "cygnets", torso: { tutu: "url(#tutu-13)", bodice: "#f1f5f9", accent: "#bfdbfe" }, head: { rotate: 0, ribbon: "#e0e7ff", expr: "smile" } })}`,
});

// 14 — Dawn returns — Odette must go
SCENES.push({
  n: 14, title: "Dawn returns — Odette must go",
  defs: () => `${cardBgDef("14", "#fed7aa", "#f9a8c1")}
    ${tutuDef("tutu-14", "#f8fafc", "#cbd5e1")}
    <linearGradient id="sky-14" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f9a8c1"/><stop offset="50%" stop-color="#fbcfe8"/><stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="url(#sky-14)"/>
    <circle cx="180" cy="100" r="20" fill="#fef3c7" opacity="0.9"/>
    <path d="M22 215 Q120 210 218 215 L218 250 L22 250 Z" fill="#7c4d6f" opacity="0.7"/>
    <g stroke="#a44a4a" stroke-width="0.4" opacity="0.4" fill="none">
      <path d="M40 225 Q80 222 120 225"/><path d="M130 230 Q170 228 210 230"/>
    </g>
    ${dancer({ x: 120, y: 168, legs: "arabesque", arms: "reaching_back", torso: { tutu: "url(#tutu-14)", bodice: "#f1f5f9", accent: "#bfdbfe" }, head: { rotate: 12, ribbon: "#fbcfe8", expr: "sad" } })}`,
});

// 15 — Roses on the palace floor
SCENES.push({
  n: 15, title: "Roses on the palace floor",
  defs: () => `${cardBgDef("15", "#fef3e2", "#f0c98a")}
    ${tutuDef("tutu-15", "#fdf3c4", "#f5cf78")}`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#3b1f0d"/>
    <rect x="22" y="225" width="196" height="25" fill="#5b3013"/>
    <g stroke="#c9924d" stroke-width="0.4" opacity="0.5"><path d="M22 235 L218 235"/></g>
    <g fill="#5b3013" opacity="0.6"><rect x="30" y="60" width="40" height="180"/><rect x="170" y="60" width="40" height="180"/></g>
    <g fill="#fcd34d" opacity="0.6"><circle cx="50" cy="90" r="6"/><circle cx="190" cy="90" r="6"/></g>
    <g>
      <circle cx="70" cy="230" r="3" fill="#b91c1c"/><circle cx="100" cy="240" r="3" fill="#b91c1c"/>
      <circle cx="155" cy="232" r="3" fill="#b91c1c"/><circle cx="180" cy="240" r="3" fill="#b91c1c"/>
      <path d="M68 232 L62 244 M100 242 L94 252 M153 234 L147 246 M178 242 L172 252" stroke="#1e3a2e" stroke-width="0.7"/>
    </g>
    ${dancer({ x: 120, y: 168, legs: "kneeling", arms: "looking_down", torso: { tutu: "url(#tutu-15)", accent: "#d4a017" }, head: { rotate: 18, ribbon: "#fdf3c4", expr: "soft" } })}
    <circle cx="124" cy="234" r="3" fill="#b91c1c"/>`,
});

// 16 — The grand ball begins
SCENES.push({
  n: 16, title: "The grand ball begins",
  defs: () => `${cardBgDef("16", "#fef3e2", "#f0c98a")}
    ${tutuDef("tutu-16", "#fdf3c4", "#f5cf78")}
    <radialGradient id="light-16" cx="0.5" cy="0.2" r="0.7">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.6"/><stop offset="100%" stop-color="#fef3c7" stop-opacity="0"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#3b1f0d"/>
    <rect x="22" y="50" width="196" height="200" fill="url(#light-16)"/>
    <rect x="22" y="225" width="196" height="25" fill="#5b3013"/>
    <g stroke="#c9924d" stroke-width="0.3" opacity="0.6">
      <path d="M22 235 L218 235"/><path d="M22 245 L218 245"/>
      <line x1="60" y1="225" x2="60" y2="250"/><line x1="120" y1="225" x2="120" y2="250"/><line x1="180" y1="225" x2="180" y2="250"/>
    </g>
    <g fill="#5b3013" opacity="0.7"><rect x="40" y="60" width="30" height="170"/><rect x="170" y="60" width="30" height="170"/></g>
    <g fill="#d4a017" opacity="0.7">
      <ellipse cx="120" cy="70" rx="20" ry="8"/>
      <circle cx="105" cy="68" r="1.5"/><circle cx="120" cy="64" r="1.5"/><circle cx="135" cy="68" r="1.5"/>
    </g>
    <g fill="#fef3c7" opacity="0.7"><circle cx="105" cy="68" r="1.2"/><circle cx="120" cy="64" r="1.2"/><circle cx="135" cy="68" r="1.2"/></g>
    ${dancer({ x: 120, y: 168, legs: "tendu_devant", arms: "second", torso: { tutu: "url(#tutu-16)", accent: "#d4a017" }, head: { rotate: -4, ribbon: "#fdf3c4", expr: "smile" } })}`,
});

// 17 — Mysterious guests arrive
SCENES.push({
  n: 17, title: "Mysterious guests arrive",
  defs: () => `${cardBgDef("17", "#451a03", "#1c1410")}
    ${tutuDef("tutu-17", "#fdf3c4", "#f5cf78")}`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#2a1308"/>
    <rect x="22" y="225" width="196" height="25" fill="#5b3013"/>
    <g fill="#5b3013" opacity="0.7"><rect x="30" y="60" width="32" height="170"/><rect x="180" y="60" width="32" height="170"/></g>
    <g fill="#0a0606" opacity="0.95">
      <path d="M170 250 L170 175 C170 165 178 158 188 158 C198 158 206 165 206 175 L206 250 Z"/>
      <ellipse cx="188" cy="158" rx="9" ry="11"/>
      <path d="M179 152 C179 138 188 132 188 132 C188 132 197 138 197 152 Z" fill="#0a0606"/>
    </g>
    <g fill="#dc2626"><circle cx="186" cy="156" r="0.8"/><circle cx="190" cy="156" r="0.8"/></g>
    ${dancer({ x: 100, y: 168, legs: "tendu_devant", arms: "first", torso: { tutu: "url(#tutu-17)", accent: "#d4a017" }, head: { rotate: 30, ribbon: "#fdf3c4", expr: "awe" } })}`,
});

// 18 — Odile dances in disguise
SCENES.push({
  n: 18, title: "Odile dances in disguise",
  defs: () => `${cardBgDef("18", "#0f0a18", "#1e1b4b")}
    ${tutuDef("tutu-18", "#1c1410", "#0a0606")}
    <radialGradient id="spot-18" cx="0.5" cy="0.2" r="0.6">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.8"/><stop offset="100%" stop-color="#fef3c7" stop-opacity="0"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#0f0a18"/>
    <rect x="22" y="50" width="196" height="200" fill="url(#spot-18)"/>
    <ellipse cx="120" cy="240" rx="56" ry="14" fill="#fef3c7" fill-opacity="0.15"/>
    <rect x="22" y="232" width="196" height="18" fill="#1c1410"/>
    ${dancer({ x: 120, y: 168, legs: "attitude_derriere_low", arms: "dramatic_back", torso: { tutu: "url(#tutu-18)", bodice: "#0a0606", accent: "#dc2626", trim: "#dc2626" }, head: { rotate: -16, ribbon: "#dc2626", expr: "smile" } })}
    <g fill="#dc2626" opacity="0.8"><circle cx="120" cy="139" r="0.8"/></g>`,
});

// 19 — 32 fouettés
SCENES.push({
  n: 19, title: "32 fouettés",
  defs: () => `${cardBgDef("19", "#0f0a18", "#1e1b4b")}
    ${tutuDef("tutu-19", "#1c1410", "#0a0606")}
    <radialGradient id="spot-19" cx="0.5" cy="0.5" r="0.6">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.8"/><stop offset="100%" stop-color="#fef3c7" stop-opacity="0"/>
    </radialGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#0f0a18"/>
    <rect x="22" y="50" width="196" height="200" fill="url(#spot-19)"/>
    <g stroke="#fef3c7" stroke-width="0.4" fill="none" opacity="0.35">
      <ellipse cx="120" cy="190" rx="50" ry="14"/><ellipse cx="120" cy="190" rx="40" ry="10"/>
    </g>
    <ellipse cx="120" cy="240" rx="56" ry="14" fill="#fef3c7" fill-opacity="0.15"/>
    <rect x="22" y="232" width="196" height="18" fill="#1c1410"/>
    ${dancer({ x: 120, y: 168, legs: "fouette", arms: "second", torso: { tutu: "url(#tutu-19)", bodice: "#0a0606", accent: "#dc2626", trim: "#dc2626" }, head: { rotate: -8, ribbon: "#dc2626", expr: "smile" } })}
    <g stroke="#fef3c7" stroke-width="0.5" fill="none" opacity="0.4">
      <path d="M70 168 Q100 172 130 168"/><path d="M170 168 Q140 172 110 168"/>
    </g>`,
});

// 20 — Siegfried realizes the trick
SCENES.push({
  n: 20, title: "Siegfried realizes the trick",
  defs: () => `${cardBgDef("20", "#451a03", "#1c1410")}
    ${tutuDef("tutu-20", "#fdf3c4", "#f5cf78")}`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#2a1308"/>
    <rect x="22" y="225" width="196" height="25" fill="#5b3013"/>
    <g fill="#5b3013" opacity="0.6"><rect x="40" y="60" width="40" height="170"/><rect x="160" y="60" width="40" height="170"/></g>
    <g fill="#d4a017" opacity="0.4"><circle cx="60" cy="100" r="5"/><circle cx="180" cy="100" r="5"/></g>
    ${dancer({ x: 120, y: 168, legs: "b_plus", arms: "hands_to_face", torso: { tutu: "url(#tutu-20)", accent: "#d4a017" }, head: { rotate: 6, ribbon: "#fdf3c4", expr: "sad" } })}`,
});

// 21 — He races back to the lake
SCENES.push({
  n: 21, title: "He races back to the lake",
  defs: () => `${cardBgDef("21", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-21", "#f8fafc", "#cbd5e1")}`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <g fill="#0a0606" opacity="0.9">
      <ellipse cx="60" cy="120" rx="40" ry="60"/>
      <ellipse cx="190" cy="120" rx="40" ry="60"/>
    </g>
    <g stroke="#fef3c7" stroke-width="0.3" opacity="0.6" fill="none">
      <path d="M100 60 L110 80"/><path d="M140 65 L150 85"/>
    </g>
    <rect x="22" y="220" width="196" height="30" fill="#0f172a"/>
    <g stroke="#475569" stroke-width="0.4" opacity="0.5"><path d="M30 232 L60 232 M80 234 L120 234 M140 232 L170 232 M190 234 L210 234"/></g>
    ${dancer({ x: 120, y: 168, legs: "running", arms: "reaching_back", torso: { tutu: "url(#tutu-21)", bodice: "#f1f5f9", accent: "#bfdbfe" }, head: { rotate: -20, ribbon: "#bfdbfe", expr: "serious" } })}`,
});

// 22 — A storm breaks over the water
SCENES.push({
  n: 22, title: "A storm breaks over the water",
  defs: () => `${cardBgDef("22", "#1e293b", "#0f172a")}
    ${tutuDef("tutu-22", "#f8fafc", "#cbd5e1")}`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="#1e293b"/>
    <g fill="#0a0606" opacity="0.95"><path d="M22 50 L218 50 L218 120 C180 110 150 130 120 120 C90 110 60 130 22 120 Z"/></g>
    <g fill="#0a0606" opacity="0.75"><path d="M22 110 C60 105 80 130 130 115 C170 105 200 130 218 115 L218 140 L22 140 Z"/></g>
    <path d="M120 110 L115 140 L122 130 L116 165" stroke="#fef3c7" stroke-width="1.5" fill="none"/>
    <path d="M120 110 L115 140 L122 130 L116 165" stroke="#fef3c7" stroke-width="3" fill="none" opacity="0.3"/>
    <path d="M22 195 Q60 200 90 195 Q130 188 170 198 Q200 205 218 200 L218 250 L22 250 Z" fill="#1e3a8a" opacity="0.7"/>
    <g stroke="#7eb6d9" stroke-width="0.5" fill="none" opacity="0.6">
      <path d="M22 210 Q60 205 100 210 Q140 215 218 210"/>
      <path d="M22 220 Q70 215 130 220 Q180 225 218 220"/>
    </g>
    ${dancer({ x: 120, y: 168, legs: "arabesque", arms: "open_v_up", torso: { tutu: "url(#tutu-22)", bodice: "#f1f5f9", accent: "#bfdbfe" }, head: { rotate: -22, ribbon: "#bfdbfe", expr: "serious" } })}`,
});

// 23 — Love endures
SCENES.push({
  n: 23, title: "Love endures",
  defs: () => `${cardBgDef("23", "#fed7aa", "#fbcfe8")}
    ${tutuDef("tutu-23", "#fdf3c4", "#f5cf78")}
    <linearGradient id="sky-23" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fed7aa"/><stop offset="50%" stop-color="#fbcfe8"/><stop offset="100%" stop-color="#fdf3c4"/>
    </linearGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="url(#sky-23)"/>
    <circle cx="120" cy="120" r="26" fill="#fef3c7" opacity="0.9"/>
    <circle cx="120" cy="120" r="40" fill="#fef3c7" opacity="0.3"/>
    <path d="M22 215 Q120 210 218 215 L218 250 L22 250 Z" fill="#7c4d6f" opacity="0.7"/>
    <g fill="#2d2218" opacity="0.95">
      <path d="M148 250 L144 200 L152 200 Z"/>
      <ellipse cx="148" cy="200" rx="14" ry="12"/>
      <path d="M148 188 L148 170" stroke="#2d2218" stroke-width="3"/>
      <ellipse cx="148" cy="167" rx="6" ry="7"/>
      <path d="M142 188 L130 196" stroke="#2d2218" stroke-width="3" stroke-linecap="round"/>
      <path d="M154 188 L168 184" stroke="#2d2218" stroke-width="3" stroke-linecap="round"/>
    </g>
    ${dancer({ x: 100, y: 168, legs: "tendu_devant", arms: "embrace", torso: { tutu: "url(#tutu-23)", accent: "#d4a017" }, head: { rotate: 18, ribbon: "#fdf3c4", expr: "soft" } })}`,
});

// 24 — The swans take flight at dawn
SCENES.push({
  n: 24, title: "The swans take flight at dawn",
  defs: () => `${cardBgDef("24", "#fed7aa", "#fbcfe8")}
    ${tutuDef("tutu-24", "#fdf3c4", "#f5cf78")}
    <linearGradient id="sky-24" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbcfe8"/><stop offset="50%" stop-color="#fed7aa"/><stop offset="100%" stop-color="#fdf3c4"/>
    </linearGradient>`,
  body: () => `<rect x="22" y="50" width="196" height="200" fill="url(#sky-24)"/>
    <circle cx="180" cy="110" r="22" fill="#fef3c7" opacity="0.95"/>
    <circle cx="180" cy="110" r="36" fill="#fef3c7" opacity="0.3"/>
    <g fill="#f8fafc" opacity="0.9">
      <path d="M60 90 C66 86 74 84 80 90 C76 94 70 96 64 94 Z"/>
      <path d="M90 75 C96 71 104 69 110 75 C106 79 100 81 94 79 Z"/>
      <path d="M50 115 C56 111 64 109 70 115 C66 119 60 121 54 119 Z"/>
      <path d="M118 100 C124 96 132 94 138 100 C134 104 128 106 122 104 Z"/>
    </g>
    <path d="M22 215 Q120 210 218 215 L218 250 L22 250 Z" fill="#fcd34d" opacity="0.5"/>
    ${dancer({ x: 120, y: 168, legs: "attitude_croise_devant", arms: "open_v_up", torso: { tutu: "url(#tutu-24)", accent: "#d4a017" }, head: { rotate: -16, ribbon: "#fbcfe8", expr: "awe" } })}`,
});

// ---------- write files ----------

for (const scene of SCENES) {
  const num = String(scene.n).padStart(2, "0");
  const svg = card({ n: scene.n, title: scene.title, defs: scene.defs(), body: scene.body() });
  const file = path.join(OUT, `${num}.svg`);
  fs.writeFileSync(file, svg);
  console.log(`Wrote ${num}.svg (${scene.title})`);
}

console.log(`\nDone — ${SCENES.length} files written to ${OUT}`);
