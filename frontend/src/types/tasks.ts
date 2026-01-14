// 任务相关类型定义

export interface Task {
  task_id: number;
  project_id: number;
  parent_id: number | null;
  task_name: string;
  task_desc: string | null;
  assigned_to: number | null;
  assignee_name?: string;
  assignee_avatar?: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  level: number;
  sort_order: number;
  created_by: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  children?: Task[];
  project_name?: string;
  is_overdue?: number;
}

export interface TaskUpdate {
  update_id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string | null;
  old_progress: number | null;
  new_progress: number | null;
  old_status: string | null;
  new_status: string | null;
  hours_spent: number;
  note: string | null;
  created_at: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface CreateTaskDto {
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
}

export interface UpdateTaskDto {
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
}

export interface CreateTaskUpdateDto {
  new_progress?: number;
  new_status?: 'pending' | 'in_progress' | 'completed';
  hours_spent?: number;
  note?: string;
}

export interface TaskFilters {
  project_id?: number;
  assigned_to?: number;
  status?: string;
  priority?: string;
  search?: string;
  include_children?: boolean;
}

export interface PaginatedTasks {
  data: Task[];
  total: number;
}

export interface TaskApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ============ 工作台团队统计相关类型 ============

/**
 * 团队成员工作统计数据
 */
export interface TeamMemberStats {
  userId: number;
  userName: string;
  taskCount: number;    // 工作项数
  hours: number;        // 工时（天）
}

/**
 * 团队工作统计数据响应
 */
export interface TeamStatsData {
  members: TeamMemberStats[];
  period: string;       // 统计周期 (今天/本周/本月/自定义)
}

/**
 * 任务完成情况统计
 */
export interface TaskCompletionStats {
  completed: number;    // 已完成
  inProgress: number;   // 进行中
  overdue: number;      // 已逾期
  notStarted: number;   // 未开始
  total: number;        // 总数
  completionRate: number; // 完成率 (百分比)
}

/**
 * OKR指标项
 */
export interface OkrMetric {
  id: number;
  name: string;         // 指标名称
  type: 'actual' | 'target' | 'completed'; // 类型：实际/目标/完成
  progress: number;     // 进度百分比
}
