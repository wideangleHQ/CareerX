'use client';

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/src/api/client';
import { applicationsApi } from '@/src/api/applications';
import { ApplicationFilters } from '@/src/features/hr-applications/components/ApplicationFilters';
import { ApplicationTable } from '@/src/features/hr-applications/components/ApplicationTable';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ListFilter, Users, User } from 'lucide-react';
import type { ApplicationScope, ApplicationStatus, QueryApplicationsParams } from '@/src/api/types';

const STATUS_TABS: { label: string; value: ApplicationStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Interviewed', value: 'INTERVIEWED' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Selected', value: 'SELECTED' },
  { label: 'Offer Released', value: 'OFFER_RELEASED' },
  { label: 'Joined', value: 'JOINED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

export default function ApplicationsPage() {
  const [scope, setScope] = useState<ApplicationScope>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [departmentId, setDepartmentId] = useState<string>('ALL');

  const [limit] = useState(10);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [currentPage, setCurrentPage] = useState(1);

  const resetPagination = useCallback(() => {
    setCursor(undefined);
    setCursorHistory([undefined]);
    setCurrentPage(1);
  }, []);

  const { data: statsData } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/api/v1/dashboard/stats');
      return data;
    },
  });

  const byStatus: Record<string, number> = statsData?.data?.byStatus ?? {};
  const totalApplications: number = statsData?.data?.totalApplications ?? 0;

  const { data: response, isLoading } = useQuery({
    queryKey: ['applications', scope, search, status, departmentId, cursor, limit],
    queryFn: async () => {
      const params: QueryApplicationsParams = {
        scope,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (cursor) params.cursor = cursor;
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
    resetPagination();
  };

  const handleScopeChange = (newScope: ApplicationScope) => {
    if (newScope !== scope) {
      setScope(newScope);
      resetPagination();
    }
  };

  const handleStatusTabChange = (val: string) => {
    setStatus(val);
    resetPagination();
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

      {/* Scope tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => handleScopeChange('all')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            scope === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neutral-300'
          }`}
        >
          <Users className="h-4 w-4" />
          All Applications
        </button>
        <button
          onClick={() => handleScopeChange('mine')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
            scope === 'mine'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-neutral-300'
          }`}
        >
          <User className="h-4 w-4" />
          My Applications
        </button>
      </div>

      {/* Status tabs with counts */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === 'ALL' ? totalApplications : (byStatus[tab.value] ?? 0);
          const isActive = status === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusTabChange(tab.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <ApplicationFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          resetPagination();
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          resetPagination();
        }}
        departmentId={departmentId}
        onDepartmentIdChange={(val) => {
          setDepartmentId(val);
          resetPagination();
        }}
        onClear={handleClearFilters}
      />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <ApplicationTable applications={applications} isLoading={isLoading} />

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
