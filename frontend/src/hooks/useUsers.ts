import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';

// ============ 用户相关 Hooks ============

/**
 * 获取用户列表
 */
export const useUsers = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  dept_id?: number;
}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiService.getUsers(params),
  });
};

/**
 * 获取用户详情
 */
export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiService.getUserById(id),
    enabled: !!id,
  });
};

/**
 * 创建用户
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      username: string;
      full_name: string;
      dept_id: number;
      role: string;
    }) => apiService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * 更新用户
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: {
      id: number;
      data: {
        full_name: string;
        dept_id: number;
        role: string;
      };
    }) => apiService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * 删除用户
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * 重置用户密码
 */
export const useResetPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.resetUserPassword(id),
    onSuccess: () => {
      // 密码重置成功后，可以选择是否刷新用户列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ============ 部门相关 Hooks ============

/**
 * 获取所有部门
 */
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.getDepartments(),
  });
};

/**
 * 创建部门
 */
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      dept_name: string;
      dept_code: string;
    }) => apiService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      // 部门变化后，也需要刷新用户列表
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * 更新部门
 */
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: {
      id: number;
      data: {
        dept_name: string;
        dept_code: string;
      };
    }) => apiService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * 删除部门
 */
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
