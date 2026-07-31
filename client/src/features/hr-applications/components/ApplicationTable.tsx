'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CandidateProfile } from '@/src/features/hr-candidates/components/CandidateProfile';
import { candidatesApi } from '@/src/api/candidates';
import { User, Eye, Mail, Phone, ExternalLink, X, FileText, Download } from 'lucide-react';
import { useFileAction } from '@/src/features/hr-candidates/hooks/useCandidateFiles';
import { FilePreviewDialog } from '@/src/features/hr-candidates/components/FilePreviewDialog';
import type { Application } from '@/src/api/types';

interface ApplicationTableProps {
  applications: Application[];
  isLoading: boolean;
}

export function ApplicationTable({ applications, isLoading }: ApplicationTableProps) {
  const queryClient = useQueryClient();
  const [workspaceCandidateId, setWorkspaceCandidateId] = React.useState<string | null>(null);
  const [workspaceApplicationId, setWorkspaceApplicationId] = React.useState<string | null>(null);
  const [previewFile, setPreviewFile] = React.useState<import('@/src/api/types').CandidateFile | null>(null);
  const fileAction = useFileAction();
  const selectedApplication = React.useMemo(
    () => applications.find((app) => app.candidate.id === workspaceCandidateId) ?? null,
    [applications, workspaceCandidateId],
  );

  const prefetchCandidate = React.useCallback((candidateId: string) => {
    void queryClient.prefetchQuery({
      queryKey: ['candidate-profile', candidateId],
      queryFn: () => candidatesApi.findOne(candidateId),
      staleTime: 60_000,
    });
  }, [queryClient]);
  const openWorkspace = React.useCallback((app: Application) => {
    prefetchCandidate(app.candidate.id);
    setWorkspaceCandidateId(app.candidate.id);
    setWorkspaceApplicationId(app.id);
  }, [prefetchCandidate]);

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
    <>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Candidate</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Assigned HR</TableHead>
          <TableHead>Interview</TableHead>
          <TableHead>Applied Date</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Resume</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((app) => (
          <TableRow key={app.id}>
            <TableCell className="font-semibold text-black">
              {app.applicationCode}
            </TableCell>
            <TableCell>
              <div className="group relative inline-block">
                <button
                  type="button"
                  onClick={() => openWorkspace(app)}
                  onMouseEnter={() => prefetchCandidate(app.candidate.id)}
                  className="text-left font-medium text-black hover:underline"
                >
                  {app.candidate.fullName}
                </button>
                <p className="text-[11px] text-muted-foreground">{app.candidate.email}</p>
                <div className="absolute left-0 top-full z-30 hidden w-72 pt-2 group-hover:md:block">
                  <div className="rounded-md border bg-white p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-600">
                        {app.candidate.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-black">{app.candidate.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{app.candidate.email}</p>
                        <p className="truncate text-xs text-muted-foreground">{app.candidate.mobileNumber}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-1 text-xs text-neutral-600">
                      <div className="flex justify-between gap-3"><span>Status</span><span className="font-medium text-neutral-900">{app.status.replace(/_/g, ' ')}</span></div>
                      <div className="flex justify-between gap-3"><span>Assigned HR</span><span className="truncate font-medium text-neutral-900">{app.assignedHr?.fullName || 'Unassigned'}</span></div>
                      <div className="flex justify-between gap-3"><span>Department</span><span className="truncate font-medium text-neutral-900">{app.department.name}</span></div>
                    </div>
                    <div className="mt-3 flex gap-2 text-xs font-medium text-primary">
                      <a className="inline-flex items-center gap-1 hover:underline" href={`tel:${app.candidate.mobileNumber}`}>
                        <Phone className="h-3 w-3" /> Call
                      </a>
                      <a className="inline-flex items-center gap-1 hover:underline" href={`mailto:${app.candidate.email}`}>
                        <Mail className="h-3 w-3" /> Email
                      </a>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:underline"
                        onClick={() => openWorkspace(app)}
                      >
                        <ExternalLink className="h-3 w-3" /> Workspace
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm font-medium text-black">{app.opportunity?.title || '-'}</p>
                <p className="text-[11px] text-muted-foreground">{app.opportunity?.internalPosition || '-'}</p>
              </div>
            </TableCell>
            <TableCell>{app.department.name}</TableCell>
            <TableCell>
              {app.assignedHr ? (
                <span className="text-xs text-neutral-800 font-medium">
                  {app.assignedHr.fullName}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="text-xs text-neutral-600">
              {app.interviewStatus === 'SCHEDULED' ? 'Scheduled' : 'Not scheduled'}
            </TableCell>
            <TableCell className="text-xs text-neutral-600">
              {new Date(app.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-xs text-neutral-600">
              {new Date(app.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {app.resumeFile ? (() => {
                const cf: import('@/src/api/types').CandidateFile = {
                  id: app.resumeFile.id,
                  fileName: app.resumeFile.fileName,
                  fileType: 'RESUME',
                  bucket: '',
                  fileSizeKb: null,
                  mimeType: app.resumeFile.mimeType,
                  createdAt: '',
                };
                return (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="xs" className="h-7 px-1.5" onClick={() => setPreviewFile(cf)} title="Preview">
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="xs" className="h-7 px-1.5" onClick={() => fileAction.mutate({ file: cf, mode: 'download' })} title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })() : (
                <span className="text-xs text-muted-foreground">No Resume</span>
              )}
            </TableCell>
            <TableCell className="text-xs font-medium text-neutral-700">
              {app.opportunity?.priority || '-'}
            </TableCell>
            <TableCell>
              <StatusBadge status={app.status} />
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="xs"
                onMouseEnter={() => prefetchCandidate(app.candidate.id)}
                onClick={() => openWorkspace(app)}
                className="cursor-pointer"
              >
                <Eye className="mr-1 h-3.5 w-3.5" /> View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      </Table>
      <Dialog open={!!workspaceCandidateId} onOpenChange={(open) => { if (!open) { setWorkspaceCandidateId(null); setWorkspaceApplicationId(null); } }}>
        <DialogContent className="left-0 top-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 rounded-none p-0 sm:left-auto sm:right-0 sm:top-0 sm:h-dvh sm:w-full sm:max-w-full sm:translate-x-0 sm:translate-y-0 md:w-[90vw] md:max-w-[90vw] lg:w-[60vw] lg:max-w-[1200px]">
          <DialogClose className="absolute right-4 top-4 z-20 rounded-full border border-neutral-200 bg-white p-2 text-neutral-400 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900">
            <X className="h-4 w-4" />
          </DialogClose>
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedApplication?.candidate.fullName ?? 'Candidate workspace'}</DialogTitle>
            <DialogDescription>Candidate application workspace</DialogDescription>
          </DialogHeader>
          <div className="h-full overflow-y-auto">
            {workspaceCandidateId && <CandidateProfile candidateId={workspaceCandidateId} applicationId={workspaceApplicationId ?? undefined} />}
          </div>
        </DialogContent>
      </Dialog>
      <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
}
export default ApplicationTable;
