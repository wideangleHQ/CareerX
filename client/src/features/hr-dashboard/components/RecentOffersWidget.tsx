'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/src/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function RecentOffersWidget() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['dashboard', 'recent-offers'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/api/v1/dashboard/offers-stats');
      return data;
    },
  });

  const recentOffers = res?.data?.recentOffers || [];

  return (
    <Card className="border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between border-b p-6 bg-neutral-50/20">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold">Recent Offers</CardTitle>
          <p className="text-xs text-muted-foreground">Latest offer activity across candidates.</p>
        </div>
        <Link
          href="/offers"
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
        ) : recentOffers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No offers generated yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentOffers.map((offer: any) => (
              <div key={offer.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-black truncate">
                    {offer.candidateName || offer.applicationCode}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {offer.departmentName || '—'} · {offer.status?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {offer.status?.replace(/_/g, ' ')}
                  </Badge>
                  {offer.updatedAt && (
                    <span className="text-[10px] text-neutral-400 hidden sm:inline">
                      {format(new Date(offer.updatedAt), 'MMM d')}
                    </span>
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
