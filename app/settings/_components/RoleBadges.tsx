import type { FamilyMember, ClassMember } from '@/lib/types';

interface RoleBadgesProps {
  familyMemberships: FamilyMember[];
  classMemberships: ClassMember[];
}

export function RoleBadges({ familyMemberships, classMemberships }: RoleBadgesProps) {
  const roles = new Set<string>();

  for (const fm of familyMemberships) {
    if (fm.role === 'dancer') roles.add('Dancer');
    if (fm.role === 'parent') roles.add('Parent');
  }

  for (const cm of classMemberships) {
    if (cm.role === 'student') roles.add('Student');
    if (cm.role === 'teacher') roles.add('Teacher');
  }

  if (roles.size === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
          Individual Account
        </span>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    Dancer: 'bg-pink-100 text-pink-700',
    Student: 'bg-blue-100 text-blue-700',
    Parent: 'bg-green-100 text-green-700',
    Teacher: 'bg-purple-100 text-purple-700',
  };

  const roleIcons: Record<string, string> = {
    Dancer: '🩰',
    Student: '🎓',
    Parent: '👨‍👩‍👧',
    Teacher: '👩‍🏫',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-violet-900/60">Your roles:</span>
      {Array.from(roles).map((role) => (
        <span
          key={role}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${roleColors[role] || 'bg-violet-100 text-violet-700'}`}
        >
          <span aria-hidden>{roleIcons[role]}</span>
          {role}
        </span>
      ))}
    </div>
  );
}
