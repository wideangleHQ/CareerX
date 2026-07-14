'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { useUpdateApplicationStatus } from '../hooks/useUpdateApplicationStatus';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Phone, Calendar, Download, UserCheck } from 'lucide-react';
import type { ApplicationStatus } from '@/src/api/types';

interface ApplicationDetailsSheetProps {
  applicationId: string;
}

export function ApplicationDetailsSheet({ applicationId }: ApplicationDetailsSheetProps) {
  const queryClient = useQueryClient();

  const { data: appRes, isLoading } = useQuery({
    queryKey: ['application-details', applicationId],
    queryFn: () => applicationsApi.findOne(applicationId),
    enabled: !!applicationId,
  });

  const updateStatusMutation = useUpdateApplicationStatus();

  const application = appRes?.data;

  const handleStatusChange = (status: ApplicationStatus) => {
    if (!application) return;
    const reason = window.prompt('Enter transition reason/note (optional):') || undefined;
    updateStatusMutation.mutate({
      id: application.id,
      status,
      reason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Application not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">{application.candidate.full_name}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Application Code: <span className="font-semibold text-black">{application.application_code}</span>
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap gap-2">
          {application.status === 'NEW' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('SLOT_BOOKED')}
              className="cursor-pointer"
            >
              Set Booked
            </Button>
          )}
          {application.status === 'SLOT_BOOKED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('INTERVIEWED')}
              className="cursor-pointer"
            >
              Mark Interviewed
            </Button>
          )}
          {application.status === 'INTERVIEWED' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleStatusChange('SELECTED')}
                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              >
                Select Candidate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleStatusChange('REJECTED')}
                className="cursor-pointer"
              >
                Reject Candidate
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Profile */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-neutral-200">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <CardTitle className="text-base font-bold">Candidate Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold text-black mt-0.5">{application.candidate.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-semibold text-black mt-0.5">{application.candidate.mobile_number}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Self Description / Cover Note
                </p>
                <p className="text-sm text-neutral-700 mt-2 bg-neutral-50/50 border rounded-lg p-3 whitespace-pre-line">
                  {application.self_description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Process Parameters */}
        <div className="space-y-6">
          <Card className="border-neutral-200">
            <CardHeader className="bg-neutral-50/20 border-b p-6">
              <CardTitle className="text-base font-bold">Recruitment State</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Target Department</p>
                <p className="font-semibold text-black mt-0.5">{application.department.name}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Assigned HR Employee</p>
                <p className="font-semibold text-black mt-0.5">
                  {application.assigned_hr?.full_name || 'Not assigned yet'}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Applied On</p>
                <p className="font-semibold text-black mt-0.5">
                  {new Date(application.created_at).toLocaleString()}
                </p>
              </div>

              {application.rejection_reason && (
                <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-500 font-semibold">Rejection Reason</p>
                  <p className="text-xs text-red-700 mt-1">{application.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default ApplicationDetailsSheet;
