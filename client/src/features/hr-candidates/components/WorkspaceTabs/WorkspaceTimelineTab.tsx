import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { TimelineEvent } from '@/src/api/types';
import { CheckCircle2, FileText, CalendarClock, MessageSquare, AlertCircle } from 'lucide-react';

interface WorkspaceTimelineTabProps {
  events: TimelineEvent[];
  isLoading: boolean;
}

export function WorkspaceTimelineTab({ events, isLoading }: WorkspaceTimelineTabProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Loading timeline...</div>;
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No timeline events found.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'APPLICATION_SUBMITTED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'DOCUMENT_UPLOADED': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'INTERVIEW_SCHEDULED': return <CalendarClock className="h-4 w-4 text-purple-500" />;
      case 'FEEDBACK_ADDED': return <MessageSquare className="h-4 w-4 text-amber-500" />;
      case 'STATUS_CHANGED': return <AlertCircle className="h-4 w-4 text-indigo-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-neutral-400" />;
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardContent className="p-6">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Icon */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-neutral-100 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                {getEventIcon(event.event_type)}
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-neutral-100 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-neutral-800">{event.title}</h4>
                  <time className="text-[10px] font-medium text-neutral-500">
                    {new Date(event.created_at).toLocaleDateString()}
                  </time>
                </div>
                {event.description && (
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {event.description}
                  </p>
                )}
                {event.created_by && (
                  <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
                    By {event.created_by.full_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
