import 'server-only';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  practiceNoteFromRow,
  type PracticeNote,
  type PracticeNoteRow,
} from '@/lib/types';

export async function createNote(opts: {
  authorUserId: string;
  sessionId?: string;
  attemptId?: string;
  body: string;
}): Promise<PracticeNote> {
  if (!opts.sessionId && !opts.attemptId) {
    throw new Error('Either sessionId or attemptId must be provided');
  }
  if (opts.sessionId && opts.attemptId) {
    throw new Error('Cannot attach note to both session and attempt');
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_note')
    .insert({
      author_user_id: opts.authorUserId,
      session_id: opts.sessionId ?? null,
      attempt_id: opts.attemptId ?? null,
      body: opts.body,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return practiceNoteFromRow(data as PracticeNoteRow);
}

export async function getNotesForSession(
  sessionId: string,
): Promise<PracticeNote[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_note')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data.map((r) => practiceNoteFromRow(r as PracticeNoteRow));
}

export async function getNotesForAttempt(
  attemptId: string,
): Promise<PracticeNote[]> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('practice_note')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data.map((r) => practiceNoteFromRow(r as PracticeNoteRow));
}

export async function deleteNote(
  noteId: string,
  authorUserId: string,
): Promise<void> {
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from('practice_note')
    .delete()
    .eq('id', noteId)
    .eq('author_user_id', authorUserId);
  if (error) throw new Error(error.message);
}
