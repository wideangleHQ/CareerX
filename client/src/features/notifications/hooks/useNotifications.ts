import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/src/api/notifications';

export function useNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const queryClient = useQueryClient();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.findAll(params),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: res?.data || [],
    meta: res?.meta,
    isLoading,
    error,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarking: markReadMutation.isPending || markAllReadMutation.isPending,
  };
}
