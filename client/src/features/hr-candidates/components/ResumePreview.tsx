'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import type { CandidateFile } from '@/src/api/types';
import { useFileAction } from '../hooks/useCandidateFiles';
import { FilePreviewDialog } from './FilePreviewDialog';

interface ResumePreviewProps {
  files: CandidateFile[];
}

export function ResumePreview({ files }: ResumePreviewProps) {
  const resume = files.find((f) => f.fileType === 'RESUME') || files[0];
  const fileAction = useFileAction();
  const [previewOpen, setPreviewOpen] = React.useState(false);

  if (!resume) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-xs text-muted-foreground bg-neutral-50/30">
        No resume uploaded for this candidate application.
      </div>
    );
  }

  const isBusy = fileAction.isPending;

  return (
    <>
    <Card className="border-neutral-200 bg-neutral-50/50 shadow-none">
      <CardContent className="p-4 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-green-50 p-2.5 text-primary shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-black max-w-[260px] truncate">{resume.fileName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resume.fileSizeKb ? `${resume.fileSizeKb} KB` : 'Unknown size'} • {resume.fileType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="xs"
            variant="outline"
            disabled={isBusy}
            onClick={() => setPreviewOpen(true)}
            className="cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Preview
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={isBusy}
            onClick={() => fileAction.mutate({ file: resume, mode: 'download' })}
            className="cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1" />
            )}
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
    <FilePreviewDialog file={previewOpen ? resume : null} onClose={() => setPreviewOpen(false)} />
    </>
  );
}
export default ResumePreview;
