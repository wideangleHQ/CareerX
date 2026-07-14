import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HRNotesSection } from '../HRNotesSection';
import type { Application } from '@/src/api/types';

interface WorkspaceHRNotesTabProps {
  application: Application | null;
}

export function WorkspaceHRNotesTab({ application }: WorkspaceHRNotesTabProps) {
  if (!application) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No application selected.
      </div>
    );
  }

  return (
    <Card className="border-neutral-200 bg-neutral-50/30">
      <CardContent className="p-6">
        {/* We use the existing HRNotesSection which has the layout for viewing and adding notes */}
        <HRNotesSection applicationId={application.id} />
      </CardContent>
    </Card>
  );
}
