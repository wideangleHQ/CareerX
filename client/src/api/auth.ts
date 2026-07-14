import axiosClient from './client';
import type { User } from './types';

export const authApi = {
  exchange: async (): Promise<{ authenticated: boolean }> => {
    const { data } = await axiosClient.post('/api/v1/auth/exchange');
    return data;
  },

  refresh: async (): Promise<{ authenticated: boolean }> => {
    const { data } = await axiosClient.post('/api/v1/auth/refresh');
    return data;
  },

  logout: async (): Promise<{ authenticated: boolean }> => {
    const { data } = await axiosClient.post('/api/v1/auth/logout');
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await axiosClient.get('/api/v1/auth/me');
    return data;
  },
};
