'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResumePreview } from '../ResumePreview';
import type { Application, CandidateFile } from '@/src/api/types';
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCandidateFiles, useFileAction } from '../../hooks/useCandidateFiles';
import { FilePreviewDialog } from '../FilePreviewDialog';

interface WorkspaceDocumentsTabProps {
  application: Application | null;
}

// Only these render inline in a browser tab; anything else is download-only.
const PREVIEWABLE = /^(application\/pdf|image\/)/;

function formatSize(kb: number | null): string {
  if (kb === null || kb === undefined) return 'Unknown size';
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function WorkspaceDocumentsTab({ application }: WorkspaceDocumentsTabProps) {
  // Documents hang off the application (candidate_files.application_id), so the
  // list is fetched per application rather than per candidate.
  const { files, isLoading, isError, refetch } = useCandidateFiles(application?.id);
  const fileAction = useFileAction();
  const [previewFile, setPreviewFile] = React.useState<CandidateFile | null>(null);

  if (!application) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No application selected.
      </div>
    );
  }

  const otherFiles = files.filter((f) => f.fileType !== 'RESUME');

  const renderRow = (file: CandidateFile) => {
    const canPreview = !!file.mimeType && PREVIEWABLE.test(file.mimeType);
    return (
      <div
        key={file.id}
        className="flex items-center justify-between gap-3 p-4 border rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-emerald-50 p-2 text-primary shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-black max-w-[200px] sm:max-w-[300px] truncate">
              {file.fileName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {file.fileType} • {formatSize(file.fileSizeKb)} •{' '}
              {new Date(file.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canPreview && (
            <Button
              size="icon"
              variant="ghost"
              title="Preview"
              disabled={fileAction.isPending}
              onClick={() => setPreviewFile(file)}
              className="h-8 w-8 cursor-pointer text-neutral-400 hover:text-black"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            title="Download"
            disabled={fileAction.isPending}
            onClick={() => fileAction.mutate({ file, mode: 'download' })}
            className="h-8 w-8 cursor-pointer text-neutral-400 hover:text-black"
          >
            {fileAction.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-neutral-200">
        <CardHeader className="bg-neutral-50/20 border-b p-6">
          <CardTitle className="text-base font-bold">Resume</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : isError ? (
            <div className="text-xs text-red-600 flex items-center gap-2">
              Could not load documents.
              <Button size="xs" variant="outline" onClick={() => refetch()} className="cursor-pointer">
                Retry
              </Button>
            </div>
          ) : (
            <ResumePreview files={files} />
          )}
        </CardContent>
      </Card>
      <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />

      <Card className="border-neutral-200">
        <CardHeader className="bg-neutral-50/20 border-b p-6">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            Other Documents
            <Button size="sm" variant="outline" className="h-8 text-xs cursor-pointer">
              Upload Document
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : otherFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No other documents uploaded.</p>
          ) : (
            <div className="space-y-3">{otherFiles.map(renderRow)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
