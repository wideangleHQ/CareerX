import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/src/api/client';
import { opportunitiesApi } from '@/src/api/opportunities';

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

  return {
    isLoading,
    totalApplications: stats.data?.data?.totalApplications ?? 0,
    newApplications: stats.data?.data?.newApplications ?? 0,
    selectedCount: stats.data?.data?.hiredCount ?? 0,
    interviewsScheduled: stats.data?.data?.interviewsScheduled ?? 0,
    offers: offerStats.data?.data ?? null,
    openPositions: hiringData.data?.data?.length ?? 0,
  };
}
