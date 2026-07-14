'use client';

import React, { useState } from 'react';
import { useOpportunities } from '@/src/features/hr-opportunities/hooks/useOpportunities';
import { OpportunityFilters } from '@/src/features/hr-opportunities/components/OpportunityFilters';
import { OpportunityTable } from '@/src/features/hr-opportunities/components/OpportunityTable';
import { OpportunityStats } from '@/src/features/hr-opportunities/components/OpportunityStats';
import { CreateOpportunityDialog } from '@/src/features/hr-opportunities/components/CreateOpportunityDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PlusCircle, Briefcase } from 'lucide-react';
import type { OpportunityStatus } from '@/src/api/types';
import { useAuth } from '@/src/context/AuthContext';

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [departmentId, setDepartmentId] = useState<string>('ALL');

  // Pagination states
  const [limit] = useState(10);
  const [page, setPage] = useState(1);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [opportunityToEdit, setOpportunityToEdit] = useState<any>(null);

  const canCreate = user?.permissions.includes('CAREER_ADMIN') || user?.permissions.includes('CAREER_EDIT');

  const { data: response, isLoading } = useOpportunities({
    page,
    limit,
    search: search || undefined,
    status: status !== 'ALL' ? (status as OpportunityStatus) : undefined,
    departmentId: departmentId !== 'ALL' ? departmentId : undefined,
    sortField: 'updated_at',
    sortOrder: 'desc',
  });

  const opportunities = response?.data || [];
  const totalPages = response?.totalPages || 1;

  const handleClearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setDepartmentId('ALL');
    setPage(1);
  };

  const openEditWizard = (opp: any) => {
    setOpportunityToEdit(opp);
    setIsWizardOpen(true);
  };

  const openPreview = (opp: any) => {
    // In a real application, you might route to a preview page or open a preview dialog
    window.open(`/career-portal/jobs/${opp.id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-black flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-neutral-500" /> Hiring Opportunities
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your recruitment planning, job postings, and hiring pipeline.
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => { setOpportunityToEdit(null); setIsWizardOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Opportunity
          </Button>
        )}
      </div>

      <OpportunityStats />

      <OpportunityFilters
        search={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        status={status}
        onStatusChange={(val) => { setStatus(val); setPage(1); }}
        departmentId={departmentId}
        onDepartmentIdChange={(val) => { setDepartmentId(val); setPage(1); }}
        onClear={handleClearFilters}
      />

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <OpportunityTable 
          opportunities={opportunities} 
          isLoading={isLoading} 
          onEdit={openEditWizard}
          onPreview={openPreview}
        />

        {/* Pagination Toolbar */}
        {!isLoading && opportunities.length > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4 bg-neutral-50/50">
            <span className="text-xs font-semibold text-neutral-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isWizardOpen && (
        <CreateOpportunityDialog 
          open={isWizardOpen} 
          onOpenChange={setIsWizardOpen} 
          opportunityToEdit={opportunityToEdit} 
        />
      )}
    </div>
  );
}
