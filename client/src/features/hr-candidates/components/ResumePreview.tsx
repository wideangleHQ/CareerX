'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink } from 'lucide-react';
import type { CandidateFile } from '@/src/api/types';

interface ResumePreviewProps {
  files: CandidateFile[];
}

export function ResumePreview({ files }: ResumePreviewProps) {
  const resume = files.find((f) => f.file_type === 'RESUME') || files[0];

  const handleDownload = () => {
    if (!resume) return;
    // Construct signed Supabase URL or link
    const url = `http://localhost:3000/api/v1/storage/resumes/${resume.storage_path}`; // Mock URL
    window.open(url, '_blank');
  };

  if (!resume) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-xs text-muted-foreground bg-neutral-50/30">
        No resume uploaded for this candidate application.
      </div>
    );
  }

  return (
    <Card className="border-neutral-200 bg-neutral-50/50 shadow-none">
      <CardContent className="p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-50 p-2.5 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-black max-w-[260px] truncate">{resume.file_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resume.file_size_kb ? `${resume.file_size_kb} KB` : 'Unknown size'} • {resume.file_type}
            </p>
          </div>
        </div>
        <Button size="xs" variant="outline" onClick={handleDownload} className="cursor-pointer">
          <Download className="h-3.5 w-3.5 mr-1" /> Download
        </Button>
      </CardContent>
    </Card>
  );
}
export default ResumePreview;
