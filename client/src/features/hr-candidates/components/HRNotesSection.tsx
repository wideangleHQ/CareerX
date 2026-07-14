'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Send } from 'lucide-react';

interface HRNotesSectionProps {
  applicationId: string;
}

export function HRNotesSection({ applicationId }: HRNotesSectionProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');

  const { data: notesRes, isLoading } = useQuery({
    queryKey: ['hr-notes', applicationId],
    queryFn: () => applicationsApi.getNotes(applicationId),
    enabled: !!applicationId,
  });

  const notes = notesRes?.data || [];

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => applicationsApi.createNote({ applicationId, note }),
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['hr-notes', applicationId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

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
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">
          No internal notes have been written yet.
        </p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-3 bg-neutral-50/50 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-semibold text-black">
                  {note.hr?.full_name || 'HR Employee'}
                </span>
                <span>{new Date(note.created_at).toLocaleString()}</span>
              </div>
              <p className="text-neutral-700 whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default HRNotesSection;
