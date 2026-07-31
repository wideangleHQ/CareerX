import React from 'react';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import type { HiringOpportunity, OpportunityStatus } from '@/src/api/types';
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

const ALL_STATUSES: { value: OpportunityStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-neutral-500',
  PUBLISHED: 'text-green-600',
  CLOSED: 'text-red-500',
  ARCHIVED: 'text-amber-600',
};

export function OpportunityActionsDropdown({ opportunity, onEdit, onPreview }: OpportunityActionsDropdownProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateOpportunityStatus();
  const deleteOp = useDeleteOpportunity();

  const canEdit = user?.permissions.includes('CAREER_ADMIN') || user?.permissions.includes('CAREER_EDIT');
  const canDelete = user?.permissions.includes('CAREER_ADMIN');

  const availableStatuses = ALL_STATUSES.filter((s) => s.value !== opportunity.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={onPreview} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4 text-primary" />
          <span>Preview</span>
        </DropdownMenuItem>

        {canEdit && (
          <>
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4 text-neutral-500" />
              <span>Edit Details</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <span className="text-sm">Change Status</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[160px]">
                {availableStatuses.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => updateStatus.mutate({ id: opportunity.id, status: s.value })}
                    disabled={updateStatus.isPending}
                    className={`cursor-pointer ${STATUS_COLORS[s.value] || ''}`}
                  >
                    <span>{s.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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
