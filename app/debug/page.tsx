import { getAuthUserId } from '@/lib/auth';
import { getViewableDancers } from '@/lib/db/families';
import { getServerSupabase } from '@/lib/supabase/server';

export default async function DebugPage() {
  const userId = await getAuthUserId();
  const dancers = await getViewableDancers(userId);

  const supabase = await getServerSupabase();

  // Check what families this user is in
  const { data: myFamilies } = await supabase
    .from('family_member')
    .select('family_id, role')
    .eq('user_id', userId);

  // Check all family members in those families
  const familyIds = myFamilies?.map(f => f.family_id) || [];
  const { data: allMembers } = await supabase
    .from('family_member')
    .select('family_id, user_id, role')
    .in('family_id', familyIds);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Current User ID:</h2>
        <code className="bg-gray-100 p-2 block">{userId}</code>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">My Family Memberships:</h2>
        <pre className="bg-gray-100 p-4 overflow-auto">
          {JSON.stringify(myFamilies, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All Members in My Families:</h2>
        <pre className="bg-gray-100 p-4 overflow-auto">
          {JSON.stringify(allMembers, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Viewable Dancers (result):</h2>
        <pre className="bg-gray-100 p-4 overflow-auto">
          {JSON.stringify(dancers, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Should Show Dropdown?</h2>
        <p className="text-lg">
          {dancers.length > 1 ? '✅ YES (more than 1 dancer)' : '❌ NO (only 1 or 0 dancers)'}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Dropdown only shows if dancers.length &gt; 1
        </p>
      </div>
    </div>
  );
}
