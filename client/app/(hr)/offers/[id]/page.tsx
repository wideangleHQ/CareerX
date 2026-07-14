'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useOffer } from '@/src/features/offer-management/hooks/useOffers';
import { OfferDetailView } from '@/src/features/offer-management/components/OfferDetailView';
import { Skeleton } from '@/components/ui/skeleton';

export default function OfferDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: res, isLoading } = useOffer(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-xl border space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-xl border space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!res?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold text-neutral-900">Offer not found</h2>
        <p className="text-sm text-muted-foreground mt-1">The offer you are looking for does not exist.</p>
      </div>
    );
  }

  return <OfferDetailView offer={res.data} />;
}
