import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ApplicationStatus } from '@/src/api/types';
import { cn } from '@/src/lib/utils';

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'NEW':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
      case 'SLOT_BOOKED':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
      case 'INTERVIEWED':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
      case 'SELECTED':
        return 'bg-green-600 text-white border-green-700 hover:bg-green-600';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
      case 'WITHDRAWN':
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-100';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'NEW':
        return 'New';
      case 'SLOT_BOOKED':
        return 'Slot Booked';
      case 'INTERVIEWED':
        return 'Interviewed';
      case 'SELECTED':
        return 'Selected';
      case 'REJECTED':
        return 'Rejected';
      case 'WITHDRAWN':
        return 'Withdrawn';
      default:
        return status;
    }
  };

  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5", getBadgeStyle(), className)}>
      {getLabel()}
    </Badge>
  );
}
export default StatusBadge;
