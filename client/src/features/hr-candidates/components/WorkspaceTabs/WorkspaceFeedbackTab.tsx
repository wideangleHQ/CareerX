import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InterviewFeedbackForm } from '../InterviewFeedbackForm';
import type { Application } from '@/src/api/types';

interface WorkspaceFeedbackTabProps {
  application: Application | null;
}

export function WorkspaceFeedbackTab({ application }: WorkspaceFeedbackTabProps) {
  if (!application) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        No application selected.
      </div>
    );
  }

  return (
    <Card className="border-neutral-200">
      <CardContent className="p-6">
        {/* We use the existing InterviewFeedbackForm which fetches and displays the feedback as well */}
        <InterviewFeedbackForm applicationId={application.id} />
      </CardContent>
    </Card>
  );
}
