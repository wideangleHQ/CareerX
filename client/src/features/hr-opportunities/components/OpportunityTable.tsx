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
import { OpportunityStatusBadge } from './OpportunityStatusBadge';
import { OpportunityActionsDropdown } from './OpportunityActionsDropdown';
import type { HiringOpportunity } from '@/src/api/types';
import { Users, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OpportunityTableProps {
  opportunities: HiringOpportunity[];
  isLoading: boolean;
  onEdit: (opportunity: HiringOpportunity) => void;
  onPreview: (opportunity: HiringOpportunity) => void;
}

export function OpportunityTable({ opportunities, isLoading, onEdit, onPreview }: OpportunityTableProps) {
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

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-500">
        <div className="bg-neutral-100 p-4 rounded-full mb-4">
          <Calendar className="h-8 w-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">No opportunities found</h3>
        <p className="text-sm">Try adjusting your filters or create a new opportunity.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
            <TableHead className="font-semibold text-neutral-600">Opportunity</TableHead>
            <TableHead className="font-semibold text-neutral-600">Department</TableHead>
            <TableHead className="font-semibold text-neutral-600">Type & Level</TableHead>
            <TableHead className="font-semibold text-neutral-600 text-center">Pipeline</TableHead>
            <TableHead className="font-semibold text-neutral-600">Status</TableHead>
            <TableHead className="font-semibold text-neutral-600 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => (
            <TableRow key={opp.id} className="group">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-900">{opp.public_title}</span>
                  <span className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    Internal: {opp.internal_position}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 font-normal">
                  {opp.department?.name || 'Any'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-700">{opp.hiring_type.replace('_', ' ')}</span>
                  <span className="text-xs text-neutral-500">{opp.career_level.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-semibold text-blue-600">{opp._count?.applications || 0}</span>
                    <span className="text-[10px] text-neutral-500 uppercase">Apps</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 items-start">
                  <OpportunityStatusBadge status={opp.status} />
                  <span className="text-[11px] text-neutral-400">
                    Updated {format(new Date(opp.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <OpportunityActionsDropdown
                  opportunity={opp}
                  onEdit={() => onEdit(opp)}
                  onPreview={() => onPreview(opp)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
