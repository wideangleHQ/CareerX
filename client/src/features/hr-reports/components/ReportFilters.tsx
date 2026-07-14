'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@/src/api/departments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, X } from 'lucide-react';

interface ReportFiltersProps {
  departmentId: string;
  onDepartmentIdChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onClear: () => void;
}

export function ReportFilters({
  departmentId,
  onDepartmentIdChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClear,
}: ReportFiltersProps) {
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const hasActiveFilters = departmentId !== 'ALL' || startDate || endDate;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Department Filter */}
        <div className="w-full sm:max-w-[200px]">
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

        {/* Start Date */}
        <div className="flex items-center gap-2 w-full sm:max-w-[200px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">From:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="h-9"
          />
        </div>

        {/* End Date */}
        <div className="flex items-center gap-2 w-full sm:max-w-[200px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">To:</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-neutral-500 hover:text-black self-end sm:self-auto h-9 cursor-pointer"
        >
          <X className="mr-1.5 h-3.5 w-3.5" /> Reset
        </Button>
      )}
    </div>
  );
}
export default ReportFilters;
