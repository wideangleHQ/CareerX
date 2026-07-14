import { useQuery } from '@tanstack/react-query';
import { interviewsApi } from '@/src/api/interviews';

export function useAvailableSlots(departmentId?: string) {
  return useQuery({
    queryKey: ['available-slots', departmentId],
    queryFn: async () => {
      if (!departmentId) return [];
      const res = await interviewsApi.findAvailable({ departmentId });
      return res.data || [];
    },
    enabled: !!departmentId,
  });
}
