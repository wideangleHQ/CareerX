import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';
import { useAuth } from '@/src/context/AuthContext';
import type { InterviewSlot } from '@/src/api/types';

export type UpcomingInterview = InterviewSlot & {
  candidateName: string;
  applicationCode: string;
  status: string;
  meetingMode: string;
};

export function useUpcomingInterviews(dateFilter?: string) {
  const { user } = useAuth();

  // Booked slots of the logged-in HR only. Server-side isBooked filter is
  // required: without it the default page (limit 20, date asc) fills up with
  // available/past slots and booked interviews never make it into the response.
  const { data: slotsRes, isLoading, error } = useQuery({
    queryKey: ['slots', 'booked', user?.sub],
    queryFn: () =>
      interviewsApi.findAll({
        isBooked: true,
        hrId: user!.sub,
        limit: 100,
        sortOrder: 'asc',
      }),
    enabled: !!user?.sub,
  });

  const slots = slotsRes?.data || [];

  let upcoming = slots.filter((s) => s.isBooked);

  // If a specific date is selected, filter by that date
  if (dateFilter) {
    upcoming = upcoming.filter((s) => String(s.slotDate).slice(0, 10).startsWith(dateFilter));
  } else {
    // Otherwise filter for today and future
    const todayStr = new Date().toISOString().split('T')[0]!;
    upcoming = upcoming.filter((s) => String(s.slotDate).slice(0, 10) >= todayStr);
  }

  // Sort chronologically
  upcoming.sort((a, b) => {
    const dateA = String(a.slotDate).slice(0, 10);
    const timeA = String(a.slotTime).includes('T') ? String(a.slotTime).split('T')[1] : String(a.slotTime);
    const dateB = String(b.slotDate).slice(0, 10);
    const timeB = String(b.slotTime).includes('T') ? String(b.slotTime).split('T')[1] : String(b.slotTime);
    return new Date(`${dateA}T${timeA}`).getTime() - new Date(`${dateB}T${timeB}`).getTime();
  });

  const interviews: UpcomingInterview[] = upcoming.map((slot) => ({
    ...slot,
    candidateName: slot.assignment?.application.candidate.fullName ?? 'Unknown candidate',
    applicationCode: slot.assignment?.application.applicationCode ?? '—',
    status: slot.assignment?.application.status ?? 'SLOT_BOOKED',
    meetingMode: 'Video Call',
  }));

  return {
    interviews,
    isLoading,
    error,
  };
}
