'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { useAuth } from '@/src/context/AuthContext';
import { useReassignInterviewer } from '../hooks/useReassignInterviewer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface InterviewerDropdownProps {
  applicationId: string;
  currentInterviewerId: string | null;
  currentInterviewerName?: string | null;
  positionOwnerId: string | null;
  /** Reassignment only works once a real interview slot exists — the backend
   *  rejects it otherwise. Pass true only when interviewStatus === 'SCHEDULED'. */
  hasScheduledSlot: boolean;
  compact?: boolean;
}

export function InterviewerDropdown({
  applicationId,
  currentInterviewerId,
  currentInterviewerName,
  positionOwnerId,
  hasScheduledSlot,
  compact,
}: InterviewerDropdownProps) {
  const { user } = useAuth();
  const isPositionOwner = !!user?.sub && !!positionOwnerId && user.sub === positionOwnerId;
  const canReassign = isPositionOwner && hasScheduledSlot;

  const { data: eligibleRes, isLoading: isLoadingEligible } = useQuery({
    queryKey: ['eligible-interviewers'],
    queryFn: () => applicationsApi.getEligibleInterviewers(),
    staleTime: 5 * 60_000,
    enabled: canReassign,
  });

  const mutation = useReassignInterviewer();

  const eligible = React.useMemo(() => {
    const raw = eligibleRes?.data ?? [];
    const seen = new Set<string>();
    return raw.filter((emp) => {
      const key = emp.fullName.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [eligibleRes]);

  const handleChange = (hrId: string | null) => {
    if (!hrId || hrId === currentInterviewerId) return;
    mutation.mutate({ applicationId, hrId });
  };

  if (!canReassign) {
    return (
      <span className={cn('text-xs font-medium text-neutral-800', compact ? 'truncate' : '')}>
        {currentInterviewerName || 'Not Assigned'}
      </span>
    );
  }

  if (isLoadingEligible) {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
  }

  const displayName = eligible.find((e) => e.id === currentInterviewerId)?.fullName
    ?? currentInterviewerName
    ?? 'Select interviewer';

  return (
    <Select
      value={currentInterviewerId ?? undefined}
      onValueChange={handleChange}
      disabled={mutation.isPending}
    >
      <SelectTrigger
        className={cn(
          'h-8 text-xs font-medium',
          compact ? 'w-[140px]' : 'w-[200px]',
          mutation.isPending && 'opacity-60',
        )}
      >
        {mutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <span className="truncate">{displayName}</span>
        )}
      </SelectTrigger>
      <SelectContent>
        {eligible.map((emp) => (
          <SelectItem key={emp.id} value={emp.id} className="text-xs">
            {emp.fullName.trim()}
          </SelectItem>
        ))}
        {eligible.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No eligible interviewers
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
