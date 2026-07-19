import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';
import type { InterviewSlot } from '@/src/api/types';

// For upcoming interviews, we typically need candidate and application details.
// Since `InterviewSlot` currently doesn't include the nested `slot_assignment` and `application` in types.ts (unless expanded),
// we will type assert or mock the augmented data for the UI.

export type UpcomingInterview = InterviewSlot & {
  candidateName?: string;
  applicationCode?: string;
  status?: string;
  meetingMode?: string;
};

export function useUpcomingInterviews(dateFilter?: string) {
  const { data: slotsRes, isLoading, error } = useQuery({
    queryKey: ['slots'], // In a real app, this should be a dedicated endpoint like `/api/v1/interviews/upcoming`
    queryFn: () => interviewsApi.findAll(),
  });

  const slots = slotsRes?.data || [];
  
  // Filter for booked slots only
  let upcoming = slots.filter(s => s.isBooked) as UpcomingInterview[];

  // If a specific date is selected, filter by that date
  if (dateFilter) {
    upcoming = upcoming.filter(s => String(s.slotDate).slice(0, 10).startsWith(dateFilter));
  } else {
    // Otherwise filter for today and future
    const todayStr = new Date().toISOString().split('T')[0]!;
    upcoming = upcoming.filter(s => String(s.slotDate).slice(0, 10) >= todayStr);
  }

  // Sort chronologically
  upcoming.sort((a, b) => {
    const dateA = String(a.slotDate).slice(0, 10);
    const timeA = String(a.slotTime).includes('T') ? String(a.slotTime).split('T')[1] : String(a.slotTime);
    const dateB = String(b.slotDate).slice(0, 10);
    const timeB = String(b.slotTime).includes('T') ? String(b.slotTime).split('T')[1] : String(b.slotTime);
    return new Date(`${dateA}T${timeA}`).getTime() - new Date(`${dateB}T${timeB}`).getTime();
  });

  // Augment with mock candidate data since the backend doesn't return it in findAll yet
  const augmentedUpcoming = upcoming.map((slot, index) => ({
    ...slot,
    candidateName: `Candidate ${index + 1}`,
    applicationCode: `APP-${1000 + index}`,
    status: 'Scheduled',
    meetingMode: 'Video Call',
  }));

  return {
    interviews: augmentedUpcoming,
    isLoading,
    error,
  };
}
