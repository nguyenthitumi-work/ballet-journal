import type { PracticeSession, Rating, Skill, SkillAttempt } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/types';
import AttemptVideo from './AttemptVideo';
import AttemptPhoto from './AttemptPhoto';

type Props = {
  session: PracticeSession;
  attempts: SkillAttempt[];
  skillsById: Map<string, Skill>;
};

const MOOD_EMOJI: Record<Rating, string> = {
  1: '😣',
  2: '😕',
  3: '🙂',
  4: '😊',
  5: '🤩',
};

const TZ = 'America/Los_Angeles';

function ymdInTz(d: Date, timeZone: string): string {
  // Returns YYYY-MM-DD in the given timezone for comparing calendar days.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${day}`;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();

  const todayYmd = ymdInTz(now, TZ);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayYmd = ymdInTz(yesterday, TZ);
  const dYmd = ymdInTz(d, TZ);

  if (dYmd === todayYmd) return 'Today';
  if (dYmd === yesterdayYmd) return 'Yesterday';

  const currentYear = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
  }).format(now);
  const dYear = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
  }).format(d);

  if (dYear === currentYear) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      month: 'short',
      day: 'numeric',
    }).format(d);
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function Stars({ rating }: { rating: Rating }) {
  return (
    <span aria-label={`${rating} of 5`} className="text-violet-600">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= rating ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

function firstLine(text: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const line = trimmed.split('\n')[0];
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

export function SessionCard({ session, attempts, skillsById }: Props) {
  const dateLabel = formatHistoryDate(session.startedAt);
  const durationLabel = formatDuration(session.durationSeconds ?? 0);
  const moodEmoji = session.moodRating ? MOOD_EMOJI[session.moodRating] : null;
  const notesPreview = firstLine(session.overallNotes);

  return (
    <details className="group rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <summary className="flex cursor-pointer list-none flex-col gap-2 marker:hidden [&::-webkit-details-marker]:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-violet-950">{dateLabel}</h2>
            {moodEmoji && (
              <span aria-label={`mood ${session.moodRating}`} className="text-xl">
                {moodEmoji}
              </span>
            )}
          </div>
          <span className="text-sm text-violet-900/60 transition group-open:rotate-180">▾</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-violet-900/70">
          <span>{durationLabel}</span>
          <span>
            {attempts.length} {attempts.length === 1 ? 'skill' : 'skills'}
          </span>
        </div>
        {notesPreview && (
          <p className="text-sm text-violet-900/80 italic">&ldquo;{notesPreview}&rdquo;</p>
        )}
      </summary>

      <div className="mt-4 flex flex-col gap-3 border-t border-violet-100 pt-4">
        {attempts.length === 0 ? (
          <p className="text-sm text-violet-900/60">No skills logged in this session.</p>
        ) : (
          attempts.map((attempt) => {
            const skill = skillsById.get(attempt.skillId);
            const skillName = skill?.name ?? 'Unknown skill';
            const categoryLabel = skill ? CATEGORY_LABELS[skill.categoryId] : null;
            return (
              <div
                key={attempt.id}
                className="rounded-xl border border-violet-100 bg-violet-50/50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-violet-950">{skillName}</span>
                    {categoryLabel && (
                      <span className="text-xs text-violet-900/60">{categoryLabel}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.isMilestone ? (
                      <span
                        aria-label="Milestone"
                        title="Milestone"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                      >
                        <span aria-hidden>⭐</span>
                        Milestone
                      </span>
                    ) : null}
                    <Stars rating={attempt.rating} />
                  </div>
                </div>
                {attempt.notes && attempt.notes.trim() && (
                  <p className="mt-2 text-sm text-violet-900/80">{attempt.notes}</p>
                )}
                {attempt.videoPath ? (
                  <AttemptVideo
                    attemptId={attempt.id}
                    videoPath={attempt.videoPath}
                  />
                ) : null}
                {attempt.photoPath ? (
                  <AttemptPhoto
                    attemptId={attempt.id}
                    photoPath={attempt.photoPath}
                  />
                ) : null}
              </div>
            );
          })
        )}
        {session.overallNotes && session.overallNotes.trim() && (
          <div className="rounded-xl bg-violet-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-900/60">
              Notes
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-violet-900/90">
              {session.overallNotes}
            </p>
          </div>
        )}
      </div>
    </details>
  );
}
