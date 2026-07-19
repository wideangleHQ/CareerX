import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';

export interface InterviewStats {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  todayInterviews: number;
  upcomingInterviews: number;
  completedInterviews: number;
  cancelledInterviews: number;
}

export function useInterviewStats() {
  const { data: slotsRes, isLoading, error } = useQuery({
    queryKey: ['slots'],
    queryFn: () => interviewsApi.findAll(),
  });

  const slots = slotsRes?.data || [];
  const todayStr = new Date().toISOString().split('T')[0]!;

  const dateOf = (s: (typeof slots)[number]) => String(s.slotDate).slice(0, 10);

  const stats: InterviewStats = {
    totalSlots: slots.length,
    availableSlots: slots.filter((s) => !s.isBooked).length,
    bookedSlots: slots.filter((s) => s.isBooked).length,
    todayInterviews: slots.filter((s) => dateOf(s) === todayStr && s.isBooked).length,
    upcomingInterviews: slots.filter((s) => dateOf(s) > todayStr && s.isBooked).length,
    completedInterviews: slots.filter((s) => dateOf(s) < todayStr && s.isBooked).length,
    cancelledInterviews: 0,
  };

  return {
    stats,
    isLoading,
    error,
  };
}
