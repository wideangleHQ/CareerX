'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { ApplicationFilters } from '@/src/features/hr-applications/components/ApplicationFilters';
import { ApplicationTable } from '@/src/features/hr-applications/components/ApplicationTable';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, ListFilter } from 'lucide-react';
import type { ApplicationStatus } from '@/src/api/types';

export default function ApplicationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [departmentId, setDepartmentId] = useState<string>('ALL');

  // Cursor-based pagination states
  const [limit] = useState(10);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['applications', search, status, departmentId, cursor, limit],
    queryFn: async () => {
      const params: any = {
        limit,
        cursor,
        sortField: 'created_at',
        sortOrder: 'desc',
      };
      if (search) params.search = search;
      if (status !== 'ALL') params.status = status as ApplicationStatus;
      if (departmentId !== 'ALL') params.departmentId = departmentId;
      return applicationsApi.findAll(params);
    },
  });

  const applications = response?.data || [];
  const pagination = (response as any)?.pagination || { hasMore: false, nextCursor: null };

  const handleNextPage = () => {
    if (pagination.hasMore && pagination.nextCursor) {
      const next = pagination.nextCursor;
      setCursorHistory((prev) => [...prev, next]);
      setCursor(next);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevIndex = currentPage - 2;
      const prevCursor = cursorHistory[prevIndex];
      setCursor(prevCursor);
      setCursorHistory((prev) => prev.slice(0, prevIndex + 1));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setDepartmentId('ALL');
    setCursor(undefined);
    setCursorHistory([undefined]);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <ListFilter className="h-6 w-6 text-neutral-500" /> Candidate Applications
        </h1>
        <p className="text-xs text-muted-foreground">
          View, filter, evaluate and assign target candidate applications.
        </p>
      </div>

      <ApplicationFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCursor(undefined);
          setCursorHistory([undefined]);
          setCurrentPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setCursor(undefined);
          setCursorHistory([undefined]);
          setCurrentPage(1);
        }}
        departmentId={departmentId}
        onDepartmentIdChange={(val) => {
          setDepartmentId(val);
          setCursor(undefined);
          setCursorHistory([undefined]);
          setCurrentPage(1);
        }}
        onClear={handleClearFilters}
      />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <ApplicationTable applications={applications} isLoading={isLoading} />

        {/* Pagination Toolbar */}
        {!isLoading && applications.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4 bg-neutral-50/50">
            <span className="text-xs font-semibold text-neutral-500">
              Page {currentPage}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="cursor-pointer"
              >
                Next <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
