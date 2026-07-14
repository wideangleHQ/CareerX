import { useQuery } from '@tanstack/react-query';
import { candidatesApi } from '@/src/api/candidates';
import { timelineApi } from '@/src/api/timeline';
import { offersApi } from '@/src/api/offers';

export function useCandidateWorkspace(candidateId: string) {
  // 1. Fetch Candidate Profile (includes applications)
  const { data: candidateRes, isLoading: isLoadingCandidate } = useQuery({
    queryKey: ['candidate-profile', candidateId],
    queryFn: () => candidatesApi.findOne(candidateId),
    enabled: !!candidateId,
  });

  const candidate = candidateRes?.data;
  const applications = (candidate as any)?.applications || [];
  
  // Default to the first application, or null if none
  const activeApplication = applications[0] || null;
  const activeApplicationId = activeApplication?.id;

  // 2. Fetch Timeline for active application
  const { data: timelineRes, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['candidate-timeline', activeApplicationId],
    queryFn: () => timelineApi.getTimelineByApplication(activeApplicationId!),
    enabled: !!activeApplicationId,
  });

  // 3. Fetch Activity for candidate
  const { data: activityRes, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['candidate-activity', candidateId],
    queryFn: () => timelineApi.getActivityByCandidate(candidateId),
    enabled: !!candidateId,
  });

  // 4. Fetch Offer for active application
  const { data: offerRes, isLoading: isLoadingOffer } = useQuery({
    queryKey: ['candidate-offer', activeApplicationId],
    queryFn: () => offersApi.getOfferByApplication(activeApplicationId!),
    enabled: !!activeApplicationId,
  });

  return {
    candidate,
    activeApplication,
    applications,
    
    timeline: timelineRes?.data || [],
    activity: activityRes?.data || [],
    offer: offerRes?.data || null,
    
    isLoading: isLoadingCandidate, // primary loading state
    isLoadingTimeline,
    isLoadingActivity,
    isLoadingOffer,
  };
}
