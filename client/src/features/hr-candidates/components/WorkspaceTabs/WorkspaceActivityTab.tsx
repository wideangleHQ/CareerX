import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { ActivityEvent } from '@/src/api/types';
import { Eye, Download, Edit, Mail, MessageSquare, Activity } from 'lucide-react';

interface WorkspaceActivityTabProps {
  activity: ActivityEvent[];
  isLoading: boolean;
}

export function WorkspaceActivityTab({ activity, isLoading }: WorkspaceActivityTabProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Loading activity...</div>;
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No recent activity found.
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'VIEW': return <Eye className="h-3.5 w-3.5 text-neutral-500" />;
      case 'DOWNLOAD': return <Download className="h-3.5 w-3.5 text-blue-500" />;
      case 'UPDATE': return <Edit className="h-3.5 w-3.5 text-amber-500" />;
      case 'EMAIL_SENT': return <Mail className="h-3.5 w-3.5 text-purple-500" />;
      case 'NOTE_ADDED': return <MessageSquare className="h-3.5 w-3.5 text-green-500" />;
      default: return <Activity className="h-3.5 w-3.5 text-neutral-400" />;
    }
  };

  return (
    <Card className="border-neutral-200">
      <CardContent className="p-0">
        <ul className="divide-y divide-neutral-100">
          {activity.map((event) => (
            <li key={event.id} className="p-4 hover:bg-neutral-50/50 transition-colors flex gap-4">
              <div className="mt-0.5 rounded-full bg-white border h-7 w-7 flex items-center justify-center shrink-0 shadow-sm">
                {getActivityIcon(event.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 leading-snug">
                  {event.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-medium">
                  <span>{new Date(event.created_at).toLocaleString()}</span>
                  {event.hr && (
                    <>
                      <span>•</span>
                      <span>By {event.hr.full_name}</span>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
