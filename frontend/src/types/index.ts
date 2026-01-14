// 用户角色枚举
export const enum UserRole {
  ADMIN = 'admin',
  DEPT_MANAGER = 'dept_manager',
  PROJECT_MANAGER = 'project_manager',
  EMPLOYEE = 'employee',
}

// 结算状态枚举
export const enum SettlementStatus {
  UNSETTLED = '未结算',
  PARTIAL = '部分结算',
  COMPLETED = '结算完成',
}

// 是否签订枚举
export const enum IsSigned {
  SIGNED = '已签订',
  UNSIGNED = '未签订',
}

// 项目类型枚举
export const enum ProjectType {
  CONSTRUCTION = '建筑施工',
  INTERIOR = '室内设计',
  LANDSCAPE = '园林景观',
  MUNICIPAL = '市政工程',
  OTHER = '其他',
}

// 用户接口
export interface User {
  user_id: number;
  username: string;
  full_name: string;
  avatar?: string;
  dept_id: number;
  role: UserRole;
  dept_name?: string;
  dept_code?: string;
  created_at: string;
  updated_at: string;
}

// 项目接口
export interface Project {
  project_id: number;
  contract_no: string;
  contract_name: string;
  start_date: string;
  end_date: string;
  contract_amount: string;
  progress: number;
  leader_id: number;
  settlement_status: SettlementStatus;
  participants: number[];
  is_signed: IsSigned;
  payment_amount: string;
  dept_id: number;
  project_type: ProjectType;
  remark?: string;
  created_by: number;
  created_at: string;
  updated_by?: number;
  updated_at: string;
}

// 项目扩展接口（包含关联数据）
export interface ProjectExtended extends Project {
  leader_name?: string;
  dept_name?: string;
  participant_names?: string[];
  is_overdue?: number;
  task_count?: number;
}

// 分页参数接口
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页结果接口
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// 统计数据接口
export interface ProjectStats {
  totalProjects: number;
  overdueProjects: number | string;
  totalAmount: number | string;
  settledProjects: number | string;
  settledRatio: number;
  avgProgress: number;
  paymentAmount: number;  // 已回款金额
}

// 登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: User;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 项目筛选参数接口
export interface ProjectFilters {
  search?: string;
  settlementStatus?: SettlementStatus;
  leaderId?: number;
  isOverdue?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
