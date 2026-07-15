'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { opportunitiesApi } from '@/src/api/opportunities';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Clock, Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/src/features/candidate-portal/hooks/useDebounce';

export default function JobListingPage() {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('ALL');
  const [workMode, setWorkMode] = useState<string>('ALL');
  
  const debouncedSearch = useDebounce(search, 500);

  const { data: allRes } = useQuery({
    queryKey: ['public-opportunities-all'],
    queryFn: () => opportunitiesApi.findPublic(),
  });
  const allOpportunities = allRes?.data ?? [];

  const departmentsRes = React.useMemo(() => {
    const map = new Map<string, string>();
    allOpportunities.forEach((opp: any) => {
      if (opp.departmentId && opp.departmentName && !map.has(opp.departmentId)) {
        map.set(opp.departmentId, opp.departmentName);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [allOpportunities]);

  const { data: jobsRes, isLoading } = useQuery({
    queryKey: ['public-opportunities', debouncedSearch, departmentId, workMode],
    queryFn: () => opportunitiesApi.findPublic({
      search: debouncedSearch || undefined,
      departmentId: departmentId !== 'ALL' ? departmentId : undefined,
      workMode: workMode !== 'ALL' ? workMode : undefined,
    }),
  });
  const jobs = jobsRes?.data ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 pt-20 pb-12 px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Open Positions</h1>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input 
                placeholder="Search jobs..." 
                className="pl-9 h-10" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {departmentsRes?.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Work Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Work Modes</SelectItem>
                <SelectItem value="REMOTE">Remote</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="ON_SITE">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Listing */}
      <div className="mx-auto max-w-5xl px-6 mt-8">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-neutral-200 border-dashed">
            <Briefcase className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900">No jobs found</h3>
            <p className="text-sm text-neutral-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job: any) => (
              <Card key={job.opportunityId} className="hover:border-primary/40 transition-colors shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900 mb-2">
                        <Link href={`/jobs/${job.opportunityId}`} className="hover:text-primary transition-colors">
                          {job.name}
                        </Link>
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-neutral-400" /> {job.departmentName || 'General'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-neutral-400" /> {job.location || 'Flexible'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-neutral-400" /> {job.employmentType?.replace('_', ' ') || 'Full Time'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-neutral-100 font-semibold uppercase tracking-wider text-[10px]">
                        {job.workMode?.replace('_', ' ')}
                      </Badge>
                      <Link href={`/jobs/${job.opportunityId}`}>
                        <Button className="cursor-pointer">Apply Now</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
