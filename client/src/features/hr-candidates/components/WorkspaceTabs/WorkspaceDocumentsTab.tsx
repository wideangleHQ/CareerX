import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResumePreview } from '../ResumePreview';
import type { Application } from '@/src/api/types';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkspaceDocumentsTabProps {
  application: Application | null;
}

export function WorkspaceDocumentsTab({ application }: WorkspaceDocumentsTabProps) {
  if (!application) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No application selected.
      </div>
    );
  }

  const files = application.files || [];
  const otherFiles = files.filter(f => f.file_type !== 'RESUME');

  return (
    <div className="space-y-6">
      <Card className="border-neutral-200">
        <CardHeader className="bg-neutral-50/20 border-b p-6">
          <CardTitle className="text-base font-bold">Resume</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResumePreview files={files} />
        </CardContent>
      </Card>

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
          {otherFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No other documents uploaded.</p>
          ) : (
            <div className="space-y-3">
              {otherFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-black max-w-[200px] sm:max-w-[300px] truncate">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {file.file_type} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer text-neutral-400 hover:text-black">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
