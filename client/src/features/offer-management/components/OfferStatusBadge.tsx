import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { OfferStatus } from '@/src/api/types';

const STATUS_STYLES: Record<OfferStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 hover:bg-gray-100/80',
  GENERATED: 'bg-amber-100 text-amber-700 hover:bg-amber-100/80',
  RELEASED: 'bg-blue-100 text-blue-700 hover:bg-blue-100/80',
  ACCEPTED: 'bg-green-100 text-green-700 hover:bg-green-100/80',
  DECLINED: 'bg-red-100 text-red-700 hover:bg-red-100/80',
  CANCELLED: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100/80',
  EXPIRED: 'bg-orange-100 text-orange-700 hover:bg-orange-100/80',
  JOINED: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80',
};

interface OfferStatusBadgeProps {
  status: OfferStatus;
  className?: string;
}

export function OfferStatusBadge({ status, className = '' }: OfferStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`font-semibold border-transparent ${STATUS_STYLES[status] || 'bg-neutral-100 text-neutral-700'} ${className}`}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
