import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import type { Notification } from '../types/notifications';

/**
 * 获取通知列表
 */
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiService.getNotifications(),
    refetchInterval: 60000, // 每分钟自动刷新
  });
};

/**
 * 标记通知为已读
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * 标记所有通知为已读
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
