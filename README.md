# Ballet Journal

A tiny Next.js web app for tracking a young dancer's ballet progress.
Built for one specific 10-year-old first, then generalizable later.

## What's in v1

- Onboarding flow (name, age, level)
- Browse 33 seeded skills across Barre / Center / Jumps / Turns / Stretches / Conditioning
- Mark skills as "currently working on"
- Run a structured practice session: cycle through chosen skills, rate each, note each, star milestones
- Streak counter (soft, no shaming), history view, settings
- 4 built-in practice plans: Quick Barre, Stretch & Strengthen, Center Practice, Jumps & Turns
- Daily "Today's practice" suggestion that weights focus skills and stale skills

## What's stubbed (intentionally)

- **Video recording.** Web supports `MediaRecorder` natively but v1 keeps the loop journal-only.
  Lands later via IndexedDB-local storage so a child's video never leaves the device.
- **Pose detection.** Lands later via MediaPipe (Apache 2.0, client-side) once the journaling habit is set.

## Stack

- **Next.js 16** (App Router, async request APIs, Turbopack default)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase Postgres** (free tier) for journal data
- **No auth.** Data is scoped by a `device_id` HttpOnly cookie set on first visit. Anyone with
  physical device access can see her journal — that's the threat model for a personal app.
- **Vercel** for hosting (free tier, deploys on git push)

## Setup

### 1. Create a Supabase project

1. Go to https://supabase.com → New Project (free tier).
2. Wait for it to provision (~1 min).
3. Project Settings → API → copy the **Project URL** and **anon public** key.

### 2. Run the migration

Open the Supabase SQL Editor and paste the contents of
`supabase/migrations/20260515000000_initial.sql`. Run it. This creates all tables, indexes,
triggers, and seeds the 6 skill categories.

Per-device data (skills, plans, profile) is seeded lazily by `lib/db/bootstrap.ts` the first
time a new device hits the app.

### 3. Configure env vars

```bash
cp .env.local.example .env.local
# fill in your project URL + anon key
```

### 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The first visit:
- Sets a `bj_device_id` HttpOnly cookie
- Creates a `user_profile` row for that device
- Seeds 33 skills + 4 practice plans for that device
- Redirects you to onboarding to fill in name/age/level

### 5. Deploy to Vercel

**Before first deploy:** apply every file under `supabase/migrations/` to your Supabase
project via the SQL editor. Vercel does **not** run migrations for you. Forgetting this
shows up as a PostgREST schema-cache error in the first prod request.

**Option A — GitHub import (recommended).**

1. Push this repo to GitHub.
2. https://vercel.com/new → Import the repo.
3. Add env vars in the import wizard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click Deploy. Every `git push` to `main` deploys automatically after this.

**Option B — CLI.**

```bash
npx vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

**Note on cross-device data.** Each origin (`localhost`, `192.168.1.x`, `*.vercel.app`)
gets its own `bj_device_id` cookie, so a fresh visit to the deployed URL starts a new
profile. To carry over your existing local profile, copy the `bj_device_id` cookie
value from `localhost` dev tools and set it on the deployed URL.

## Project structure

```
ballet-journal/
├── app/
│   ├── layout.tsx              # root layout + NavBar + session bootstrap
│   ├── page.tsx                # Today / Home tab
│   ├── globals.css
│   ├── onboarding/             # first-visit onboarding flow
│   ├── skills/                 # browser + detail + mark-as-focus
│   ├── practice/               # plan list + the core practice loop
│   ├── history/                # past sessions, streak, calendar
│   └── settings/               # name/age/level, storage stats, reset
├── components/
│   └── NavBar.tsx
├── lib/
│   ├── types.ts                # camelCase domain types + snake_case row types + mappers
│   ├── device.ts               # device_id cookie helpers
│   ├── session.ts              # getSessionContext() — used at the top of every route
│   ├── data/                   # seedSkills.ts, seedPlans.ts
│   ├── services/               # streak.ts, suggestion.ts (pure functions)
│   ├── supabase/               # server.ts, client.ts
│   └── db/                     # bootstrap, profile, skills, sessions, plans
└── supabase/
    └── migrations/
        └── 20260515000000_initial.sql
```

## Data model

```
skill_category (1) ── (many) skill
                                ├── is_currently_working_on: bool
                                └── attempts (many) skill_attempt
                                                        └── belongs to practice_session

practice_session ── (many) skill_attempt
                  └── mood_rating, duration, overall_notes

practice_plan → jsonb ordered list of skill IDs (4 seeded built-ins)

user_profile (1 per device): name, age, level, streak, last_practice_date, device_id PK
```

## Design choices

**Why no auth?** It's her phone. The device_id cookie scopes data; physical access is the only
authorization. Adding auth would add friction without adding meaningful security for a personal app.

**Why Postgres + Supabase (not just IndexedDB)?** History survives a browser-data clear, and
the same data is reachable from iPad later (we'll add auth then if she has multiple devices).

**Why a soft streak counter?** She's 10. The streak is a gentle motivator, not a stress source.
Missing a day silently resets to 1, no "you broke your streak!" red alert.

**Why no RLS?** No JWT, no auth, no session. The anon key is server-only (Next.js Route
Handlers and Server Actions), the browser never sees it directly, and every query is scoped by
`device_id` through `lib/db/*` helpers. RLS without an auth claim is theater.

## Roadmap (post-v1)

- Real video recording → IndexedDB locally (no upload, no privacy footprint)
- Side-by-side video compare
- Calendar grid view in History
- Smarter daily suggestion (per-day-of-week templates)
- Pose detection via MediaPipe — client-side, Apache 2.0, no AI license
- iPad support if she wants it (would add Supabase Auth + RLS at that point)
