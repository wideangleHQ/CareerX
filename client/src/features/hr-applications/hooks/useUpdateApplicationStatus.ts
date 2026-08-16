import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/src/api/applications';
import { toast } from 'sonner';
import type { ApplicationStatus } from '@/src/api/types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  INTERVIEWED: 'Interviewed',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  OFFER_RELEASED: 'Offer Released',
  JOINED: 'Joined',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: ApplicationStatus; reason?: string }) =>
      applicationsApi.updateStatus(id, { status, reason }),
    onSuccess: (_data, variables) => {
      toast.success(`Status updated to ${STATUS_LABELS[variables.status] ?? variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-details', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['recent-applications-widget'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['today-interviews'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Unable to update candidate status. Please try again.');
    },
  });
}
export default useUpdateApplicationStatus;
