import { useQuery } from '@tanstack/react-query';
import { offersApi } from '@/src/api/offers';
import type { QueryOffersParams } from '@/src/api/types';

export const offerKeys = {
  all: ['offers'] as const,
  lists: () => [...offerKeys.all, 'list'] as const,
  list: (filters: QueryOffersParams) => [...offerKeys.lists(), filters] as const,
  details: () => [...offerKeys.all, 'detail'] as const,
  detail: (id: string) => [...offerKeys.details(), id] as const,
  stats: () => [...offerKeys.all, 'stats'] as const,
  byApplication: (applicationId: string) => [...offerKeys.all, 'application', applicationId] as const,
};

export const useOffers = (filters: QueryOffersParams) => {
  return useQuery({
    queryKey: offerKeys.list(filters),
    queryFn: () => offersApi.findAll(filters),
  });
};

export const useOffer = (id: string) => {
  return useQuery({
    queryKey: offerKeys.detail(id),
    queryFn: () => offersApi.findOne(id),
    enabled: !!id,
  });
};

export const useOfferStats = () => {
  return useQuery({
    queryKey: offerKeys.stats(),
    queryFn: () => offersApi.getStats(),
  });
};

export const useOfferByApplication = (applicationId: string) => {
  return useQuery({
    queryKey: offerKeys.byApplication(applicationId),
    queryFn: () => offersApi.getOfferByApplication(applicationId),
    enabled: !!applicationId,
  });
};
