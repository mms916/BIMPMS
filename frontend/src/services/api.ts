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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    username?: string;
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
    parent_id?: number | null;
  }) {
    const response = await this.client.post('/departments', data);
    return response.data;
  }

  // 更新部门
  async updateDepartment(id: number, data: {
    dept_name: string;
    dept_code: string;
    parent_id?: number | null;
  }) {
    const response = await this.client.put(`/departments/${id}`, data);
    return response.data;
  }

  // 删除部门
  async deleteDepartment(id: number) {
    const response = await this.client.delete(`/departments/${id}`);
    return response.data;
  }

  // ============ 任务管理相关 ============

  // 获取任务列表
  async getTasks(params?: {
    project_id?: number;
    assigned_to?: number;
    status?: string;
    priority?: string;
    search?: string;
    include_children?: boolean;
  }) {
    const response = await this.client.get('/tasks', { params });
    return response.data;
  }

  // 获取任务详情
  async getTaskById(id: number) {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  // 获取项目的任务树
  async getProjectTasks(projectId: number) {
    const response = await this.client.get(`/tasks/project/${projectId}/tasks`);
    return response.data;
  }

  // 创建任务
  async createTask(data: {
    project_id: number;
    parent_id?: number | null;
    task_name: string;
    task_desc?: string;
    assigned_to?: number | null;
    start_date?: string;
    end_date?: string;
    estimated_hours?: number;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in_progress' | 'completed';
    progress?: number;
  }) {
    const response = await this.client.post('/tasks', data);
    return response.data;
  }

  // 更新任务
  async updateTask(id: number, data: {
    task_name?: string;
    task_desc?: string;
    assigned_to?: number | null;
    start_date?: string;
    end_date?: string;
    estimated_hours?: number;
    actual_hours?: number;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in_progress' | 'completed';
    progress?: number;
  }) {
    const response = await this.client.put(`/tasks/${id}`, data);
    return response.data;
  }

  // 删除任务
  async deleteTask(id: number) {
    const response = await this.client.delete(`/tasks/${id}`);
    return response.data;
  }

  // 获取我的任务
  async getMyTasks(params?: {
    status?: string;
    priority?: string;
    project_id?: number;
    search?: string;
  }) {
    const response = await this.client.get('/tasks/my', { params });
    return response.data;
  }

  // 获取我的任务统计
  async getMyTaskStats() {
    const response = await this.client.get('/tasks/my/stats');
    return response.data;
  }

  // 创建任务更新记录
  async createTaskUpdate(taskId: number, data: {
    new_progress?: number;
    new_status?: 'pending' | 'in_progress' | 'completed';
    hours_spent?: number;
    note?: string;
  }) {
    const response = await this.client.post(`/tasks/${taskId}/updates`, data);
    return response.data;
  }

  // 获取任务更新记录
  async getTaskUpdates(taskId: number) {
    const response = await this.client.get(`/tasks/${taskId}/updates`);
    return response.data;
  }

  // 计算项目进度（基于任务完成度）
  async calculateProjectProgress(projectId: number) {
    const response = await this.client.get(`/tasks/project/${projectId}/calculate-progress`);
    return response.data;
  }

  // 同步项目进度到项目台账
  async syncProjectProgress(projectId: number) {
    const response = await this.client.post(`/tasks/project/${projectId}/sync-progress`);
    return response.data;
  }

  // 计算所有项目的进度
  async calculateAllProjectsProgress() {
    const response = await this.client.get('/tasks/calculate-all-progress');
    return response.data;
  }

  // ============ 工作台相关 ============

  // 获取我参与的项目列表
  async getMyProjects(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    isOverdue?: boolean;
  }) {
    const response = await this.client.get('/projects/my', { params });
    return response.data;
  }

  // 获取本周工时统计
  async getWeeklyHours() {
    const response = await this.client.get('/tasks/my/weekly-hours');
    return response.data;
  }

  // ============ 通知相关 ============

  // 获取通知列表
  async getNotifications() {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  // 标记通知为已读
  async markNotificationRead(id: string) {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }

  // 标记所有通知为已读
  async markAllNotificationsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  // ============ 工作台相关 ============

  // 获取天气数据
  async getWeather(city?: string) {
    // 如果后端没有天气API，返回Mock数据
    try {
      const response = await this.client.get('/weather/current', { params: { city } });
      return response.data;
    } catch (error) {
      // 返回Mock数据作为降级方案
      return this.getMockWeatherData();
    }
  }

  // Mock天气数据
  private getMockWeatherData() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}/${day}`;
    };

    const getWeekDay = (date: Date) => {
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      return `星期${days[date.getDay()]}`;
    };

    return {
      temp: 26,
      tempMin: 20,
      tempMax: 28,
      text: '晴转多云',
      icon: 'sunny',
      updateTime: now.toISOString(),
      forecast: [
        {
          date: formatDate(now),
          text: '晴',
          tempMin: 20,
          tempMax: 28,
          aqi: '优',
          wind: '西南风5级',
        },
        {
          date: formatDate(tomorrow),
          text: '多云',
          tempMin: 19,
          tempMax: 23,
          aqi: '优',
          wind: '西南风5级',
        },
      ],
      currentDateTime: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${getWeekDay(now)}`,
    };
  }

  // 获取团队工作统计
  async getTeamStats(period?: string) {
    try {
      const response = await this.client.get('/tasks/team/stats', { params: { period } });
      return response.data;
    } catch (error) {
      // 返回Mock数据作为降级方案
      return this.getMockTeamStatsData();
    }
  }

  // Mock团队统计数据
  private getMockTeamStatsData() {
    return {
      members: [
        { userId: 1, userName: '张三', taskCount: 15, hours: 12 },
        { userId: 2, userName: '李四', taskCount: 18, hours: 15 },
        { userId: 3, userName: '王五', taskCount: 12, hours: 10 },
        { userId: 4, userName: '赵六', taskCount: 20, hours: 18 },
        { userId: 5, userName: '钱七', taskCount: 8, hours: 6 },
        { userId: 6, userName: '孙八', taskCount: 14, hours: 11 },
      ],
      period: '本周',
    };
  }

  // 获取任务完成情况统计
  async getTaskCompletionStats() {
    try {
      const response = await this.client.get('/tasks/completion/stats');
      return response.data;
    } catch (error) {
      // 返回Mock数据作为降级方案
      return this.getMockTaskCompletionData();
    }
  }

  // Mock任务完成数据
  private getMockTaskCompletionData() {
    const completed = 8;
    const inProgress = 6;
    const overdue = 2;
    const notStarted = 5;
    const total = completed + inProgress + overdue + notStarted;

    return {
      completed,
      inProgress,
      overdue,
      notStarted,
      total,
      completionRate: Math.round((completed / total) * 100),
    };
  }

  // 获取OKR指标
  async getOkrMetrics() {
    try {
      const response = await this.client.get('/okr/metrics');
      return response.data;
    } catch (error) {
      // 返回Mock数据作为降级方案
      return this.getMockOkrMetricsData();
    }
  }

  // Mock OKR指标数据
  private getMockOkrMetricsData() {
    return [
      { id: 1, name: '主承建鲁班奖，评优', type: 'actual' as const, progress: 60 },
      { id: 2, name: '工程项目管理优秀奖', type: 'target' as const, progress: 80 },
      { id: 3, name: '国家一级协会科技奖', type: 'completed' as const, progress: 100 },
      { id: 4, name: '省部级课题立项', type: 'actual' as const, progress: 45 },
      { id: 5, name: 'BIM技术应用示范项目', type: 'target' as const, progress: 70 },
    ];
  }
}

export const apiService = new ApiService();
export default apiService;
