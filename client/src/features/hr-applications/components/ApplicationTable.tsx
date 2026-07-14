'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Eye } from 'lucide-react';
import type { Application } from '@/src/api/types';
import Link from 'next/link';

interface ApplicationTableProps {
  applications: Application[];
  isLoading: boolean;
}

export function ApplicationTable({ applications, isLoading }: ApplicationTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border rounded-lg p-12 bg-white text-center">
        <User className="h-10 w-10 text-neutral-300" />
        <h3 className="text-base font-bold text-black mt-3">No applications found</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Adjust your filters or query params to find candidate applications.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Candidate</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Assigned HR</TableHead>
          <TableHead>Applied Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((app) => (
          <TableRow key={app.id}>
            <TableCell className="font-semibold text-black">
              {app.application_code}
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium text-black">{app.candidate.full_name}</p>
                <p className="text-[11px] text-muted-foreground">{app.candidate.email}</p>
              </div>
            </TableCell>
            <TableCell>{app.department.name}</TableCell>
            <TableCell>
              {app.assigned_hr ? (
                <span className="text-xs text-neutral-800 font-medium">
                  {app.assigned_hr.full_name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="text-xs text-neutral-600">
              {new Date(app.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <StatusBadge status={app.status} />
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/applications/${app.id}`}>
                <Button variant="outline" size="xs" className="cursor-pointer">
                  <Eye className="mr-1 h-3.5 w-3.5" /> Details
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export default ApplicationTable;
