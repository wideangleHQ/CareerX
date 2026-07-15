'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfferStatusBadge } from './OfferStatusBadge';
import { OfferTimeline } from './OfferTimeline';
import { ExtendOfferDialog } from './ExtendOfferDialog';
import { useUpdateOfferStatus } from '../hooks/useOfferMutations';
import { useAuth } from '@/src/context/AuthContext';
import { format } from 'date-fns';
import type { Offer, OfferStatus } from '@/src/api/types';
import {
  Send,
  CheckCircle,
  XCircle,
  Ban,
  UserCheck,
  CalendarPlus,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';

interface OfferDetailViewProps {
  offer: Offer;
}

export function OfferDetailView({ offer }: OfferDetailViewProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateOfferStatus();
  const [extendOpen, setExtendOpen] = useState(false);

  const canEdit = user?.permissions.includes('CAREER_ADMIN') || user?.permissions.includes('CAREER_EDIT');

  const handleStatusChange = (status: OfferStatus) => {
    updateStatus.mutate({ applicationId: offer.application_id, status });
  };

  const infoItems = [
    { label: 'Salary', value: `${offer.currency} ${offer.salary.toLocaleString()}` },
    { label: 'Joining Date', value: offer.joining_date ? format(new Date(offer.joining_date), 'MMM d, yyyy') : '—' },
    { label: 'Expiry Date', value: offer.expiry_date ? format(new Date(offer.expiry_date), 'MMM d, yyyy') : '—' },
    { label: 'Offer Reference', value: offer.offer_reference, mono: true },
    { label: 'Employment Type', value: offer.employment_type?.replace(/_/g, ' ') || '—' },
    { label: 'Location', value: offer.location || '—' },
    { label: 'Reporting Manager', value: offer.reporting_manager || '—' },
    { label: 'Department', value: offer.department?.name || offer.application?.department?.name || '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/offers">
            <Button variant="ghost" size="icon-sm" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-black flex items-center gap-3">
              {offer.application?.candidate?.full_name || 'Offer Details'}
              <OfferStatusBadge status={offer.status} />
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {offer.offer_reference} · Generated {format(new Date(offer.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            {offer.status === 'GENERATED' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('RELEASED')}
                disabled={updateStatus.isPending}
                className="cursor-pointer bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Release
              </Button>
            )}
            {offer.status === 'RELEASED' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('ACCEPTED')}
                  disabled={updateStatus.isPending}
                  className="cursor-pointer text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('DECLINED')}
                  disabled={updateStatus.isPending}
                  className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                </Button>
              </>
            )}
            {offer.status === 'ACCEPTED' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('JOINED')}
                disabled={updateStatus.isPending}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Mark Joined
              </Button>
            )}
            {['GENERATED', 'RELEASED'].includes(offer.status) && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExtendOpen(true)}
                  className="cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5 mr-1" /> Extend
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={updateStatus.isPending}
                  className="cursor-pointer text-neutral-600 hover:text-red-600"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Candidate Summary */}
      {offer.application?.candidate && (
        <Card className="border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Candidate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Name</p>
                <p className="text-sm font-semibold text-neutral-900">{offer.application.candidate.full_name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Email</p>
                <p className="text-sm text-neutral-700">{offer.application.candidate.email}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Mobile</p>
                <p className="text-sm text-neutral-700">{offer.application.candidate.mobile_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offer Information */}
      <Card className="border-neutral-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Offer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {infoItems.map((item) => (
              <div key={item.label}>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{item.label}</p>
                <p className={cn('text-sm font-semibold text-neutral-900', item.mono && 'font-mono text-neutral-700')}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Remarks */}
      {offer.remarks && (
        <Card className="border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{offer.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {offer.application_id && (
        <Card className="border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OfferTimeline applicationId={offer.application_id} />
          </CardContent>
        </Card>
      )}

      {extendOpen && (
        <ExtendOfferDialog
          open={extendOpen}
          onOpenChange={setExtendOpen}
          applicationId={offer.application_id}
        />
      )}
    </div>
  );
}
