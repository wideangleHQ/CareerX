'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star, ThumbsUp } from 'lucide-react';

interface InterviewFeedbackFormProps {
  applicationId: string;
}

export function InterviewFeedbackForm({ applicationId }: InterviewFeedbackFormProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [hoverRating, setHoverRating] = useState<number>(0);

  const { data: feedbackRes, isLoading } = useQuery({
    queryKey: ['interview-feedback', applicationId],
    queryFn: () => applicationsApi.getFeedback({ applicationId }),
    enabled: !!applicationId,
  });

  const feedbacks = feedbackRes?.data || [];

  const addFeedbackMutation = useMutation({
    mutationFn: (payload: { rating: number; notes: string }) =>
      applicationsApi.createFeedback({ applicationId, ...payload }),
    onSuccess: () => {
      setRating(0);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['interview-feedback', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application-details', applicationId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !notes.trim()) return;
    addFeedbackMutation.mutate({ rating, notes: notes.trim() });
  };

  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
        <ThumbsUp className="h-4 w-4" /> Interview Feedback & Evaluation
      </h3>

      {/* Evaluation Input */}
      <form onSubmit={handleSubmit} className="space-y-3 border rounded-xl p-4 bg-white shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-neutral-500 mr-2">Candidate Rating:</span>
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = (hoverRating || rating) >= star;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="text-neutral-300 hover:text-amber-400 focus:outline-none transition-colors cursor-pointer"
              >
                <Star
                  className={cn(
                    "h-5 w-5 fill-current",
                    isActive ? "text-amber-400" : "text-neutral-200"
                  )}
                />
              </button>
            );
          })}
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write a detailed evaluation of candidate's technical skills, communication, and overall culture fit..."
          rows={3}
          disabled={addFeedbackMutation.isPending}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={rating === 0 || !notes.trim() || addFeedbackMutation.isPending}
            className="cursor-pointer font-semibold"
          >
            {addFeedbackMutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            )}
            Submit Evaluation
          </Button>
        </div>
      </form>

      {/* Feedbacks list */}
      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : feedbacks.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">
          No evaluations have been submitted yet.
        </p>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <div key={f.id} className="border rounded-lg p-4 bg-neutral-50/50 text-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-black">
                    {f.hr?.full_name || 'HR Interviewer'}
                  </span>
                  <div className="flex items-center gap-0.5 ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3.5 w-3.5 fill-current",
                          f.rating >= star ? "text-amber-500" : "text-neutral-200"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{f.notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline utility for cn import
import { cn } from '@/src/lib/utils';
export default InterviewFeedbackForm;
