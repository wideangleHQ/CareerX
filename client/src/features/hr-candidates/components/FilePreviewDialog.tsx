'use client';

import React from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CandidateFile } from '@/src/api/types';
import { useFileUrl } from '../hooks/useCandidateFiles';

interface FilePreviewDialogProps {
  file: CandidateFile | null;
  onClose: () => void;
}

export function FilePreviewDialog({ file, onClose }: FilePreviewDialogProps) {
  const fileUrl = useFileUrl();
  React.useEffect(() => {
    fileUrl.reset();
    if (file) fileUrl.mutate(file);
  }, [file?.id]);

  const url = fileUrl.data?.data.url;
  const mimeType = file?.mimeType ?? '';
  const previewable = mimeType === 'application/pdf' || mimeType.startsWith('image/');

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[92dvh] w-[96vw] max-w-5xl p-0">
        <DialogHeader className="flex-row items-center justify-between border-b px-5 py-4">
          <DialogTitle className="truncate pr-8 text-sm">{file?.fileName ?? 'Document preview'}</DialogTitle>
          {url && (
            <div className="flex gap-1">
              <a href={url} download={file?.fileName} rel="noopener" title="Download" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-100"><Download className="h-4 w-4" /></a>
              <a href={url} target="_blank" rel="noopener noreferrer" title="Open in new tab" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-100"><ExternalLink className="h-4 w-4" /></a>
            </div>
          )}
        </DialogHeader>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-neutral-100 p-4">
          {fileUrl.isPending && <Loader2 className="h-6 w-6 animate-spin" />}
          {fileUrl.isError && <p className="text-sm text-destructive">Could not load this document.</p>}
          {url && previewable && mimeType === 'application/pdf' && <iframe src={url} title={file?.fileName} className="h-full w-full rounded border bg-white" />}
          {url && previewable && mimeType.startsWith('image/') && <img src={url} alt={file?.fileName} className="max-h-full max-w-full object-contain" />}
          {url && !previewable && <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline">Open this file in a new tab</a>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
