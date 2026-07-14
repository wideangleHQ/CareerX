import { useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi } from '@/src/api/opportunities';
import { opportunityKeys } from './useOpportunities';
import { toast } from 'sonner';
import type { HiringOpportunity, OpportunityStatus } from '@/src/api/types';

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<HiringOpportunity>) => opportunitiesApi.create(data),
    onSuccess: () => {
      toast.success('Opportunity created successfully');
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create opportunity');
    },
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HiringOpportunity> }) =>
      opportunitiesApi.update(id, data),
    onSuccess: (_, variables) => {
      toast.success('Opportunity updated successfully');
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update opportunity');
    },
  });
};

export const useUpdateOpportunityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OpportunityStatus }) =>
      opportunitiesApi.updateStatus(id, { status }),
    onSuccess: (_, variables) => {
      toast.success(`Opportunity status updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    },
  });
};

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => opportunitiesApi.remove(id),
    onSuccess: () => {
      toast.success('Opportunity deleted successfully');
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete opportunity');
    },
  });
};
