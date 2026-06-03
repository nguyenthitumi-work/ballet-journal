# Yoga module — phase status

The yoga discipline was built on top of the existing Ballet Journal app as a
shared multi-discipline platform (see `Yoga_Web_App_Plan.docx`). Ballet is
untouched as the default; yoga lives under `/yoga` and reuses the `lib/` core.

## Shipped

### Phase 1 — Walking skeleton
- `/yoga` asana library and `/yoga/flows`, per-user data via `lib/db/asanas.ts` /
  `lib/db/flows.ts`, gated on the session context.
- First-visit seeding (`lib/yoga/bootstrap.ts`): 12 starter asanas + 3 flows,
  idempotent and separate from the ballet bootstrap.
- Discipline switcher in the NavBar (`components/DisciplineSwitcher.tsx`).

### Phase 2 — Guided flow player
- `startFlow` creates a `practice_session` tagged `discipline = 'yoga'` and
  linked to the flow (`flow_id`), then opens `/yoga/play/[sessionId]`.
- `FlowPlayer` runs a per-pose countdown with breath cues and alignment cues;
  each completed hold is recorded as a `skill_attempt` (subject = `asana_id`).
- `finishFlowSession` closes the session, advances the streak, and runs reward
  unlocks — the same engine path ballet uses. Sessions land in History.
- Shared types extended for both subjects (`skill_id` XOR `asana_id`);
  History/Milestones/weekly-summary made yoga-safe.

### Phase 3 — Differentiators
- Per-pose 1–5 "how did it feel" rating in the player.
- Optional per-pose video recording (reuses the ballet `VideoRecorder` +
  Supabase Storage); clips attach to the pose's attempt and replay in History
  with the MediaPipe skeleton overlay (`AttemptVideo` / `PoseOverlay`).
- `/yoga/progress` dashboard: flows completed, total minutes, day streak,
  14-day activity, most-practiced poses.

### Phase 4 — Personalization & habit
- Custom flow builder at `/yoga/flows/new` (`FlowBuilder` + `createFlowAction`):
  add/reorder/remove poses, set hold seconds, side, and breath cue; saved as a
  user flow.
- Adaptive "Today's flow" card on `/yoga` (`lib/yoga/suggestion.ts`), picked by
  a gentle per-weekday style theme.

### Phase 5 — Reach & polish (web-feasible parts)
- Installable PWA: web app manifest (`app/manifest.ts`), icon (`public/icon.svg`),
  and a conservative service worker (`public/sw.js`) registered in production
  (`components/ServiceWorkerRegister.tsx`). The SW is **network-first for
  navigations** — online behavior and Supabase auth are never bypassed — and
  adds an offline fallback (`public/offline.html`) plus stale-while-revalidate
  for hashed static assets.

## Not built — needs infrastructure outside a web app

These Phase 5 items were intentionally **not** implemented because they require
capabilities a web app sandbox can't provide on its own. They are documented
here rather than stubbed with non-functional code:

- **Apple Health / Google Fit sync** — needs native platform APIs (HealthKit /
  Health Connect), typically via a native or wrapped app, plus OAuth/native
  permissions. Not available to a pure web client.
- **TV casting (Chromecast / AirPlay)** — depends on the Google Cast SDK /
  AirPlay, device discovery, and (for real value) actual class video to cast.
- **Reminders / push notifications** — needs Web Push (VAPID keys, a push
  service, and a notification permission flow) or native notifications. The SW
  scaffold is in place to add Web Push later. In the meantime, a daily nudge can
  be set up as a scheduled task in Cowork.
- **Pricing / subscriptions** — needs a payment provider (e.g. Stripe), billing
  webhooks, and entitlement gating; a product/business decision more than a code
  task.

## Gym discipline (full parity with yoga)

A third discipline, gym (strength training), was added on the same shared
platform. Ballet and yoga are untouched; gym lives under `/gym`.

- **Model:** `exercise` (analog of asana) and `workout` (analog of flow), but a
  workout step carries set/rep/weight/rest targets. The defining difference —
  **sets × reps × weight** — is stored by adding `reps` + `weight` columns to
  `skill_attempt` and logging one row per set (`exercise_id`).
- **Logging player:** `/gym/play/[sessionId]` (`GymLogger`) lets you log each set
  (reps + weight) with rest timers between sets and a running volume total; the
  session lands in History and advances the streak via the shared engine.
- **Parity features:** exercise library + workouts (`/gym`, `/gym/workouts`),
  custom workout builder (`/gym/workouts/new`), adaptive "Today's workout"
  (Push/Pull/Legs split), progress dashboard (`/gym/progress`: workouts, sets,
  total volume, streak, 14-day activity, most-trained lifts), and the **Gym**
  entry in the discipline switcher. History renders each set as
  `reps × weight` under the exercise name.
- **Shared types** extended again: `Discipline` adds `'gym'`; sessions gain
  `workoutId`; attempts gain `exerciseId` / `reps` / `weight`. The attempt
  subject constraint is now "exactly one of skill / asana / exercise."

## Migration notes

Both migrations are additive; apply them in order before running against a live
database:

1. `supabase/migrations/20260602010000_add_yoga.sql` — asana, yoga_flow,
   `discipline` + `flow_id` on sessions, `asana_id` on attempts.
2. `supabase/migrations/20260602020000_add_gym.sql` — exercise, workout,
   `workout_id` on sessions, `exercise_id` + `reps` + `weight` on attempts,
   `discipline` extended to include `'gym'`, and the three-way subject CHECK.
