import axiosClient from './client';
import type {
  Application,
  ApplicationListResponse,
  QueryApplicationsParams,
  ApplicationStatus,
  HrNote,
  InterviewFeedback,
} from './types';

export const applicationsApi = {
  create: async (payload: {
    fullName: string;
    email: string;
    mobileNumber: string;
    whatsappNumber?: string | null;
    departmentId: string;
    opportunityId?: string | null;
    selfDescription: string;
    experienceYears: number;
    resumePath: string;
    previousOrgProofPath?: string | null;
  }): Promise<{ success: boolean; data: Application }> => {
    const { data } = await axiosClient.post('/api/v1/applications', payload);
    return data;
  },

  findAll: async (params?: QueryApplicationsParams): Promise<ApplicationListResponse> => {
    const { data } = await axiosClient.get('/api/v1/applications', { params });
    return data;
  },

  findOne: async (id: string): Promise<{ success: boolean; data: Application }> => {
    const { data } = await axiosClient.get(`/api/v1/applications/${id}`);
    return data;
  },

  updateStatus: async (
    id: string,
    payload: { status: ApplicationStatus; reason?: string }
  ): Promise<{ success: boolean; data: Application }> => {
    const { data } = await axiosClient.patch(`/api/v1/applications/${id}/status`, payload);
    return data;
  },

  assignHr: async (
    id: string,
    payload: { hrId: string | null }
  ): Promise<{ success: boolean; data: Application }> => {
    const { data } = await axiosClient.patch(`/api/v1/applications/${id}/assign`, payload);
    return data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosClient.delete(`/api/v1/applications/${id}`);
    return data;
  },

  // Notes
  createNote: async (payload: {
    applicationId: string;
    note: string;
  }): Promise<{ success: boolean; data: HrNote }> => {
    const { data } = await axiosClient.post('/api/v1/hr-notes', payload);
    return data;
  },

  getNotes: async (applicationId: string): Promise<{ success: boolean; data: HrNote[] }> => {
    const { data } = await axiosClient.get(`/api/v1/hr-notes/application/${applicationId}`);
    return data;
  },

  // Feedback
  createFeedback: async (payload: {
    applicationId: string;
    rating: number;
    notes: string;
  }): Promise<{ success: boolean; data: InterviewFeedback }> => {
    const { data } = await axiosClient.post('/api/v1/interview-feedback', payload);
    return data;
  },

  getFeedback: async (params: {
    applicationId: string;
  }): Promise<{ success: boolean; data: InterviewFeedback[] }> => {
    const { data } = await axiosClient.get('/api/v1/interview-feedback', { params });
    return data;
  },
};
