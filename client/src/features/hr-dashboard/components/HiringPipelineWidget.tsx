'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '../hooks/useDashboardStats';
import type { ApplicationStatus } from '@/src/api/types';

const PIPELINE_STAGES: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'NEW', label: 'Applied', color: 'bg-blue-500' },
  { status: 'SLOT_BOOKED', label: 'Interview Scheduled', color: 'bg-amber-500' },
  { status: 'INTERVIEWED', label: 'Interviewed', color: 'bg-purple-500' },
  { status: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-cyan-500' },
  { status: 'SELECTED', label: 'Selected', color: 'bg-green-500' },
  { status: 'OFFER_RELEASED', label: 'Offer Sent', color: 'bg-indigo-500' },
  { status: 'JOINED', label: 'Hired', color: 'bg-emerald-600' },
  { status: 'REJECTED', label: 'Rejected', color: 'bg-red-400' },
  { status: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-neutral-400' },
];

export function HiringPipelineWidget() {
  // Reads the per-status tally from /dashboard/stats. The previous version
  // fired six list requests and read `q.data.total`, a field the cursor-based
  // list response never returns — so every bar rendered 0.
  const { isLoading, byStatus } = useDashboardStats();

  const stages = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: byStatus?.[stage.status] ?? 0,
  }));

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card className="border-neutral-200">
      <CardHeader className="border-b p-6 bg-neutral-50/20">
        <CardTitle className="text-base font-bold">Hiring Pipeline</CardTitle>
        <p className="text-xs text-muted-foreground">Application distribution across stages.</p>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.status} className="flex items-center gap-3">
                <span className="text-xs font-medium text-neutral-600 w-32 shrink-0 text-right">
                  {stage.label}
                </span>
                <div className="flex-1 h-7 bg-neutral-100 rounded-md overflow-hidden relative">
                  <div
                    className={`h-full ${stage.color} rounded-md transition-all duration-500`}
                    style={{ width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0)}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-700">
                    {stage.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
