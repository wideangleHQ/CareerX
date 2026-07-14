import { useQuery } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { interviewsApi } from '@/src/api/interviews';
import { offersApi } from '@/src/api/offers';
import { opportunitiesApi } from '@/src/api/opportunities';

export function useDashboardStats() {
  const totalApps = useQuery({
    queryKey: ['dashboard', 'count-total-apps'],
    queryFn: () => applicationsApi.findAll({ limit: 1 }),
  });

  const newApps = useQuery({
    queryKey: ['dashboard', 'count-new-apps'],
    queryFn: () => applicationsApi.findAll({ status: 'NEW', limit: 1 }),
  });

  const selectedApps = useQuery({
    queryKey: ['dashboard', 'count-selected-apps'],
    queryFn: () => applicationsApi.findAll({ status: 'SELECTED', limit: 1 }),
  });

  const interviews = useQuery({
    queryKey: ['dashboard', 'count-interviews'],
    queryFn: () => interviewsApi.findAll({ isBooked: true }),
  });

  const offerStats = useQuery({
    queryKey: ['dashboard', 'offer-stats'],
    queryFn: () => offersApi.getStats(),
  });

  const opportunityStats = useQuery({
    queryKey: ['dashboard', 'opportunity-stats'],
    queryFn: () => opportunitiesApi.getStats(),
  });

  const isLoading =
    totalApps.isLoading ||
    newApps.isLoading ||
    selectedApps.isLoading ||
    interviews.isLoading ||
    offerStats.isLoading ||
    opportunityStats.isLoading;

  return {
    isLoading,
    totalApplications: totalApps.data?.total ?? 0,
    newApplications: newApps.data?.total ?? 0,
    selectedCount: selectedApps.data?.total ?? 0,
    interviewsScheduled: interviews.data?.data?.length ?? 0,
    offers: offerStats.data?.data ?? null,
    opportunities: opportunityStats.data?.data ?? null,
  };
}
