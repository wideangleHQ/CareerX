'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@/src/api/departments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface DepartmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DepartmentSelect({ value, onChange, error }: DepartmentSelectProps) {
  const { data: rawDepartments = [], isLoading } = useQuery({
    queryKey: ['hiring-departments'],
    queryFn: departmentsApi.getHiring,
  });

  const departments = useMemo(() => {
    const map = new Map<string, string>();
    rawDepartments.forEach((dept: any) => {
      if (dept.id && !map.has(dept.id)) {
        map.set(dept.id, dept.departmentName || dept.name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rawDepartments]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-black">Target Department</label>
      {isLoading ? (
        <div className="flex h-9 items-center gap-2 rounded-lg border border-input px-3 bg-muted/20">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading departments...</span>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className={error ? 'border-destructive ring-destructive/20' : ''}>
            <SelectValue placeholder="Select a department to apply for" />
          </SelectTrigger>
          <SelectContent>
            {departments.length === 0 ? (
              <SelectItem value="none" disabled>
                No departments currently hiring
              </SelectItem>
            ) : (
              departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
export default DepartmentSelect;
