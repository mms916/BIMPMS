// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  DEPT_MANAGER = 'dept_manager',
  PROJECT_MANAGER = 'project_manager',
  EMPLOYEE = 'employee',
}

// 结算状态枚举
export enum SettlementStatus {
  UNSETTLED = '未结算',
  PARTIAL = '部分结算',
  COMPLETED = '结算完成',
}

// 是否签订枚举
export enum IsSigned {
  SIGNED = '已签订',
  UNSIGNED = '未签订',
}

// 项目类型枚举
export enum ProjectType {
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
  password: string;
  full_name: string;
  avatar?: string;
  dept_id: number;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

// 部门接口
export interface Department {
  dept_id: number;
  dept_name: string;
  dept_code: string;
  created_at: Date;
  updated_at: Date;
}

// 项目接口
export interface Project {
  project_id: number;
  contract_no: string;
  contract_name: string;
  start_date: Date;
  end_date: Date;
  contract_amount: number;
  progress: number;
  leader_id: number;
  settlement_status: SettlementStatus;
  participants: number[];
  is_signed: IsSigned;
  payment_amount: number;
  dept_id: number;
  project_type: ProjectType;
  remark?: string;
  created_by: number;
  created_at: Date;
  updated_by?: number;
  updated_at: Date;
}

// 项目扩展接口（包含关联数据）
export interface ProjectExtended extends Project {
  leader_name?: string;
  dept_name?: string;
  participant_names?: string[];
  is_overdue?: boolean;
}

// 用户偏好设置接口
export interface UserPreference {
  preference_id: number;
  user_id: number;
  module_name: string;
  field_config: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// JWT Payload接口
export interface JWTPayload {
  user_id: number;
  username: string;
  role: UserRole;
  dept_id: number;
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
  overdueProjects: number;
  totalAmount: number;
  settledProjects: number;
  settledRatio: number;
  avgProgress: number;
}
