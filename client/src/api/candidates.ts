import axiosClient from './client';
import type { Candidate, CandidateListResponse, QueryCandidatesParams } from './types';

export const candidatesApi = {
  create: async (payload: {
    fullName: string;
    email: string;
    mobileNumber: string;
    whatsappNumber?: string | null;
  }): Promise<{ success: boolean; data: Candidate }> => {
    const { data } = await axiosClient.post('/api/v1/candidates', payload);
    return data;
  },

  findAll: async (params?: QueryCandidatesParams): Promise<CandidateListResponse> => {
    const { data } = await axiosClient.get('/api/v1/candidates', { params });
    return data;
  },

  findOne: async (id: string): Promise<{ success: boolean; data: Candidate }> => {
    const { data } = await axiosClient.get(`/api/v1/candidates/${id}`);
    return data;
  },

  update: async (
    id: string,
    payload: Partial<Pick<Candidate, 'full_name' | 'email' | 'mobile_number' | 'whatsapp_number'>>
  ): Promise<{ success: boolean; data: Candidate }> => {
    const { data } = await axiosClient.patch(`/api/v1/candidates/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosClient.delete(`/api/v1/candidates/${id}`);
    return data;
  },
};
