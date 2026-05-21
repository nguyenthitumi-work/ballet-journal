import { getAuthUserId } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';

export default async function DebugNotesPage() {
  const userId = await getAuthUserId();
  const supabase = await getServerSupabase();

  // Get all practice notes
  const { data: allNotes, error: notesError } = await supabase
    .from('practice_note')
    .select('*')
    .order('created_at', { ascending: false });

  // Get all sessions for this user
  const { data: sessions, error: sessionsError } = await supabase
    .from('practice_session')
    .select('id, user_id, started_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(5);

  // Get user profiles for note authors
  const authorIds = Array.from(new Set(allNotes?.map(n => n.author_user_id) || []));
  const { data: profiles } = await supabase
    .from('user_profile')
    .select('user_id, name')
    .in('user_id', authorIds);

  const authorNames: Record<string, string> = {};
  profiles?.forEach(p => {
    authorNames[p.user_id] = p.name || 'Unknown';
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Notes Debug</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Current User:</h2>
        <code className="bg-gray-100 p-2 block">{userId}</code>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All Practice Notes (all users):</h2>
        {notesError && <p className="text-red-600">Error: {notesError.message}</p>}
        {allNotes && allNotes.length === 0 && <p>No notes found in database</p>}
        <pre className="bg-gray-100 p-4 overflow-auto text-xs">
          {JSON.stringify(allNotes, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Recent Sessions (for this user):</h2>
        {sessionsError && <p className="text-red-600">Error: {sessionsError.message}</p>}
        <pre className="bg-gray-100 p-4 overflow-auto text-xs">
          {JSON.stringify(sessions, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Author Names:</h2>
        <pre className="bg-gray-100 p-4 overflow-auto text-xs">
          {JSON.stringify(authorNames, null, 2)}
        </pre>
      </div>
    </div>
  );
}
