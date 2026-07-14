import React from 'react';
import { useOpportunityStats } from '../hooks/useOpportunities';
import { Briefcase, FileText, CheckCircle, Archive, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function OpportunityStats() {
  const { data: res, isLoading } = useOpportunityStats();
  const stats = res?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Published',
      value: stats?.PUBLISHED || 0,
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      bg: 'bg-green-50',
    },
    {
      title: 'Draft',
      value: stats?.DRAFT || 0,
      icon: <FileText className="h-5 w-5 text-neutral-500" />,
      bg: 'bg-neutral-50',
    },
    {
      title: 'Closed',
      value: stats?.CLOSED || 0,
      icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
      bg: 'bg-orange-50',
    },
    {
      title: 'Total Applications',
      value: stats?.totalApplications || 0,
      icon: <Briefcase className="h-5 w-5 text-blue-500" />,
      bg: 'bg-blue-50',
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, i) => (
        <div key={i} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
            <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
          </div>
          <div className={`p-3 rounded-full ${stat.bg}`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
