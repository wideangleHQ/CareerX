import axiosClient from './client';
import type {
  HiringOpportunity,
  OpportunityListResponse,
  QueryOpportunitiesParams,
  OpportunityStatus,
} from './types';

export const opportunitiesApi = {
  findPublic: async (params?: Record<string, string | undefined>): Promise<{ success: boolean; data: any[] }> => {
    const { data } = await axiosClient.get('/api/v1/opportunities/public', { params });
    return data;
  },

  create: async (payload: Partial<HiringOpportunity>): Promise<{ success: boolean; data: HiringOpportunity }> => {
    const { data } = await axiosClient.post('/api/v1/opportunities', payload);
    return data;
  },

  findAll: async (params?: QueryOpportunitiesParams): Promise<OpportunityListResponse> => {
    const { data } = await axiosClient.get('/api/v1/opportunities', { params });
    return data;
  },

  findOne: async (id: string): Promise<{ success: boolean; data: HiringOpportunity }> => {
    const { data } = await axiosClient.get(`/api/v1/opportunities/${id}`);
    return data;
  },

  update: async (
    id: string,
    payload: Partial<HiringOpportunity>
  ): Promise<{ success: boolean; data: HiringOpportunity }> => {
    const { data } = await axiosClient.patch(`/api/v1/opportunities/${id}`, payload);
    return data;
  },

  updateStatus: async (
    id: string,
    payload: { status: OpportunityStatus }
  ): Promise<{ success: boolean; data: HiringOpportunity }> => {
    const { data } = await axiosClient.patch(`/api/v1/opportunities/${id}/status`, payload);
    return data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosClient.delete(`/api/v1/opportunities/${id}`);
    return data;
  },
  
  getStats: async (): Promise<{ success: boolean; data: any }> => {
    const { data } = await axiosClient.get('/api/v1/opportunities/stats');
    return data;
  }
};
