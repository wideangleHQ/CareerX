'use client';

import React from 'react';
import { useDashboardStats } from '@/src/features/hr-dashboard/hooks/useDashboardStats';
import { StatCard } from '@/src/features/hr-dashboard/components/StatCard';
import { PendingApplicationsWidget } from '@/src/features/hr-dashboard/components/PendingApplicationsWidget';
import { TodayInterviewsTable } from '@/src/features/hr-dashboard/components/TodayInterviewsTable';
import { QuickActions } from '@/src/features/hr-dashboard/components/QuickActions';
import { HiringPipelineWidget } from '@/src/features/hr-dashboard/components/HiringPipelineWidget';
import { RecentOffersWidget } from '@/src/features/hr-dashboard/components/RecentOffersWidget';
import { OpenOpportunitiesWidget } from '@/src/features/hr-dashboard/components/OpenOpportunitiesWidget';
import { UpcomingInterviewsWidget } from '@/src/features/hr-dashboard/components/UpcomingInterviewsWidget';
import { DepartmentOverviewWidget } from '@/src/features/hr-dashboard/components/DepartmentOverviewWidget';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  Users,
  Calendar,
  Award,
  FileSignature,
  Send,
  CheckCircle,
  UserCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const stats = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-black">Recruiter Workspace</h1>
        <p className="text-xs text-muted-foreground">
          Enterprise recruitment dashboard — pipeline, offers, and hiring activity.
        </p>
      </div>

      {/* KPI Stats */}
      {stats.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            description="All submitted applications"
            icon={<Briefcase className="h-4.5 w-4.5 text-primary" />}
          />
          <StatCard
            title="Pending Review"
            value={stats.newApplications}
            description="Awaiting initial evaluation"
            icon={<Users className="h-4.5 w-4.5 text-blue-600" />}
          />
          <StatCard
            title="Scheduled Interviews"
            value={stats.interviewsScheduled}
            description="Booked candidate slots"
            icon={<Calendar className="h-4.5 w-4.5 text-amber-600" />}
          />
          <StatCard
            title="Hired / Selected"
            value={stats.selectedCount}
            description="Accepted job offers"
            icon={<Award className="h-4.5 w-4.5 text-green-600" />}
          />
          <StatCard
            title="Offers Released"
            value={stats.offers?.RELEASED ?? 0}
            description="Awaiting candidate response"
            icon={<Send className="h-4.5 w-4.5 text-blue-500" />}
          />
          <StatCard
            title="Offers Accepted"
            value={stats.offers?.ACCEPTED ?? 0}
            description="Candidates who accepted"
            icon={<CheckCircle className="h-4.5 w-4.5 text-green-500" />}
          />
          <StatCard
            title="Joined"
            value={stats.offers?.JOINED ?? 0}
            description="Candidates who have joined"
            icon={<UserCheck className="h-4.5 w-4.5 text-emerald-600" />}
          />
          <StatCard
            title="Open Positions"
            value={stats.opportunities?.PUBLISHED ?? 0}
            description="Published opportunities"
            icon={<FileSignature className="h-4.5 w-4.5 text-purple-600" />}
          />
        </div>
      )}

      {/* Quick Actions + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <HiringPipelineWidget />
      </div>

      {/* Pending Applications + Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingApplicationsWidget />
        <UpcomingInterviewsWidget />
      </div>

      {/* Recent Offers + Open Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOffersWidget />
        <OpenOpportunitiesWidget />
      </div>

      {/* Today's Interviews + Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayInterviewsTable />
        <DepartmentOverviewWidget />
      </div>
    </div>
  );
}
