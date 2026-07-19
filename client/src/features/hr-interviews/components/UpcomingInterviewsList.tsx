'use client';

import React from 'react';
import { useUpcomingInterviews } from '../hooks/useUpcomingInterviews';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Video, MoreHorizontal, User, Calendar, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatSlotTime } from '@/src/lib/slot-time';

interface UpcomingInterviewsListProps {
  dateFilter?: string;
}

export function UpcomingInterviewsList({ dateFilter }: UpcomingInterviewsListProps) {
  const { interviews, isLoading } = useUpcomingInterviews(dateFilter);

  if (isLoading) {
    return (
      <Card className="border-neutral-200 shadow-none h-full flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="border-neutral-200 shadow-none h-full flex flex-col">
      <CardHeader className="bg-neutral-50/30 border-b p-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-bold text-neutral-800 min-w-0 truncate">
            {dateFilter ? `Interviews on ${new Date(dateFilter).toLocaleDateString()}` : 'Upcoming Interviews'}
          </CardTitle>
          <Badge variant="secondary" className="bg-white border text-neutral-600 shrink-0 whitespace-nowrap">
            {interviews.length} Scheduled
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar">
        {interviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-900">No interviews found</p>
            <p className="text-xs text-muted-foreground mt-1">There are no booked interviews for the selected period.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {interviews.map((interview) => (
              <div key={interview.id} className="p-4 hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 truncate">{interview.candidateName}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 min-w-0">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {interview.applicationCode}
                        </span>
                        <span className="text-xs text-neutral-600 truncate">{interview.department?.name || 'General'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-neutral-700 bg-white border px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          {new Date(interview.slotDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-700 bg-white border px-2 py-1 rounded-md shadow-sm whitespace-nowrap">
                          <Video className="h-3.5 w-3.5 text-blue-500" />
                          {formatSlotTime(interview.slotTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 cursor-pointer shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="cursor-pointer">
                        <ExternalLink className="mr-2 h-4 w-4" /> View Candidate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Video className="mr-2 h-4 w-4" /> Join Meeting
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-amber-600">
                        Reschedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600">
                        Cancel Interview
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
