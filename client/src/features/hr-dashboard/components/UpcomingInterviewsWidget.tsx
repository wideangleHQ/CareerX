'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { extractSlotTime, formatSlotTime } from '@/src/lib/slot-time';

export function UpcomingInterviewsWidget() {
  const today = new Date();
  const weekEnd = addDays(today, 7);

  const { data: slotsRes, isLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-interviews'],
    queryFn: () =>
      interviewsApi.findAll({
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
        isBooked: true,
      }),
  });

  const slots = slotsRes?.data || [];

  const grouped = useMemo(() => {
    const sortKey = (s: (typeof slots)[number]) =>
      `${String(s.slotDate).split('T')[0]} ${extractSlotTime(s.slotTime) ?? ''}`;
    const sorted = [...slots].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const groups: { label: string; slots: typeof sorted }[] = [];
    const todaySlots = sorted.filter((s) => isToday(new Date(s.slotDate)));
    const tomorrowSlots = sorted.filter((s) => isTomorrow(new Date(s.slotDate)));
    const laterSlots = sorted.filter((s) => !isToday(new Date(s.slotDate)) && !isTomorrow(new Date(s.slotDate)));

    if (todaySlots.length) groups.push({ label: 'Today', slots: todaySlots });
    if (tomorrowSlots.length) groups.push({ label: 'Tomorrow', slots: tomorrowSlots });
    if (laterSlots.length) groups.push({ label: 'This Week', slots: laterSlots });

    return groups;
  }, [slots]);

  const formatTime = (timeStr: string) => formatSlotTime(timeStr);

  return (
    <Card className="border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between border-b p-6 bg-neutral-50/20">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold">Upcoming Interviews</CardTitle>
          <p className="text-xs text-muted-foreground">Scheduled interviews for the next 7 days.</p>
        </div>
        <Link
          href="/interviews"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No upcoming interviews this week.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.slots.slice(0, 5).map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between text-sm bg-neutral-50/50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0 bg-white">
                          {formatTime(slot.slotTime)}
                        </Badge>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 text-xs truncate">
                            {slot.hr?.fullName || 'HR Employee'}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {slot.department?.name || 'General'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0 ml-2">
                        {format(new Date(slot.slotDate), 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
