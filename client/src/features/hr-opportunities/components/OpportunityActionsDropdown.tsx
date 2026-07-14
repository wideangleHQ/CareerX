import React, { useState } from 'react';
import { MoreHorizontal, Edit, CheckCircle, Archive, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { HiringOpportunity } from '@/src/api/types';
import {
  useUpdateOpportunityStatus,
  useDeleteOpportunity,
} from '../hooks/useOpportunityMutations';
import { useAuth } from '@/src/context/AuthContext';

interface OpportunityActionsDropdownProps {
  opportunity: HiringOpportunity;
  onEdit: () => void;
  onPreview: () => void;
}

export function OpportunityActionsDropdown({ opportunity, onEdit, onPreview }: OpportunityActionsDropdownProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateOpportunityStatus();
  const deleteOp = useDeleteOpportunity();

  const canEdit = user?.permissions.includes('CAREER_ADMIN') || user?.permissions.includes('CAREER_EDIT');
  const canDelete = user?.permissions.includes('CAREER_ADMIN');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={onPreview} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4 text-blue-500" />
          <span>Preview</span>
        </DropdownMenuItem>

        {canEdit && (
          <>
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4 text-neutral-500" />
              <span>Edit Details</span>
            </DropdownMenuItem>

            {opportunity.status === 'DRAFT' && (
              <DropdownMenuItem
                onClick={() => updateStatus.mutate({ id: opportunity.id, status: 'PUBLISHED' })}
                disabled={updateStatus.isPending}
                className="cursor-pointer"
              >
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Publish</span>
              </DropdownMenuItem>
            )}

            {opportunity.status === 'PUBLISHED' && (
              <DropdownMenuItem
                onClick={() => updateStatus.mutate({ id: opportunity.id, status: 'CLOSED' })}
                disabled={updateStatus.isPending}
                className="cursor-pointer"
              >
                <Archive className="mr-2 h-4 w-4 text-orange-500" />
                <span>Close Hiring</span>
              </DropdownMenuItem>
            )}

            {(opportunity.status === 'CLOSED' || opportunity.status === 'DRAFT') && (
              <DropdownMenuItem
                onClick={() => updateStatus.mutate({ id: opportunity.id, status: 'ARCHIVED' })}
                disabled={updateStatus.isPending}
                className="cursor-pointer"
              >
                <Archive className="mr-2 h-4 w-4 text-neutral-500" />
                <span>Archive</span>
              </DropdownMenuItem>
            )}
          </>
        )}

        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this opportunity?')) {
                  deleteOp.mutate(opportunity.id);
                }
              }}
              disabled={deleteOp.isPending}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
