'use client';

import React, { useState, useCallback } from 'react';
import { useOffers } from '@/src/features/offer-management/hooks/useOffers';
import { OfferFilters } from '@/src/features/offer-management/components/OfferFilters';
import { OfferTable } from '@/src/features/offer-management/components/OfferTable';
import { OfferStats } from '@/src/features/offer-management/components/OfferStats';
import { ExtendOfferDialog } from '@/src/features/offer-management/components/ExtendOfferDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileSignature } from 'lucide-react';
import type { OfferStatus } from '@/src/api/types';

export default function OffersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [departmentId, setDepartmentId] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [extendApplicationId, setExtendApplicationId] = useState<string | null>(null);

  const { data: response, isLoading } = useOffers({
    page,
    limit,
    search: search || undefined,
    status: status !== 'ALL' ? (status as OfferStatus) : undefined,
    departmentId: departmentId !== 'ALL' ? departmentId : undefined,
    sortField: 'updated_at',
    sortOrder: 'desc',
  });

  const offers = response?.data || [];
  const totalPages = response?.totalPages || 1;

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setStatus('ALL');
    setDepartmentId('ALL');
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-neutral-500" /> Offer Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Track and manage candidate offers across your hiring pipeline.
          </p>
        </div>
      </div>

      <OfferStats />

      <OfferFilters
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        status={status}
        onStatusChange={(val) => { setStatus(val); setPage(1); }}
        departmentId={departmentId}
        onDepartmentIdChange={(val) => { setDepartmentId(val); setPage(1); }}
        onClear={handleClearFilters}
      />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <OfferTable offers={offers} isLoading={isLoading} />

        {!isLoading && offers.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4 bg-neutral-50/50">
            <span className="text-xs font-semibold text-neutral-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {extendApplicationId && (
        <ExtendOfferDialog
          open={!!extendApplicationId}
          onOpenChange={(open) => !open && setExtendApplicationId(null)}
          applicationId={extendApplicationId}
        />
      )}
    </div>
  );
}
