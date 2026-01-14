// 任务相关接口定义

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
