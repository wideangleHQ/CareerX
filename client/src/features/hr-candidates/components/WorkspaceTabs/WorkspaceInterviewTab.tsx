import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Application } from '@/src/api/types';
import { CalendarClock, Video, UserCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatSlotTime } from '@/src/lib/slot-time';

interface WorkspaceInterviewTabProps {
  application: Application | null;
}

export function WorkspaceInterviewTab({ application }: WorkspaceInterviewTabProps) {
  if (!application) return null;

  const slotAssignment = application.slot_assignment;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-neutral-900">Interview Rounds</h3>
        <Button size="sm" className="cursor-pointer">
          Schedule Interview
        </Button>
      </div>

      {!slotAssignment ? (
        <Card className="border-neutral-200 border-dashed bg-neutral-50/50">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-white border rounded-full flex items-center justify-center mb-4 shadow-sm">
              <CalendarClock className="h-6 w-6 text-neutral-400" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-1">No Interviews Scheduled</h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-[300px] mx-auto">
              This candidate doesn't have any interviews scheduled yet. Click the button above to schedule one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-neutral-200 overflow-hidden">
          <div className="bg-primary/5 p-4 border-b flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-primary uppercase bg-white px-2 py-1 rounded shadow-sm border border-primary/10 inline-block mb-2">
                Round 1
              </span>
              <h4 className="font-bold text-neutral-900 flex items-center gap-2">
                <Video className="h-4 w-4 text-neutral-500" /> Technical Assessment
              </h4>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200">
              Scheduled
            </span>
          </div>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <UserCircle className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Interviewer</p>
                    <p className="text-sm font-semibold mt-0.5">
                      {slotAssignment.assigned_hr?.full_name || 'Unassigned'}
                    </p>
                    <p className="text-xs text-neutral-500">{slotAssignment.assigned_hr?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-semibold mt-0.5">
                      {slotAssignment.slot?.slotDate ? new Date(slotAssignment.slot.slotDate).toLocaleDateString() : 'Unknown Date'}
                    </p>
                    <p className="text-xs text-neutral-500">{slotAssignment.slot?.slotTime ? formatSlotTime(slotAssignment.slot.slotTime) : 'Unknown Time'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t flex justify-end gap-2">
              <Button size="sm" variant="outline" className="cursor-pointer text-xs">
                Reschedule
              </Button>
              <Button size="sm" variant="default" className="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700">
                Join Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
