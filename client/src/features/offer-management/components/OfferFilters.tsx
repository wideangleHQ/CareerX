import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@/src/api/departments';
import type { OfferStatus } from '@/src/api/types';

interface OfferFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  departmentId: string;
  onDepartmentIdChange: (value: string) => void;
  onClear: () => void;
}

const OFFER_STATUSES: { value: OfferStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'GENERATED', label: 'Generated' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'JOINED', label: 'Joined' },
];

export function OfferFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  departmentId,
  onDepartmentIdChange,
  onClear,
}: OfferFiltersProps) {
  const { data: deptsRes } = useQuery({
    queryKey: ['departments', 'active'],
    queryFn: () => departmentsApi.findAll({ limit: 100 }),
  });

  const departments = deptsRes?.data || [];
  const hasActiveFilters = search || status !== 'ALL' || departmentId !== 'ALL';

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search by candidate, offer reference, or department..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-neutral-50/50 border-neutral-200 focus-visible:ring-1 focus-visible:ring-neutral-300 w-full"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px] bg-neutral-50/50 border-neutral-200">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {OFFER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentId} onValueChange={onDepartmentIdChange}>
          <SelectTrigger className="w-[180px] bg-neutral-50/50 border-neutral-200">
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-neutral-500 hover:text-neutral-700 px-2 h-9"
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
