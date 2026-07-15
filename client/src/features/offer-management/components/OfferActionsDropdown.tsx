import React from 'react';
import { MoreHorizontal, Send, CheckCircle, XCircle, Ban, UserCheck, Eye, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Offer, OfferStatus } from '@/src/api/types';
import { useUpdateOfferStatus } from '../hooks/useOfferMutations';
import { useAuth } from '@/src/context/AuthContext';
import Link from 'next/link';

interface OfferActionsDropdownProps {
  offer: Offer;
  onExtend?: () => void;
}

const VALID_TRANSITIONS: Record<string, { status: OfferStatus; label: string; icon: React.ReactNode; className?: string }[]> = {
  GENERATED: [
    { status: 'RELEASED', label: 'Release Offer', icon: <Send className="mr-2 h-4 w-4 text-blue-500" /> },
    { status: 'CANCELLED', label: 'Cancel Offer', icon: <Ban className="mr-2 h-4 w-4 text-neutral-500" />, className: 'text-red-600 focus:text-red-600' },
  ],
  RELEASED: [
    { status: 'ACCEPTED', label: 'Mark Accepted', icon: <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> },
    { status: 'DECLINED', label: 'Mark Declined', icon: <XCircle className="mr-2 h-4 w-4 text-red-500" /> },
    { status: 'CANCELLED', label: 'Cancel Offer', icon: <Ban className="mr-2 h-4 w-4 text-neutral-500" />, className: 'text-red-600 focus:text-red-600' },
  ],
  ACCEPTED: [
    { status: 'JOINED', label: 'Mark Joined', icon: <UserCheck className="mr-2 h-4 w-4 text-emerald-500" /> },
  ],
};

export function OfferActionsDropdown({ offer, onExtend }: OfferActionsDropdownProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateOfferStatus();

  const canEdit = user?.permissions.includes('CAREER_ADMIN') || user?.permissions.includes('CAREER_EDIT');
  const transitions = VALID_TRANSITIONS[offer.status] || [];
  const canExtend = ['GENERATED', 'RELEASED'].includes(offer.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/offers/${offer.id}`}>
            <Eye className="mr-2 h-4 w-4 text-blue-500" />
            <span>View Details</span>
          </Link>
        </DropdownMenuItem>

        {canEdit && transitions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {transitions.map((t) => (
              <DropdownMenuItem
                key={t.status}
                onClick={() => updateStatus.mutate({ applicationId: offer.application_id, status: t.status })}
                disabled={updateStatus.isPending}
                className={`cursor-pointer ${t.className || ''}`}
              >
                {t.icon}
                <span>{t.label}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {canEdit && canExtend && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExtend} className="cursor-pointer">
              <CalendarPlus className="mr-2 h-4 w-4 text-primary" />
              <span>Extend Offer</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
