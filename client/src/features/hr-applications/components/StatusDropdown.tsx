'use client';

import React, { useState } from 'react';
import { useUpdateApplicationStatus } from '../hooks/useUpdateApplicationStatus';
import { StatusBadge } from './StatusBadge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { ApplicationStatus } from '@/src/api/types';

const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  ACCEPTED: ['INTERVIEWED', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWED: ['SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
  SELECTED: ['OFFER_RELEASED', 'REJECTED', 'WITHDRAWN'],
  OFFER_RELEASED: ['JOINED', 'REJECTED', 'WITHDRAWN'],
  JOINED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  INTERVIEWED: 'Interviewed',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  OFFER_RELEASED: 'Offer Released',
  JOINED: 'Joined',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

interface StatusDropdownProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
  candidateName?: string;
  compact?: boolean;
}

export function StatusDropdown({ applicationId, currentStatus, candidateName, compact }: StatusDropdownProps) {
  const mutation = useUpdateApplicationStatus();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const transitions = STATUS_TRANSITIONS[currentStatus] || [];
  const isTerminal = transitions.length === 0;

  const handleSelect = (newStatus: ApplicationStatus) => {
    if (newStatus === 'REJECTED') {
      setRejectionReason('');
      setRejectDialog(true);
      return;
    }
    mutation.mutate({ id: applicationId, status: newStatus });
  };

  const confirmReject = () => {
    mutation.mutate(
      { id: applicationId, status: 'REJECTED', reason: rejectionReason || undefined },
      { onSettled: () => setRejectDialog(false) },
    );
  };

  if (isTerminal) {
    return <StatusBadge status={currentStatus} className={compact ? 'text-[9px]' : undefined} />;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={mutation.isPending}>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-md cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              mutation.isPending && "opacity-60 pointer-events-none",
            )}
          >
            {mutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-0.5" />
            ) : null}
            <StatusBadge status={currentStatus} className={compact ? 'text-[9px]' : undefined} />
            <ChevronDown className="h-3 w-3 text-neutral-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {transitions.filter((s) => s !== 'REJECTED' && s !== 'WITHDRAWN').map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleSelect(status)}
              className="cursor-pointer text-xs font-medium"
            >
              {STATUS_LABELS[status]}
            </DropdownMenuItem>
          ))}
          {transitions.includes('REJECTED') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleSelect('REJECTED')}
                className="cursor-pointer text-xs font-medium text-red-600 focus:text-red-600"
              >
                Reject
              </DropdownMenuItem>
            </>
          )}
          {transitions.includes('WITHDRAWN') && (
            <DropdownMenuItem
              onClick={() => handleSelect('WITHDRAWN')}
              className="cursor-pointer text-xs font-medium text-neutral-500 focus:text-neutral-500"
            >
              Withdraw
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rejectDialog} onOpenChange={(open) => { if (!open) setRejectDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">Reject Candidate?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {candidateName
                ? <>Are you sure you want to reject <strong>{candidateName}</strong>?</>
                : 'Are you sure you want to reject this candidate?'}
              {' '}This action cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Textarea
              placeholder="Rejection reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose>
              <Button variant="outline" size="sm" disabled={mutation.isPending}>Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmReject}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Rejecting...</>
              ) : (
                'Reject Candidate'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
