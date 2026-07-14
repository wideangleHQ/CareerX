'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@/src/api/departments';
import { applicationsApi } from '@/src/api/applications';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DepartmentOverviewWidget() {
  const { data: deptsRes, isLoading: deptsLoading } = useQuery({
    queryKey: ['dashboard', 'departments-hiring'],
    queryFn: () => departmentsApi.findAll({ limit: 100 }),
  });

  const departments = deptsRes?.data || [];
  const hiringDepts = departments.filter((d) => d.is_hiring_enabled);

  return (
    <Card className="border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between border-b p-6 bg-neutral-50/20">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold">Department Overview</CardTitle>
          <p className="text-xs text-muted-foreground">Departments actively hiring.</p>
        </div>
        <Link
          href="/departments"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-6">
        {deptsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hiringDepts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No departments currently hiring.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {hiringDepts.slice(0, 8).map((dept) => (
              <div key={dept.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                <span className="font-medium text-neutral-900">{dept.name}</span>
                <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                  Hiring
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
