import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '@/src/api/timeline';
import { format } from 'date-fns';
import {
  FileSignature,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Eye,
  FileText,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimelineEventType } from '@/src/api/types';

interface OfferTimelineProps {
  applicationId: string;
}

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  OFFER_GENERATED: { icon: <FileSignature className="h-4 w-4" />, color: 'text-amber-600 bg-amber-100' },
  OFFER_RELEASED: { icon: <Send className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100' },
  OFFER_ACCEPTED: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
  OFFER_DECLINED: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-100' },
  APPLICATION_SUBMITTED: { icon: <FileText className="h-4 w-4" />, color: 'text-neutral-600 bg-neutral-100' },
  STATUS_CHANGED: { icon: <Clock className="h-4 w-4" />, color: 'text-neutral-600 bg-neutral-100' },
  INTERVIEW_SCHEDULED: { icon: <Clock className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100' },
  INTERVIEW_COMPLETED: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
  FEEDBACK_ADDED: { icon: <FileText className="h-4 w-4" />, color: 'text-neutral-600 bg-neutral-100' },
  DOCUMENT_UPLOADED: { icon: <FileText className="h-4 w-4" />, color: 'text-neutral-600 bg-neutral-100' },
};

export function OfferTimeline({ applicationId }: OfferTimelineProps) {
  const { data: res, isLoading } = useQuery({
    queryKey: ['timeline', 'application', applicationId],
    queryFn: () => timelineApi.getTimelineByApplication(applicationId),
    enabled: !!applicationId,
  });

  const events = res?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No timeline events yet.</p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200" />
      <div className="space-y-6">
        {events.map((event) => {
          const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.STATUS_CHANGED;
          return (
            <div key={event.id} className="relative flex gap-4 pl-1">
              <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                )}
                <p className="text-[11px] text-neutral-400 mt-1">
                  {format(new Date(event.created_at), 'MMM d, yyyy · h:mm a')}
                  {event.created_by && ` · ${event.created_by.full_name}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
