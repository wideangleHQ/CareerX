'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useInterviewStats } from '../hooks/useInterviewStats';
import { CalendarDays, CalendarCheck, CalendarClock, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function InterviewStats() {
  const { stats, isLoading } = useInterviewStats();

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center border rounded-lg border-dashed bg-neutral-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const statItems = [
    { label: 'Available Slots', value: stats.availableSlots, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Booked Slots', value: stats.bookedSlots, icon: CalendarCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: "Today's Interviews", value: stats.todayInterviews, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Upcoming', value: stats.upcomingInterviews, icon: CalendarClock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completed', value: stats.completedInterviews, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Cancelled', value: stats.cancelledInterviews, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-neutral-200 shadow-none hover:border-primary/20 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${item.bg} ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-2xl font-bold text-neutral-900">{item.value}</h4>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 mt-1">{item.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
