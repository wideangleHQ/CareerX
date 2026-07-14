import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import type { ApplicationStatus } from '@/src/api/types';

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: ApplicationStatus; reason?: string }) =>
      applicationsApi.updateStatus(id, { status, reason }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-details', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pending-applications-widget'] });
    },
  });
}
export default useUpdateApplicationStatus;
