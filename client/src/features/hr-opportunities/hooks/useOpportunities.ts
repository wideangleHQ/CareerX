import { useQuery } from '@tanstack/react-query';
import { opportunitiesApi } from '@/src/api/opportunities';
import type { QueryOpportunitiesParams } from '@/src/api/types';

export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters: QueryOpportunitiesParams) => [...opportunityKeys.lists(), filters] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: string) => [...opportunityKeys.details(), id] as const,
  stats: () => [...opportunityKeys.all, 'stats'] as const,
};

export const useOpportunities = (filters: QueryOpportunitiesParams) => {
  return useQuery({
    queryKey: opportunityKeys.list(filters),
    queryFn: () => opportunitiesApi.findAll(filters),
  });
};

export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: () => opportunitiesApi.findOne(id),
    enabled: !!id,
  });
};

export const useOpportunityStats = () => {
  return useQuery({
    queryKey: opportunityKeys.stats(),
    queryFn: () => opportunitiesApi.getStats(),
  });
};
