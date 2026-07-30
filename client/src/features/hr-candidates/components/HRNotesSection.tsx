'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Send, Pencil, X, Check } from 'lucide-react';
import type { HrNote } from '@/src/api/types';

interface HRNotesSectionProps {
  applicationId: string;
}

export function HRNotesSection({ applicationId }: HRNotesSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const notesKey = ['hr-notes', applicationId];

  const { data: notesRes, isLoading, isError, refetch } = useQuery({
    queryKey: notesKey,
    queryFn: () => applicationsApi.getNotes(applicationId),
    enabled: !!applicationId,
  });

  const notes = notesRes?.data || [];

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => applicationsApi.createNote({ applicationId, note }),
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: notesKey });
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || 'Could not post the note.'),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      applicationsApi.updateNote(id, note),
    // Optimistic: swap the text in place, roll back if the server rejects.
    onMutate: async ({ id, note }) => {
      await queryClient.cancelQueries({ queryKey: notesKey });
      const previous = queryClient.getQueryData(notesKey);
      queryClient.setQueryData(notesKey, (old: any) =>
        old
          ? { ...old, data: old.data.map((n: HrNote) => (n.id === id ? { ...n, note } : n)) }
          : old
      );
      return { previous };
    },
    onError: (error: any, _vars, context: any) => {
      if (context?.previous) queryClient.setQueryData(notesKey, context.previous);
      toast.error(
        error?.response?.status === 403
          ? 'You can only edit your own notes.'
          : error?.response?.data?.message || 'Could not update the note.'
      );
    },
    onSuccess: () => {
      setEditingId(null);
      setEditValue('');
      toast.success('Note updated');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notesKey }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

  const startEdit = (note: HrNote) => {
    setEditingId(note.id);
    setEditValue(note.note);
  };

  // Mirrors the server rule: creator, or CAREER_ADMIN.
  const isAdmin = !!user?.permissions?.includes('CAREER_ADMIN');
  const canEdit = (note: HrNote) => note.hr?.id === user?.sub || isAdmin;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
        <MessageSquare className="h-4 w-4" /> Internal HR Notes
      </h3>

      {/* Note submission */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add an internal note about this candidate..."
          rows={3}
          disabled={addNoteMutation.isPending}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newNote.trim() || addNoteMutation.isPending}
            className="cursor-pointer"
          >
            {addNoteMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Post Note
          </Button>
        </div>
      </form>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-xs text-red-600 flex items-center justify-center gap-2 py-4">
          Could not load notes.
          <Button size="xs" variant="outline" onClick={() => refetch()} className="cursor-pointer">
            Retry
          </Button>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          No internal notes have been written yet.
        </p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-3 bg-neutral-50/50 text-sm">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1.5">
                <span className="font-semibold text-black truncate">
                  {note.hr?.fullName || 'HR Employee'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="whitespace-nowrap">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  {canEdit(note) && editingId !== note.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit note"
                      onClick={() => startEdit(note)}
                      className="h-6 w-6 cursor-pointer text-neutral-400 hover:text-black"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    disabled={updateNoteMutation.isPending}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      disabled={updateNoteMutation.isPending}
                      className="cursor-pointer"
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="xs"
                      onClick={() =>
                        updateNoteMutation.mutate({ id: note.id, note: editValue.trim() })
                      }
                      disabled={!editValue.trim() || updateNoteMutation.isPending}
                      className="cursor-pointer"
                    >
                      {updateNoteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-700 whitespace-pre-wrap">{note.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default HRNotesSection;
