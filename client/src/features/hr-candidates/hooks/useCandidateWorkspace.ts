import { useQuery } from '@tanstack/react-query';
import { candidatesApi } from '@/src/api/candidates';
import { applicationsApi } from '@/src/api/applications';
import { timelineApi } from '@/src/api/timeline';
import { offersApi } from '@/src/api/offers';

export function useCandidateWorkspace(candidateId: string, applicationId?: string) {
  const { data: candidateRes, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ['candidate-profile', candidateId],
    queryFn: () => candidatesApi.findOne(candidateId),
    enabled: !!candidateId,
  });

  const candidate = candidateRes?.data;

  const { data: applicationRes, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['application-details', applicationId],
    queryFn: () => applicationsApi.findOne(applicationId!),
    enabled: !!applicationId,
  });

  const { data: candidateAppsRes } = useQuery({
    queryKey: ['candidate-applications', candidateId],
    queryFn: () => applicationsApi.findAll({ candidateId, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: !!candidateId && !applicationId,
  });

  const candidateApplications = candidateAppsRes?.data ?? [];
  const activeApplication = applicationRes?.data ?? candidateApplications[0] ?? null;
  const activeApplicationId = activeApplication?.id;

  const { data: timelineRes, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['candidate-timeline', activeApplicationId],
    queryFn: () => timelineApi.getTimelineByApplication(activeApplicationId!),
    enabled: !!activeApplicationId,
  });

  const { data: activityRes, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['candidate-activity', candidateId],
    queryFn: () => timelineApi.getActivityByCandidate(candidateId),
    enabled: !!candidateId,
  });

  const { data: offerRes, isLoading: isLoadingOffer } = useQuery({
    queryKey: ['candidate-offer', activeApplicationId],
    queryFn: () => offersApi.getOfferByApplication(activeApplicationId!),
    enabled: !!activeApplicationId,
  });

  return {
    candidate,
    activeApplication,
    applications: candidateApplications,

    timeline: timelineRes?.data || [],
    activity: activityRes?.data || [],
    offer: offerRes?.data || null,

    isLoading: isLoadingCandidate || isLoadingApplication,
    isLoadingTimeline,
    isLoadingActivity,
    isLoadingOffer,
  };
}
