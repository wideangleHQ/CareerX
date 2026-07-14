import axiosClient from './client';
import type { Offer, OfferStatus, QueryOffersParams, OfferListResponse, OfferStats } from './types';

export const offersApi = {
  findAll: async (params: QueryOffersParams): Promise<OfferListResponse> => {
    const { data } = await axiosClient.get('/api/v1/offers', { params });
    return data;
  },

  findOne: async (id: string): Promise<{ success: boolean; data: Offer }> => {
    const { data } = await axiosClient.get(`/api/v1/offers/${id}`);
    return data;
  },

  getOfferByApplication: async (applicationId: string): Promise<{ success: boolean; data: Offer | null }> => {
    try {
      const { data } = await axiosClient.get(`/api/v1/offers/application/${applicationId}`);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) return { success: true, data: null };
      throw error;
    }
  },

  getStats: async (): Promise<{ success: boolean; data: OfferStats }> => {
    const { data } = await axiosClient.get('/api/v1/offers/stats');
    return data;
  },

  generate: async (payload: {
    applicationId: string;
    salary: number;
    currency: string;
    joiningDate?: string;
    expiryDate?: string;
    employmentType?: string;
    location?: string;
    reportingManager?: string;
    remarks?: string;
  }): Promise<{ success: boolean; data: Offer }> => {
    const { data } = await axiosClient.post('/api/v1/offers/generate', payload);
    return data;
  },

  updateStatus: async (
    offerId: string,
    status: OfferStatus,
    reason?: string
  ): Promise<{ success: boolean; data: Offer }> => {
    const { data } = await axiosClient.patch(`/api/v1/offers/${offerId}/status`, { status, reason });
    return data;
  },

  extend: async (
    offerId: string,
    payload: { expiryDate: string; joiningDate?: string }
  ): Promise<{ success: boolean; data: Offer }> => {
    const { data } = await axiosClient.patch(`/api/v1/offers/${offerId}/extend`, payload);
    return data;
  },
};
