import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import { ProjectFilters, PaginatedResult, ProjectExtended } from '../types';

export const useProjects = (filters?: ProjectFilters) => {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => apiService.getProjects(filters),
  });
};

export const useProjectStats = () => {
  return useQuery({
    queryKey: ['projectStats'],
    queryFn: () => apiService.getProjectStats(),
  });
};

export const useProjectById = (id: number) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => apiService.getProjectById(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
};

export const useGenerateContractNo = () => {
  return useQuery({
    queryKey: ['generateContractNo'],
    queryFn: () => apiService.generateContractNo(),
  });
};
