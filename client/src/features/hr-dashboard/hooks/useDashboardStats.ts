import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/src/api/client';
import { opportunitiesApi } from '@/src/api/opportunities';
import type { ApplicationStatus } from '@/src/api/types';

export type StatusTally = Record<ApplicationStatus, number>;

export function useDashboardStats() {
  const stats = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/api/v1/dashboard/stats');
      return data;
    },
  });

  const offerStats = useQuery({
    queryKey: ['dashboard', 'offers-stats'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/api/v1/dashboard/offers-stats');
      return data;
    },
  });

  const hiringData = useQuery({
    queryKey: ['dashboard', 'hiring-count'],
    queryFn: () => opportunitiesApi.findPublic(),
  });

  const isLoading = stats.isLoading || offerStats.isLoading;
  const d = stats.data?.data;
  const o = offerStats.data?.data;

  return {
    isLoading,
    totalApplications: d?.totalApplications ?? 0,
    newApplications: d?.newApplications ?? 0,
    interviewsScheduled: d?.interviewsScheduled ?? 0,
    selectedCount: d?.selectedCount ?? 0,
    // Per-status tally powering the pipeline widget, so it reads from the same
    // snapshot as the KPI cards instead of issuing its own requests.
    byStatus: (d?.byStatus ?? null) as StatusTally | null,
    releasedOffers: o?.releasedOffers ?? 0,
    acceptedOffers: o?.acceptedOffers ?? 0,
    joinedCount: o?.joinedCount ?? 0,
    openPositions: hiringData.data?.data?.length ?? 0,
  };
}
