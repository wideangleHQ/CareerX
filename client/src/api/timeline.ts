import axiosClient from './client';
import type { TimelineEvent, ActivityEvent } from './types';

export const timelineApi = {
  getTimelineByApplication: async (applicationId: string): Promise<{ success: boolean; data: TimelineEvent[] }> => {
    const { data } = await axiosClient.get(`/api/v1/applications/${applicationId}/timeline`);
    return data;
  },

  getActivityByCandidate: async (candidateId: string): Promise<{ success: boolean; data: ActivityEvent[] }> => {
    const { data } = await axiosClient.get(`/api/v1/candidates/${candidateId}/activity`);
    return data;
  },
};
