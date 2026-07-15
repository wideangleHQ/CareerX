import axiosClient from './client';
import type { Department } from './types';

export const departmentsApi = {
  getHiring: async (params?: any): Promise<any[]> => {
    const { data } = await axiosClient.get('/api/v1/departments/hiring', { params });
    return data;
  },

  getAll: async (): Promise<Department[]> => {
    const { data } = await axiosClient.get('/api/v1/departments');
    return data;
  },

  findAll: async (_params?: { limit?: number }): Promise<{ data: Department[] }> => {
    const { data } = await axiosClient.get('/api/v1/departments');
    return { data };
  },

  toggleHiring: async (id: string, isHiringEnabled: boolean): Promise<Department> => {
    const { data } = await axiosClient.patch(`/api/v1/departments/${id}/hiring`, {
      isHiringEnabled,
    });
    return data;
  },

  sync: async (): Promise<{ success: boolean; syncedCount: number }> => {
    const { data } = await axiosClient.post('/api/v1/departments/sync');
    return data;
  },
};
