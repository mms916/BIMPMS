/**
 * 通知类型定义
 */

export type NotificationType =
  | 'task_overdue'        // 任务逾期
  | 'task_assigned'       // 任务分配
  | 'task_status_changed' // 任务状态变更
  | 'project_overdue'     // 项目逾期
  | 'comment_mentioned';  // 评论提及

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: number;
  projectId?: number;
  taskName?: string;
  projectName?: string;
  isRead: boolean;
  createdAt: string;
  priority: NotificationPriority;
}
