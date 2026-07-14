import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { OfferStatusBadge } from './OfferStatusBadge';
import { OfferActionsDropdown } from './OfferActionsDropdown';
import type { Offer } from '@/src/api/types';
import { FileSignature } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface OfferTableProps {
  offers: Offer[];
  isLoading: boolean;
}

export function OfferTable({ offers, isLoading }: OfferTableProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-500">
        <div className="bg-neutral-100 p-4 rounded-full mb-4">
          <FileSignature className="h-8 w-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">No offers found</h3>
        <p className="text-sm">Try adjusting your filters or generate a new offer.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
              <TableHead className="font-semibold text-neutral-600">Candidate</TableHead>
              <TableHead className="font-semibold text-neutral-600">Department</TableHead>
              <TableHead className="font-semibold text-neutral-600">Offer Ref</TableHead>
              <TableHead className="font-semibold text-neutral-600">Joining Date</TableHead>
              <TableHead className="font-semibold text-neutral-600">Expiry</TableHead>
              <TableHead className="font-semibold text-neutral-600 text-right">Salary</TableHead>
              <TableHead className="font-semibold text-neutral-600">Status</TableHead>
              <TableHead className="font-semibold text-neutral-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id} className="group">
                <TableCell>
                  <Link href={`/offers/${offer.id}`} className="hover:underline">
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-900">
                        {offer.application?.candidate?.full_name || '—'}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {offer.application?.candidate?.email || '—'}
                      </span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 font-normal">
                    {offer.department?.name || offer.application?.department?.name || '—'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-mono text-neutral-700">{offer.offer_reference}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-700">
                    {offer.joining_date ? format(new Date(offer.joining_date), 'MMM d, yyyy') : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-700">
                    {offer.expiry_date ? format(new Date(offer.expiry_date), 'MMM d, yyyy') : '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-semibold text-neutral-900">
                    {offer.currency} {offer.salary.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <OfferStatusBadge status={offer.status} />
                    <span className="text-[11px] text-neutral-400">
                      {format(new Date(offer.updated_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <OfferActionsDropdown offer={offer} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 p-4">
        {offers.map((offer) => (
          <Link key={offer.id} href={`/offers/${offer.id}`} className="block">
            <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">
                    {offer.application?.candidate?.full_name || '—'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {offer.department?.name || '—'}
                  </p>
                </div>
                <OfferStatusBadge status={offer.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-neutral-500">Offer Ref</p>
                  <p className="font-mono text-neutral-700">{offer.offer_reference}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Salary</p>
                  <p className="font-semibold text-neutral-900">{offer.currency} {offer.salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Joining</p>
                  <p className="text-neutral-700">
                    {offer.joining_date ? format(new Date(offer.joining_date), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">Expiry</p>
                  <p className="text-neutral-700">
                    {offer.expiry_date ? format(new Date(offer.expiry_date), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <OfferActionsDropdown offer={offer} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
