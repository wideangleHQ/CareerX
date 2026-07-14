import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from '@/src/api/offers';
import { offerKeys } from './useOffers';
import { toast } from 'sonner';
import type { OfferStatus } from '@/src/api/types';
import type { GenerateOfferData, ExtendOfferData } from '../schemas/offer.schema';

export const useGenerateOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateOfferData) => offersApi.generate(data),
    onSuccess: () => {
      toast.success('Offer generated successfully');
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to generate offer');
    },
  });
};

export const useUpdateOfferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, status, reason }: { offerId: string; status: OfferStatus; reason?: string }) =>
      offersApi.updateStatus(offerId, status, reason),
    onSuccess: (_, variables) => {
      const label = variables.status.replace(/_/g, ' ').toLowerCase();
      toast.success(`Offer ${label} successfully`);
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update offer status');
    },
  });
};

export const useExtendOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: ExtendOfferData }) =>
      offersApi.extend(offerId, data),
    onSuccess: () => {
      toast.success('Offer extended successfully');
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to extend offer');
    },
  });
};
