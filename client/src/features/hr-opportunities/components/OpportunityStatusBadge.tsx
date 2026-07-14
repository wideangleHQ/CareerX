import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { OpportunityStatus } from '@/src/api/types';

interface OpportunityStatusBadgeProps {
  status: OpportunityStatus;
  className?: string;
}

export function OpportunityStatusBadge({ status, className = '' }: OpportunityStatusBadgeProps) {
  const getBadgeStyle = (status: OpportunityStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-700 hover:bg-green-100/80';
      case 'CLOSED':
        return 'bg-red-100 text-red-700 hover:bg-red-100/80';
      case 'ARCHIVED':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100/80';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getLabel = (status: OpportunityStatus) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <Badge variant="outline" className={`font-semibold border-transparent ${getBadgeStyle(status)} ${className}`}>
      {getLabel(status)}
    </Badge>
  );
}
