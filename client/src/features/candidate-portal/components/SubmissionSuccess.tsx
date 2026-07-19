'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Mail, Phone, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';
import { format } from 'date-fns';
import { formatSlotTime as formatSlotTimeOnly } from '@/src/lib/slot-time';

interface SubmissionSuccessProps {
  data: {
    application: {
      applicationCode: string;
      candidate: {
        fullName: string;
        email: string;
        mobileNumber: string;
      };
    };
    slotId: string | null;
  };
}

export function SubmissionSuccess({ data }: SubmissionSuccessProps) {
  const { data: slotRes } = useQuery({
    queryKey: ['slot-details', data.slotId],
    queryFn: async () => {
      const res = await interviewsApi.findAll(); // Simple fetch for verifying slots
      return res.data?.find((s) => s.id === data.slotId) || null;
    },
  });

  const slot = slotRes;

  const formatSlotTime = () => {
    if (!slot) return 'Loading scheduled time...';
    try {
      const date = new Date(slot.slotDate);
      const dateFormatted = format(date, 'EEEE, MMMM dd, yyyy');
      const timeFormatted = formatSlotTimeOnly(slot.slotTime);
      return `${dateFormatted} at ${timeFormatted}`;
    } catch {
      return 'Scheduled successfully';
    }
  };

  return (
    <Card className="w-full max-w-2xl border-neutral-200 text-center">
      <CardHeader className="p-8 bg-neutral-50/30 border-b flex flex-col items-center gap-3">
        <div className="rounded-full bg-green-50 p-4 text-green-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <CardTitle className="text-2xl font-bold text-black">Application Submitted!</CardTitle>
        <CardDescription className="text-neutral-500">
          Your application code is <span className="font-semibold text-black">{data.application.applicationCode}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="text-left space-y-4 max-w-md mx-auto">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Candidate Details</h3>
          <div className="space-y-3 bg-neutral-50 border rounded-xl p-4">
            <div className="flex items-center gap-2.5 text-sm text-black font-semibold">
              <span className="text-neutral-500 font-normal">Name:</span> {data.application.candidate.fullName}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-neutral-600">
              <Mail className="h-4 w-4 text-neutral-400" /> {data.application.candidate.email}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-neutral-600">
              <Phone className="h-4 w-4 text-neutral-400" /> {data.application.candidate.mobileNumber}
            </div>
          </div>

          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mt-6">Interview Schedule</h3>
          <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 text-left">
            <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary">Confirmed Interview Slot</p>
              <p className="text-sm text-neutral-700 mt-1">{formatSlotTime()}</p>
              <p className="text-xs text-neutral-500 mt-1">
                A calendar invitation with meeting links has been sent to your email.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 max-w-xs mx-auto">
          <Button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-1 cursor-pointer"
          >
            Submit Another Application <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
export default SubmissionSuccess;
