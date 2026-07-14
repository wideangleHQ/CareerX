import axiosClient from './client';
import type { ApplicationReportItem, InterviewReportItem } from './types';

export const reportsApi = {
  getApplicationsReport: async (params?: {
    department_id?: string;
    status?: string;
    assigned_hr_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApplicationReportItem[]> => {
    const { data } = await axiosClient.get('/api/v1/reports/applications', { params });
    return data;
  },

  getInterviewsReport: async (params?: {
    department_id?: string;
    assigned_hr_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<InterviewReportItem[]> => {
    const { data } = await axiosClient.get('/api/v1/reports/interviews', { params });
    return data;
  },

  exportReport: async (payload: {
    report_type: 'APPLICATIONS' | 'INTERVIEWS';
    format: 'EXCEL' | 'CSV';
    department_id?: string;
    status?: string;
    assigned_hr_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> => {
    const { data } = await axiosClient.post('/api/v1/reports/export', payload, {
      responseType: 'blob',
    });
    return data;
  },
};
