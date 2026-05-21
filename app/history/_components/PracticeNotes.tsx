'use client';

import { useState } from 'react';
import type { PracticeNote } from '@/lib/types';
import { addPracticeNoteAction } from '../actions';

interface PracticeNotesProps {
  notes: PracticeNote[];
  sessionId?: string;
  attemptId?: string;
  canAddNote: boolean;
  authorNames: Record<string, string>;
}

export function PracticeNotes({
  notes,
  sessionId,
  attemptId,
  canAddNote,
  authorNames,
}: PracticeNotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addPracticeNoteAction({
        sessionId,
        attemptId,
        body: noteBody.trim(),
      });
      setNoteBody('');
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatNoteDate(iso: string): string {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  }

  if (notes.length === 0 && !canAddNote) return null;

  return (
    <div className="rounded-xl bg-amber-50/50 border border-amber-200/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70 mb-2">
        {notes.length === 0 ? 'Notes' : `Notes (${notes.length})`}
      </p>

      {notes.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg bg-white border border-amber-100 p-2">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-amber-900">
                  {authorNames[note.authorUserId] || 'Unknown'}
                </span>
                <span className="text-xs text-amber-900/60">
                  {formatNoteDate(note.createdAt)}
                </span>
              </div>
              <p className="text-sm text-amber-900/90 whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
        </div>
      )}

      {canAddNote && (
        <>
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-xs text-amber-700 hover:text-amber-900 font-medium"
            >
              + Add note
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a note for this practice..."
                className="text-sm border border-amber-200 rounded-lg p-2 min-h-[60px] resize-y"
                autoFocus
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!noteBody.trim() || isSubmitting}
                  className="px-3 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNoteBody('');
                  }}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
