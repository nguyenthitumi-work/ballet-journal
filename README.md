# Ballet Journal

A tiny Next.js web app for tracking a young dancer's ballet progress.
Built for one specific 10-year-old first, then generalizable later.

## What's in v1

- Onboarding flow (name, age, level)
- Browse 33 seeded skills across Barre / Center / Jumps / Turns / Stretches / Conditioning
- Mark skills as "currently working on"
- Run a structured practice session: cycle through chosen skills, rate each, note each, star milestones
- Optional per-skill video recording (camera + optional mic). Clips upload in the
  background to a private Supabase Storage bucket and play back from History via
  5-minute signed URLs. Settings shows total usage and lets you bulk-delete.
- Streak counter (soft, no shaming), history view, settings
- 4 built-in practice plans: Quick Barre, Stretch & Strengthen, Center Practice, Jumps & Turns
- Side-by-side compare of two of your own attempts on each skill's history page
  (tick two attempts to see them in a Before · After grid with media and notes)
- Compare any recorded attempt against the skill's YouTube reference video.
  Shared Play / Pause / Restart for both clips and a 0.5× / 0.75× / 1× speed
  selector. Optional skeleton overlay on your own clip (the YouTube side
  can't be overlaid — cross-origin iframe + ToS).
- Daily "Today's practice" suggestion that weights focus skills and stale skills,
  with a soft per-day-of-week theme (Mon Barre · Tue Center · Wed Jumps+Turns ·
  Thu Stretches+Conditioning · Fri Focus · Sat Full mix · Sun Stretches)
- Optional pose skeleton overlay on History playback. Toggle "Show skeleton" on
  any recorded clip and MediaPipe Pose Landmarker (Apache 2.0, runs locally in the
  browser, Lite model) draws 33-point body landmarks on top of the video. No
  corrections, no scoring — just a "see your own lines" tool. Model downloads
  lazily the first time the toggle is enabled.

## What's stubbed (intentionally)

- **Pose corrections / classification.** Phase 1 ships landmarks only. Naming
  poses (plié vs. tendu) and per-joint corrections ("lift elbow higher") are
  deferred — they need labeled reference data tuned to a young dancer's
  proportions, not just more code.

## Stack

- **Next.js 16** (App Router, async request APIs, Turbopack default)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase Postgres** (free tier) for journal data
- **Supabase Storage** (free tier, 1 GB) for practice videos. Private bucket; objects
  scoped to the user's UUID folder via storage RLS; playback via short-lived signed URLs.
- **Supabase Auth** — magic link sign-in. Each user has their own profile/skills/history
  scoped by `user_id`. RLS enforces per-user isolation in the database.
- **Vercel** for hosting (free tier, deploys on git push)

## Setup

### 1. Create a Supabase project

1. Go to https://supabase.com → New Project (free tier).
2. Wait for it to provision (~1 min).
3. Project Settings → API → copy the **Project URL** and **anon public** key.

### 2. Run the migrations

Apply every file under `supabase/migrations/` in chronological order via the SQL Editor:

1. `20260515000000_initial.sql` — base schema (tables, indexes, triggers, seeded categories).
2. `20260516000000_add_skill_reference_url.sql` — adds the YouTube reference URL column.
3. `20260517000000_add_auth.sql` — adds `user_id` columns and RLS for Supabase Auth.
4. `20260517010000_add_skill_trains.sql` — adds the `trains` array column on skills.
5. `20260517020000_add_skill_reference_url_suggested.sql` — adds the suggested-URL columns.
6. `20260517030000_profile_date_of_birth.sql` — replaces `age` with `date_of_birth`.
7. `20260517040000_add_attempt_video.sql` — adds `video_path` + `video_size_bytes`
   on `skill_attempt`, creates the private `practice-videos` bucket, and adds
   storage RLS policies scoping objects to the user's UUID folder.

### 2.5. Configure Supabase Auth

1. https://supabase.com/dashboard/project/<your-project>/auth/providers → enable **Email**.
2. Turn off "Confirm email" (the emailed code is the verification — no separate step).
3. https://supabase.com/dashboard/project/<your-project>/auth/url-configuration:
   - **Site URL**: production URL (e.g. `https://ballet-journal-three.vercel.app`)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` and `<site-url>/auth/callback`
     (kept for future OAuth providers; the email flow does not use it.)
4. https://supabase.com/dashboard/project/<your-project>/auth/templates → edit the
   **Magic Link** template. Replace the body with a code-only version so corporate email
   scanners (Microsoft Safe Links, Gmail URL scanning, etc.) cannot pre-fetch and burn
   the OTP before the human clicks. Suggested body:

   ```html
   <h2>Your sign-in code</h2>
   <p>Use this code to sign in to Ballet Journal:</p>
   <p style="font-size: 24px; letter-spacing: 4px; font-weight: bold;">{{ .Token }}</p>
   <p>This code expires in 1 hour.</p>
   ```

Per-user data (skills, plans, profile) is seeded lazily by `lib/db/bootstrap.ts` on first
sign-in.

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
- Redirects to `/login` because no Supabase Auth session exists.
- Enter your email, then enter the verification code from your inbox.
- After verification, Supabase sets a session cookie and redirects to `/`.
- On first sign-in, `lib/db/bootstrap.ts` creates a `user_profile` row, seeds 33 skills + 4
  practice plans for that user.
- Redirects to `/onboarding` to fill in name/age/level.

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

**Note on multi-device usage.** Sign in with the same email on every device — Supabase Auth
sessions are bound to the email/user, not the device. The profile follows you.

## Project structure

```
ballet-journal/
├── app/
│   ├── layout.tsx              # root layout + NavBar (when signed in)
│   ├── page.tsx                # Today / Home tab
│   ├── login/                  # magic link sign-in page + actions
│   ├── auth/callback/          # OAuth code exchange route handler
│   ├── onboarding/             # first-sign-in onboarding flow
│   ├── skills/                 # browser + detail + mark-as-focus
│   ├── practice/               # plan list + the core practice loop
│   ├── history/                # past sessions, streak, calendar
│   └── settings/               # name/age/level, storage stats, reset
├── proxy.ts                    # Next 16 middleware: refresh session, gate auth
├── components/
│   └── NavBar.tsx
├── lib/
│   ├── types.ts                # camelCase domain types + snake_case row types + mappers
│   ├── auth.ts                 # getAuthUser / getAuthUserId helpers
│   ├── session.ts              # getSessionContext() — used at the top of every protected page
│   ├── data/                   # seedSkills.ts, seedPlans.ts
│   ├── services/               # streak.ts, suggestion.ts (pure functions)
│   ├── supabase/               # server.ts, middleware.ts
│   └── db/                     # bootstrap, profile, skills, sessions, plans
└── supabase/
    └── migrations/             # initial.sql, add_skill_reference_url.sql, add_auth.sql
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

user_profile (1 per user): name, age, level, streak, last_practice_date, user_id FK auth.users
```

## Design choices

**Why emailed-code auth (not magic link)?** No passwords means no password reset
flows, no "weak password" warnings, no credential leakage. Codes (typed by the human)
survive corporate email gateways like Microsoft Safe Links and Gmail URL scanning, which
silently pre-fetch links and burn single-use magic-link OTPs before the user clicks.
Supabase Auth is built into the stack already. Trade-off: free-tier Supabase caps emails
at 4/hour — fine for a personal/family app, painful at scale.

**Why Postgres + Supabase (not just IndexedDB)?** History survives a browser-data clear, and
the same data is reachable from iPad later (we'll add auth then if she has multiple devices).

**Why a soft streak counter?** She's 10. The streak is a gentle motivator, not a stress source.
Missing a day silently resets to 1, no "you broke your streak!" red alert.

**Why RLS now?** With magic-link auth in place, every query carries an `auth.uid()` claim.
RLS policies (`user_id = auth.uid()`) make sure one user can never see another user's rows
even if the app code is wrong — defense in depth at the database level.

## Roadmap (post-v1)

- Calendar grid view in History
- Phase-2 pose: one objective metric per skill (e.g. turnout angle, plié depth) shown as a number, not a critique
- iPad support if she wants it (would add Supabase Auth + RLS at that point)
