import axiosClient from './client';
import type { InterviewSlot, SlotListResponse, QuerySlotsParams } from './types';

export const interviewsApi = {
  create: async (payload: {
    hrId: string;
    departmentId?: string;
    slotDate: string;
    slotTime: string;
  }): Promise<InterviewSlot> => {
    const { data } = await axiosClient.post('/api/v1/interview-slots', payload);
    return data;
  },

  bulkGenerate: async (payload: {
    hrId: string;
    departmentId?: string;
    startDate: string;
    endDate: string;
    times: string[]; // ['10:00', '11:00']
    daysOfWeek: number[]; // [1, 2, 3] (Monday, Tuesday, Wednesday)
    isRecurring: boolean;
  }): Promise<{ count: number }> => {
    const { data } = await axiosClient.post('/api/v1/interview-slots/bulk', payload);
    return data;
  },

  findAll: async (params?: QuerySlotsParams): Promise<SlotListResponse> => {
    const { data } = await axiosClient.get('/api/v1/interview-slots', { params });
    return data;
  },

  findAvailable: async (params?: { departmentId?: string; startDate?: string; endDate?: string }): Promise<SlotListResponse> => {
    const { data } = await axiosClient.get('/api/v1/interview-slots/available', { params });
    return data;
  },

  book: async (payload: {
    applicationId: string;
    slotId: string;
  }): Promise<{ success: boolean; data: { assignmentId: string } }> => {
    const { data } = await axiosClient.post('/api/v1/interview-slots/book', payload);
    return data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosClient.delete(`/api/v1/interview-slots/${id}`);
    return data;
  },
};
