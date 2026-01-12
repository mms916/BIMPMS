import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

// 本地定义类型，避免模块导入问题
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    user_id: number;
    username: string;
    full_name: string;
    role: string;
    dept_id: number;
    dept_name?: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器：添加Token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：处理错误
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token过期或无效，清除本地存储并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 登录
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    const response = await this.client.get<ApiResponse<LoginResponse['user']>>('/auth/me');
    return response.data;
  }

  // 获取项目列表
  async getProjects(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    settlementStatus?: string;
    leaderId?: number;
    isOverdue?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  // 获取项目详情
  async getProjectById(id: number) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  // 创建项目
  async createProject(data: any) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  // 更新项目
  async updateProject(id: number, data: any) {
    const response = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  // 删除项目
  async deleteProject(id: number) {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data;
  }

  // 获取统计数据
  async getProjectStats() {
    const response = await this.client.get('/projects/stats');
    return response.data;
  }

  // 生成合同编号
  async generateContractNo() {
    const response = await this.client.get('/projects/contract/generate-no');
    return response.data;
  }

  // ============ 用户管理相关 ============

  // 获取用户列表
  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    dept_id?: number;
  }) {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  // 获取用户详情
  async getUserById(id: number) {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  // 创建用户
  async createUser(data: {
    username: string;
    full_name: string;
    dept_id: number;
    role: string;
  }) {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  // 更新用户
  async updateUser(id: number, data: {
    full_name: string;
    dept_id: number;
    role: string;
  }) {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  // 删除用户
  async deleteUser(id: number) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // 重置用户密码
  async resetUserPassword(id: number) {
    const response = await this.client.put(`/users/${id}/password`);
    return response.data;
  }

  // ============ 部门管理相关 ============

  // 获取所有部门
  async getDepartments() {
    const response = await this.client.get('/departments');
    return response.data;
  }

  // 创建部门
  async createDepartment(data: {
    dept_name: string;
    dept_code: string;
  }) {
    const response = await this.client.post('/departments', data);
    return response.data;
  }

  // 更新部门
  async updateDepartment(id: number, data: {
    dept_name: string;
    dept_code: string;
  }) {
    const response = await this.client.put(`/departments/${id}`, data);
    return response.data;
  }

  // 删除部门
  async deleteDepartment(id: number) {
    const response = await this.client.delete(`/departments/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
