'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { useUpdateApplicationStatus } from '../hooks/useUpdateApplicationStatus';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Phone, FileText, Clock3, Download, ExternalLink } from 'lucide-react';
import type { ApplicationStatus, CandidateFile } from '@/src/api/types';
import { useCandidateFiles, useFileAction } from '@/src/features/hr-candidates/hooks/useCandidateFiles';
import { FilePreviewDialog } from '@/src/features/hr-candidates/components/FilePreviewDialog';

interface ApplicationDetailsSheetProps {
  applicationId: string;
}

export function ApplicationDetailsSheet({ applicationId }: ApplicationDetailsSheetProps) {
  const { data: appRes, isLoading } = useQuery({
    queryKey: ['application-details', applicationId],
    queryFn: () => applicationsApi.findOne(applicationId),
    enabled: !!applicationId,
  });

  const { data: timelineRes } = useQuery({
    queryKey: ['application-timeline', applicationId],
    queryFn: () => applicationsApi.getTimeline(applicationId),
    enabled: !!applicationId,
  });

  const { data: notesRes } = useQuery({
    queryKey: ['application-notes', applicationId],
    queryFn: () => applicationsApi.getNotes(applicationId),
    enabled: !!applicationId,
  });

  const { data: feedbackRes } = useQuery({
    queryKey: ['application-feedback', applicationId],
    queryFn: () => applicationsApi.getFeedback({ applicationId }),
    enabled: !!applicationId,
  });

  const updateStatusMutation = useUpdateApplicationStatus();
  const { files, isLoading: isLoadingFiles, isError: isFilesError } = useCandidateFiles(applicationId);
  const fileAction = useFileAction();
  const [previewFile, setPreviewFile] = React.useState<CandidateFile | null>(null);

  const application = appRes?.data;
  const resume = files.find((file) => file.fileType === 'RESUME') ?? null;

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
            <h1 className="text-2xl font-bold text-black">{application.candidate.fullName}</h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Application Code: <span className="font-semibold text-black">{application.applicationCode}</span>
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
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('SHORTLISTED')}
                className="cursor-pointer"
              >
                Shortlist
              </Button>
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
          {application.status === 'SHORTLISTED' && (
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
                    <p className="font-semibold text-black mt-0.5">{application.candidate.mobileNumber}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Self Description / Cover Note
                </p>
                <p className="text-sm text-neutral-700 mt-2 bg-neutral-50/50 border rounded-lg p-3 whitespace-pre-line">
                  {application.selfDescription}
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
                <p className="text-xs text-muted-foreground">Applied Position</p>
                <p className="font-semibold text-black mt-0.5">{application.opportunity?.title || application.opportunity?.internalPosition || '—'}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Assigned HR Employee</p>
                <p className="font-semibold text-black mt-0.5">
                  {application.assignedHr?.fullName || 'Not assigned yet'}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Applied On</p>
                <p className="font-semibold text-black mt-0.5">
                  {new Date(application.createdAt).toLocaleString()}
                </p>
              </div>

              {application.rejectionReason && (
                <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-500 font-semibold">Rejection Reason</p>
                  <p className="text-xs text-red-700 mt-1">{application.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-neutral-200 lg:col-span-2">
          <CardHeader className="border-b p-5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock3 className="h-4 w-4" /> Application Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-3">
              {(timelineRes?.data ?? []).map((event, index) => (
                <div key={`${String(event.eventType ?? 'event')}-${String(event.timestamp ?? index)}`} className="flex gap-3 border-b last:border-0 pb-3 last:pb-0">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{String(event.eventType ?? 'Application event').replaceAll('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">{event.timestamp ? new Date(String(event.timestamp)).toLocaleString() : '—'}</p>
                  </div>
                </div>
              ))}
              {(timelineRes?.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No timeline events found.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-neutral-200">
            <CardHeader className="border-b p-5">
              <CardTitle className="text-base font-bold flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              {isLoadingFiles && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {isFilesError && <p className="text-sm text-destructive">Could not load documents.</p>}
              {!isLoadingFiles && !isFilesError && files.length === 0 && <p className="text-sm text-muted-foreground">No documents attached.</p>}
              {!isLoadingFiles && !isFilesError && files.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-neutral-700">{file.fileName}</span>
                  <div className="flex shrink-0 gap-1">
                    {file.mimeType === 'application/pdf' || file.mimeType?.startsWith('image/') ? (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreviewFile(file)}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => fileAction.mutate({ file, mode: 'download' })}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {resume && <p className="text-xs text-muted-foreground">Resume ready for preview/download.</p>}
            </CardContent>
          </Card>
          <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
          <Card className="border-neutral-200">
            <CardHeader className="border-b p-5"><CardTitle className="text-base font-bold">HR Notes & Feedback</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-2">
              <p className="text-sm text-neutral-700">Notes: {notesRes?.data?.length ?? application.notesCount ?? 0}</p>
              <p className="text-sm text-neutral-700">Interview feedback: {feedbackRes?.data?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default ApplicationDetailsSheet;
