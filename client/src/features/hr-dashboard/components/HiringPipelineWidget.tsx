'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApplicationStatus } from '@/src/api/types';

const PIPELINE_STAGES: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'NEW', label: 'Applied', color: 'bg-blue-500' },
  { status: 'SLOT_BOOKED', label: 'Interview Scheduled', color: 'bg-amber-500' },
  { status: 'INTERVIEWED', label: 'Interviewed', color: 'bg-purple-500' },
  { status: 'SELECTED', label: 'Selected', color: 'bg-green-500' },
  { status: 'REJECTED', label: 'Rejected', color: 'bg-red-400' },
  { status: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-neutral-400' },
];

function usePipelineCounts() {
  const q0 = useQuery({ queryKey: ['dashboard', 'pipeline', 'NEW'], queryFn: () => applicationsApi.findAll({ status: 'NEW', limit: 1 }) });
  const q1 = useQuery({ queryKey: ['dashboard', 'pipeline', 'SLOT_BOOKED'], queryFn: () => applicationsApi.findAll({ status: 'SLOT_BOOKED', limit: 1 }) });
  const q2 = useQuery({ queryKey: ['dashboard', 'pipeline', 'INTERVIEWED'], queryFn: () => applicationsApi.findAll({ status: 'INTERVIEWED', limit: 1 }) });
  const q3 = useQuery({ queryKey: ['dashboard', 'pipeline', 'SELECTED'], queryFn: () => applicationsApi.findAll({ status: 'SELECTED', limit: 1 }) });
  const q4 = useQuery({ queryKey: ['dashboard', 'pipeline', 'REJECTED'], queryFn: () => applicationsApi.findAll({ status: 'REJECTED', limit: 1 }) });
  const q5 = useQuery({ queryKey: ['dashboard', 'pipeline', 'WITHDRAWN'], queryFn: () => applicationsApi.findAll({ status: 'WITHDRAWN', limit: 1 }) });

  const queries = [q0, q1, q2, q3, q4, q5];

  return {
    isLoading: queries.some((q) => q.isLoading),
    counts: queries.map((q) => q.data?.total ?? 0),
  };
}

export function HiringPipelineWidget() {
  const { isLoading, counts } = usePipelineCounts();

  const stages = PIPELINE_STAGES.map((stage, i) => ({
    ...stage,
    count: counts[i],
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
