'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { opportunitiesApi } from '@/src/api/opportunities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function OpenOpportunitiesWidget() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard', 'open-opportunities'],
    queryFn: () => opportunitiesApi.findPublic({ limit: '5' }),
  });
  const opportunities = res?.data ?? [];

  return (
    <Card className="border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between border-b p-6 bg-neutral-50/20">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold">Open Opportunities</CardTitle>
          <p className="text-xs text-muted-foreground">Currently published hiring positions.</p>
        </div>
        <Link
          href="/opportunities"
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
        ) : opportunities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No published opportunities at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {opportunities.map((opp: any) => (
              <div key={opp.opportunityId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-black truncate">{opp.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {opp.departmentName || '—'} · {opp.employmentType?.replace(/_/g, ' ') || '—'} · {opp.location}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {opp.numberOfOpenings && (
                    <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">
                      {opp.numberOfOpenings} openings
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
