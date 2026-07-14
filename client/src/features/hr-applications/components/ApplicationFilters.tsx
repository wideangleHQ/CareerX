'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@/src/api/departments';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { ApplicationStatus } from '@/src/api/types';

interface ApplicationFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  departmentId: string;
  onDepartmentIdChange: (val: string) => void;
  onClear: () => void;
}

export function ApplicationFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  departmentId,
  onDepartmentIdChange,
  onClear,
}: ApplicationFiltersProps) {
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const statuses: { label: string; value: ApplicationStatus | 'ALL' }[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'New', value: 'NEW' },
    { label: 'Slot Booked', value: 'SLOT_BOOKED' },
    { label: 'Interviewed', value: 'INTERVIEWED' },
    { label: 'Selected', value: 'SELECTED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Withdrawn', value: 'WITHDRAWN' },
  ];

  const hasActiveFilters = search || status !== 'ALL' || departmentId !== 'ALL';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by code, candidate name..."
            className="pl-9 h-9"
          />
        </div>

        {/* Department Filter */}
        <div className="w-full sm:max-w-[180px]">
          <Select value={departmentId} onValueChange={onDepartmentIdChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:max-w-[180px]">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-neutral-500 hover:text-black self-end sm:self-auto h-9 cursor-pointer"
        >
          <X className="mr-1.5 h-3.5 w-3.5" /> Clear Filters
        </Button>
      )}
    </div>
  );
}
export default ApplicationFilters;
