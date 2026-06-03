'use client';

import { useState } from 'react';
import type { Family, FamilyMember } from '@/lib/types';
import { createFamilyAction, generateFamilyInviteCodeAction, deleteFamilyAction } from '../actions';

interface FamilyPanelProps {
  families: Family[];
  familyMembers: Record<string, FamilyMember[]>;
  inviteCodes: Record<string, string | null>;
  userId: string;
  discipline?: string;
}

export default function FamilyPanel({ families, familyMembers, inviteCodes, userId, discipline }: FamilyPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Record<string, 'parent' | 'dancer'>>({});

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    await createFamilyAction(newFamilyName.trim(), discipline);
    setNewFamilyName('');
    setIsCreating(false);
  }

  async function handleGenerateCode(familyId: string) {
    const role = selectedRole[familyId] || 'parent';
    await generateFamilyInviteCodeAction({ familyId, role });
  }

  async function handleDeleteFamily(familyId: string) {
    if (!confirm('Are you sure you want to delete this family? This will remove all members.')) {
      return;
    }
    await deleteFamilyAction(familyId);
  }

  return (
    <div className="flex flex-col gap-4">
      {families.length === 0 && !isCreating && (
        <p className="text-sm text-violet-900/70">
          No families yet. Create one to invite parents or add dancers.
        </p>
      )}

      {families.map((family) => {
        const members = familyMembers[family.id] || [];
        const inviteCode = inviteCodes[family.id];
        const role = selectedRole[family.id] || 'parent';
        const isCreator = family.createdBy === userId;

        return (
          <div key={family.id} className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-violet-900">{family.name}</h3>
              {isCreator && (
                <button
                  type="button"
                  onClick={() => handleDeleteFamily(family.id)}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Delete
                </button>
              )}
            </div>

            {inviteCode && (
              <div className="mt-2 rounded bg-violet-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700">Invite Code</p>
                <p className="text-lg font-mono font-semibold text-violet-900">{inviteCode}</p>
                <p className="text-xs text-violet-700 mt-1">
                  Share this code with someone to invite them as a {role}
                </p>
              </div>
            )}

            <div className="mt-2 flex flex-col gap-2">
              {members.length === 0 ? (
                <p className="text-sm text-violet-900/70">No members yet</p>
              ) : (
                members.map((m) => (
                  <div key={m.userId} className="text-sm text-violet-900/80">
                    <span className="font-medium capitalize">{m.role}</span> —{' '}
                    {m.userName || `User ${m.userId.slice(0, 8)}`}
                  </div>
                ))
              )}
            </div>

            {isCreator && (
              <div className="mt-3 border-t border-violet-100 pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700 mb-2">
                  Generate Invite Code
                </p>
                <div className="flex gap-2">
                  <select
                    value={role}
                    onChange={(e) => setSelectedRole((prev) => ({ ...prev, [family.id]: e.target.value as 'parent' | 'dancer' }))}
                    className="px-3 py-2 text-sm border border-violet-200 rounded"
                  >
                    <option value="parent">Parent</option>
                    <option value="dancer">Dancer</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleGenerateCode(family.id)}
                    className="px-4 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
                  >
                    Generate Code
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {isCreating ? (
        <form onSubmit={handleCreateFamily} className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Family name"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-violet-200 rounded mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setNewFamilyName(''); }}
              className="px-4 py-2 text-sm bg-violet-100 text-violet-700 rounded hover:bg-violet-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 self-start"
        >
          + Create Family
        </button>
      )}
    </div>
  );
}
