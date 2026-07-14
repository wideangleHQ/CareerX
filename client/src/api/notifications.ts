import axiosClient from './client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  meta: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
  };
}

export const notificationsApi = {
  findAll: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationListResponse> => {
    const { data } = await axiosClient.get('/api/v1/notifications', { params });
    return data;
  },

  markRead: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await axiosClient.patch(`/api/v1/notifications/${id}/read`);
    return data;
  },

  markAllRead: async (): Promise<{ success: boolean }> => {
    const { data } = await axiosClient.post('/api/v1/notifications/mark-all-read');
    return data;
  },
};
