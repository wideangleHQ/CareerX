import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { toast } from 'sonner';

export function useReassignInterviewer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, hrId }: { applicationId: string; hrId: string }) =>
      applicationsApi.reassignInterviewer(applicationId, hrId),
    onSuccess: (_data, variables) => {
      toast.success('Interviewer reassigned');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-details', variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['today-interviews'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Unable to reassign interviewer. Please try again.');
    },
  });
}
