'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function PendingApplicationsWidget() {
  const { data: appResponse, isLoading } = useQuery({
    queryKey: ['pending-applications-widget'],
    queryFn: () => applicationsApi.findAll({ status: 'NEW', limit: 5 }),
  });

  const applications = appResponse?.data || [];

  return (
    <Card className="border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between border-b p-6 bg-neutral-50/20">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold">New Applications</CardTitle>
          <p className="text-xs text-muted-foreground">Applications awaiting initial HR review.</p>
        </div>
        <Link
          href="/applications?status=NEW"
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
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No new applications at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {applications.map((app) => (
              <div key={app.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-sm">
                <div>
                  <Link
                    href={`/applications/${app.id}`}
                    className="font-medium text-black hover:underline"
                  >
                    {app.candidate.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {app.department.name} • {app.application_code}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-neutral-100 border-neutral-200">
                  {new Date(app.created_at).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export default PendingApplicationsWidget;
