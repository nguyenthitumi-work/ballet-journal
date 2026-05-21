'use client';

import { useState } from 'react';
import type { Class, ClassMember } from '@/lib/types';
import { createClassAction, generateClassCodeAction } from '../actions';

interface ClassPanelProps {
  classes: Class[];
  classMembers: Record<string, ClassMember[]>;
  userId: string;
}

export default function ClassPanel({ classes, classMembers, userId }: ClassPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;
    await createClassAction(newClassName.trim());
    setNewClassName('');
    setIsCreating(false);
  }

  async function handleGenerateCode(classId: string) {
    await generateClassCodeAction(classId);
  }

  return (
    <div className="flex flex-col gap-4">
      {classes.length === 0 && !isCreating && (
        <p className="text-sm text-violet-900/70">
          No classes yet. Create one to invite students or other teachers.
        </p>
      )}

      {classes.map((cls) => {
        const members = classMembers[cls.id] || [];
        return (
          <div key={cls.id} className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-violet-900">{cls.name}</h3>

            {cls.inviteCode && (
              <div className="mt-2 rounded bg-violet-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700">Invite Code</p>
                <p className="text-lg font-mono font-semibold text-violet-900">{cls.inviteCode}</p>
                <p className="text-xs text-violet-700 mt-1">
                  Share this code with students or teachers to join this class
                </p>
              </div>
            )}

            <div className="mt-2 flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.userId} className="text-sm text-violet-900/80">
                  <span className="font-medium capitalize">{m.role}</span> — User {m.userId.slice(0, 8)}
                </div>
              ))}
            </div>

            <div className="mt-3 border-t border-violet-100 pt-3">
              {!cls.inviteCode ? (
                <button
                  type="button"
                  onClick={() => handleGenerateCode(cls.id)}
                  className="px-4 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700"
                >
                  Generate Invite Code
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGenerateCode(cls.id)}
                  className="px-4 py-2 text-sm bg-violet-100 text-violet-700 rounded hover:bg-violet-200"
                >
                  Regenerate Code
                </button>
              )}
            </div>
          </div>
        );
      })}

      {isCreating ? (
        <form onSubmit={handleCreateClass} className="rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
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
              onClick={() => { setIsCreating(false); setNewClassName(''); }}
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
          + Create Class
        </button>
      )}
    </div>
  );
}
