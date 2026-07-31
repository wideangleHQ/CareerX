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
    resume: File;
    previousOrgProof?: File | null;
  }): Promise<{ success: boolean; data: Application }> => {
    const formData = new FormData();
    formData.append('fullName', payload.fullName);
    formData.append('email', payload.email);
    formData.append('mobileNumber', payload.mobileNumber);
    if (payload.whatsappNumber) formData.append('whatsappNumber', payload.whatsappNumber);
    formData.append('departmentId', payload.departmentId);
    if (payload.opportunityId) formData.append('opportunityId', payload.opportunityId);
    formData.append('selfDescription', payload.selfDescription);
    formData.append('experienceYears', String(payload.experienceYears));
    formData.append('resume', payload.resume);
    if (payload.previousOrgProof) {
      formData.append('previousOrgProof', payload.previousOrgProof);
    }

    const { data } = await axiosClient.post('/api/v1/applications', formData);
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

  getTimeline: async (id: string): Promise<{ success: boolean; data: Array<Record<string, unknown>> }> => {
    const { data } = await axiosClient.get(`/api/v1/applications/${id}/timeline`);
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

  // Server allows the note's creator, or CAREER_ADMIN. Deletion is
  // intentionally disabled server-side, so no delete method is exposed.
  updateNote: async (
    id: string,
    note: string
  ): Promise<{ success: boolean; data: HrNote }> => {
    const { data } = await axiosClient.patch(`/api/v1/hr-notes/${id}`, { note });
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
