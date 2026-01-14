import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { Task, TaskStats, CreateTaskDto, UpdateTaskDto, TaskFilters } from '../types/tasks';

// 获取任务列表
export const useTasks = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => apiService.getTasks(filters),
  });
};

// 获取任务详情
export const useTaskById = (id: number) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => apiService.getTaskById(id),
    enabled: !!id,
  });
};

// 获取项目的任务树
export const useProjectTasks = (projectId: number) => {
  return useQuery({
    queryKey: ['projectTasks', projectId],
    queryFn: () => apiService.getProjectTasks(projectId),
    enabled: !!projectId,
  });
};

// 创建任务
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskDto) => apiService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
    },
  });
};

// 更新任务
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskDto }) =>
      apiService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
};

// 删除任务
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
    },
  });
};

// 获取我的任务
export const useMyTasks = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['myTasks', filters],
    queryFn: () => apiService.getMyTasks(filters),
  });
};

// 获取我的任务统计
export const useMyTaskStats = () => {
  return useQuery({
    queryKey: ['myTaskStats'],
    queryFn: () => apiService.getMyTaskStats(),
  });
};

// 创建任务更新记录
export const useCreateTaskUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: any }) =>
      apiService.createTaskUpdate(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
};

// 获取任务更新记录
export const useTaskUpdates = (taskId: number) => {
  return useQuery({
    queryKey: ['taskUpdates', taskId],
    queryFn: () => apiService.getTaskUpdates(taskId),
    enabled: !!taskId,
  });
};

// ============ 工作台相关 Hooks ============

/**
 * 获取我参与的项目
 */
export const useMyProjects = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  isOverdue?: boolean;
}) => {
  return useQuery({
    queryKey: ['my-projects', params],
    queryFn: () => apiService.getMyProjects(params),
  });
};

/**
 * 获取本周工时统计
 */
export const useWeeklyHours = () => {
  return useQuery({
    queryKey: ['weekly-hours'],
    queryFn: () => apiService.getWeeklyHours(),
  });
};

/**
 * 获取团队工作统计
 */
export const useTeamStats = (period?: string) => {
  return useQuery({
    queryKey: ['team-stats', period],
    queryFn: () => apiService.getTeamStats(period),
  });
};

/**
 * 获取任务完成情况统计
 */
export const useTaskCompletionStats = () => {
  return useQuery({
    queryKey: ['task-completion-stats'],
    queryFn: () => apiService.getTaskCompletionStats(),
  });
};

/**
 * 获取OKR指标
 */
export const useOkrMetrics = () => {
  return useQuery({
    queryKey: ['okr-metrics'],
    queryFn: () => apiService.getOkrMetrics(),
  });
};
