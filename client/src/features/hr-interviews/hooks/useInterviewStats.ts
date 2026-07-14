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

  const todayStr = new Date().toISOString().split('T')[0];

  const stats: InterviewStats = {
    totalSlots: slots.length,
    availableSlots: slots.filter((s) => !s.is_booked).length,
    bookedSlots: slots.filter((s) => s.is_booked).length,
    todayInterviews: slots.filter((s) => s.slot_date.startsWith(todayStr) && s.is_booked).length,
    upcomingInterviews: slots.filter((s) => s.slot_date > todayStr && s.is_booked).length,
    // Assuming we don't have explicit completed/cancelled status on slots yet, mocking for now
    completedInterviews: slots.filter((s) => s.slot_date < todayStr && s.is_booked).length,
    cancelledInterviews: 0, 
  };

  return {
    stats,
    isLoading,
    error,
  };
}
