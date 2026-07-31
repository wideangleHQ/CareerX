'use client';

import React from 'react';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Application, CandidateFile } from '@/src/api/types';
import { useCandidateFiles, useFileAction, useFileUrl } from '../../hooks/useCandidateFiles';

interface WorkspaceResumeTabProps {
  application: Application | null;
}

export function WorkspaceResumeTab({ application }: WorkspaceResumeTabProps) {
  const { files, isLoading } = useCandidateFiles(application?.id);
  const fileAction = useFileAction();
  const fileUrl = useFileUrl();

  const resume = files.find((f) => f.fileType === 'RESUME') ?? null;

  React.useEffect(() => {
    fileUrl.reset();
    if (resume) fileUrl.mutate(resume);
  }, [resume?.id]);

  const url = fileUrl.data?.data.url;
  const mimeType = resume?.mimeType ?? '';
  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  if (!application) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No application selected.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40 py-16">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-sm">
          <FileText className="h-6 w-6 text-neutral-300" />
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-700">No Resume Uploaded</p>
        <p className="mt-1 text-xs text-muted-foreground">
          This candidate has not uploaded a resume for this application.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{resume.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {resume.fileSizeKb ? `${resume.fileSizeKb} KB` : 'Unknown size'} &middot; {resume.fileType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 cursor-pointer text-xs"
            disabled={fileAction.isPending}
            onClick={() => fileAction.mutate({ file: resume, mode: 'download' })}
          >
            {fileAction.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Download
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-100 overflow-hidden" style={{ height: 'calc(100dvh - 260px)', minHeight: '400px' }}>
        {fileUrl.isPending && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {fileUrl.isError && (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            Could not load this document.
          </div>
        )}
        {url && isPdf && (
          <iframe
            src={url}
            title={resume.fileName}
            className="h-full w-full border-0 bg-white"
          />
        )}
        {url && isImage && (
          <div className="flex h-full items-center justify-center p-4">
            <img
              src={url}
              alt={resume.fileName}
              className="max-h-full max-w-full object-contain rounded"
            />
          </div>
        )}
        {url && !isPdf && !isImage && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <FileText className="h-10 w-10 text-neutral-300" />
            <p className="text-sm text-muted-foreground">
              This file type cannot be previewed inline.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 cursor-pointer"
            >
              Open in New Tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
