import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Task, TaskUpdate, TaskStats, CreateTaskDto, UpdateTaskDto, CreateTaskUpdateDto, TaskFilters } from '../models/task';

export class TaskService {
  // 获取任务列表
  async getTasks(filters: TaskFilters = {}): Promise<{ data: Task[]; total: number }> {
    const {
      project_id,
      assigned_to,
      status,
      priority,
      search,
      include_children = false
    } = filters;

    let query = `
      SELECT
        t.*,
        u1.full_name as assignee_name,
        u1.avatar as assignee_avatar,
        u2.full_name as creator_name,
        p.contract_name as project_name,
        CASE
          WHEN t.end_date < CURDATE() AND t.status != 'completed' THEN 1
          ELSE 0
        END as is_overdue
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.user_id
      LEFT JOIN users u2 ON t.created_by = u2.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(project_id);
    }
    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (search) {
      query += ' AND t.task_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY t.project_id, t.level, t.sort_order, t.task_id';

    const [rows] = await pool.query(query, params);
    const tasks = rows as any[];

    const total = tasks.length;

    // 如果需要构建树形结构
    if (include_children) {
      const taskMap = new Map<number, Task>();
      const rootTasks: Task[] = [];

      // 先创建所有任务的映射
      tasks.forEach(task => {
        taskMap.set(task.task_id, { ...task, children: [] });
      });

      // 构建树形结构
      tasks.forEach(task => {
        const taskWithChildren = taskMap.get(task.task_id)!;
        if (task.parent_id === null) {
          rootTasks.push(taskWithChildren);
        } else {
          const parent = taskMap.get(task.parent_id);
          if (parent) {
            parent.children!.push(taskWithChildren);
          }
        }
      });

      return { data: rootTasks, total };
    }

    return { data: tasks, total };
  }

  // 获取任务详情
  async getTaskById(id: number): Promise<Task | null> {
    const query = `
      SELECT
        t.*,
        u1.full_name as assignee_name,
        u1.avatar as assignee_avatar,
        u2.full_name as creator_name,
        p.contract_name as project_name,
        CASE
          WHEN t.end_date < CURDATE() AND t.status != 'completed' THEN 1
          ELSE 0
        END as is_overdue
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.user_id
      LEFT JOIN users u2 ON t.created_by = u2.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      WHERE t.task_id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return (rows as any[])[0] || null;
  }

  // 获取项目的任务树
  async getProjectTasks(projectId: number): Promise<Task[]> {
    const query = `
      SELECT
        t.*,
        u1.full_name as assignee_name,
        u1.avatar as assignee_avatar,
        u2.full_name as creator_name,
        p.contract_name as project_name,
        CASE
          WHEN t.end_date < CURDATE() AND t.status != 'completed' THEN 1
          ELSE 0
        END as is_overdue
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.user_id
      LEFT JOIN users u2 ON t.created_by = u2.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      WHERE t.project_id = ?
      ORDER BY t.level, t.sort_order, t.task_id
    `;
    const [rows] = await pool.query(query, [projectId]);
    const tasks = rows as any[];

    // 先构建任务映射（包含children数组）
    const taskMap = new Map<number, Task>();
    tasks.forEach(task => {
      taskMap.set(task.task_id, { ...task, children: [] });
    });

    // 重新计算所有有子任务的父任务的进度
    for (const task of tasks) {
      // 检查是否有子任务
      const hasChildren = tasks.some(t => t.parent_id === task.task_id);
      if (hasChildren) {
        // 计算子任务的平均进度
        const children = tasks.filter(t => t.parent_id === task.task_id);
        const avgProgress = children.length > 0
          ? Math.round(children.reduce((sum, child) => sum + (child.progress || 0), 0) / children.length)
          : 0;

        // 更新任务映射中的进度
        const taskInMap = taskMap.get(task.task_id);
        if (taskInMap) {
          taskInMap.progress = avgProgress;
        }

        // 同步更新数据库
        await pool.query(
          'UPDATE tasks SET progress = ? WHERE task_id = ?',
          [avgProgress, task.task_id]
        );
      }
    }

    // 构建树形结构
    const rootTasks: Task[] = [];

    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.task_id)!;
      if (task.parent_id === null) {
        rootTasks.push(taskWithChildren);
      } else {
        const parent = taskMap.get(task.parent_id);
        if (parent) {
          parent.children!.push(taskWithChildren);
        } else {
          // 父任务不存在，作为根任务处理
          rootTasks.push(taskWithChildren);
        }
      }
    });

    return rootTasks;
  }

  // 创建任务
  async createTask(dto: CreateTaskDto, userId: number): Promise<Task> {
    const {
      project_id,
      parent_id = null,
      task_name,
      task_desc = null,
      assigned_to = null,
      start_date = null,
      end_date = null,
      estimated_hours = 0,
      priority = 'medium',
      status = 'pending',
      progress = 0
    } = dto;

    // 计算任务层级
    let level = 0;
    if (parent_id) {
      const [parentRows] = await pool.query('SELECT level FROM tasks WHERE task_id = ?', [parent_id]);
      if ((parentRows as RowDataPacket[]).length > 0) {
        level = (parentRows as RowDataPacket[])[0].level + 1;
      }
    }

    // 获取同级任务的最大排序号
    let sortQuery: string;
    let sortParams: any[];
    if (parent_id === null) {
      sortQuery = 'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM tasks WHERE parent_id IS NULL';
      sortParams = [];
    } else {
      sortQuery = 'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM tasks WHERE parent_id = ?';
      sortParams = [parent_id];
    }
    const [sortRows] = await pool.query(sortQuery, sortParams);
    const sort_order = (sortRows as RowDataPacket[])[0].next_sort;

    const query = `
      INSERT INTO tasks (
        project_id, parent_id, task_name, task_desc, assigned_to,
        start_date, end_date, estimated_hours, priority, status, progress,
        level, sort_order, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      project_id, parent_id, task_name, task_desc, assigned_to,
      start_date, end_date, estimated_hours, priority, status, progress,
      level, sort_order, userId
    ];

    await pool.query(query, params);

    // 获取创建的任务
    const [rows] = await pool.query('SELECT LAST_INSERT_ID() as id');
    const insertId = (rows as RowDataPacket[])[0].id;

    const newTask = await this.getTaskById(insertId);
    if (!newTask) {
      throw new Error('创建任务后无法获取任务信息');
    }

    // 如果有父任务，更新父任务的进度
    if (parent_id !== null) {
      await this.updateParentProgress(insertId);
    }

    return newTask;
  }

  // 更新任务
  async updateTask(id: number, dto: UpdateTaskDto): Promise<Task> {
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      const task = await this.getTaskById(id);
      if (!task) {
        throw new Error('任务不存在');
      }
      return task;
    }

    params.push(id);
    await pool.query(`UPDATE tasks SET ${updates.join(', ')} WHERE task_id = ?`, params);

    // 如果更新了进度或状态，需要更新所有父任务的进度
    if (dto.progress !== undefined || dto.status !== undefined) {
      await this.updateParentProgress(id);
    }

    const updatedTask = await this.getTaskById(id);
    if (!updatedTask) {
      throw new Error('更新任务后无法获取任务信息');
    }
    return updatedTask;
  }

  // 删除任务
  async deleteTask(id: number): Promise<boolean> {
    // 先获取父任务ID，以便删除后更新父任务进度
    const [taskRows] = await pool.query('SELECT parent_id FROM tasks WHERE task_id = ?', [id]);
    const taskData = taskRows as any[];
    const parentId = taskData.length > 0 ? taskData[0].parent_id : null;

    // 检查是否有子任务
    const [childRows] = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE parent_id = ?', [id]);
    const childCount = (childRows as any[])[0].count;

    if (childCount > 0) {
      throw new Error('无法删除：该任务下还有子任务，请先删除子任务');
    }

    const [result] = await pool.query('DELETE FROM tasks WHERE task_id = ?', [id]);

    // 如果删除成功且有父任务，更新父任务的进度
    if ((result as any).affectedRows > 0 && parentId !== null) {
      await this.calculateTaskProgress(parentId);
      await this.updateParentProgress(parentId);
    }

    return (result as any).affectedRows > 0;
  }

  // 获取我的任务
  async getMyTasks(userId: number, filters: TaskFilters = {}): Promise<{ data: Task[]; total: number }> {
    const { status, priority, project_id, search } = filters;

    let query = `
      SELECT
        t.*,
        u1.full_name as assignee_name,
        u1.avatar as assignee_avatar,
        u2.full_name as creator_name,
        p.contract_name as project_name,
        CASE
          WHEN t.end_date < CURDATE() AND t.status != 'completed' THEN 1
          ELSE 0
        END as is_overdue
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.user_id
      LEFT JOIN users u2 ON t.created_by = u2.user_id
      LEFT JOIN projects p ON t.project_id = p.project_id
      WHERE t.assigned_to = ?
    `;

    const params: any[] = [userId];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(project_id);
    }
    if (search) {
      query += ' AND t.task_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY t.status, t.priority, t.end_date';

    const [rows] = await pool.query(query, params);
    const tasks = rows as Task[];

    return { data: tasks, total: tasks.length };
  }

  // 获取我的任务统计
  async getMyTaskStats(userId: number): Promise<TaskStats> {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN end_date < CURDATE() AND status != 'completed' THEN 1 ELSE 0 END) as overdue
      FROM tasks
      WHERE assigned_to = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    const row = rows as any;

    return {
      total: row.total || 0,
      pending: row.pending || 0,
      inProgress: row.inProgress || 0,
      completed: row.completed || 0,
      overdue: row.overdue || 0
    };
  }

  // 创建任务更新记录
  async createTaskUpdate(taskId: number, userId: number, dto: CreateTaskUpdateDto): Promise<TaskUpdate> {
    const { new_progress, new_status, hours_spent = 0, note = null } = dto;

    // 获取当前任务状态
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const query = `
      INSERT INTO task_updates (task_id, user_id, old_progress, new_progress, old_status, new_status, hours_spent, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      taskId, userId, task.progress, new_progress, task.status, new_status, hours_spent, note
    ];

    await pool.query(query, params);

    // 更新任务的进度和状态
    const updates: string[] = [];
    const updateParams: any[] = [];

    if (new_progress !== undefined) {
      updates.push('progress = ?');
      updateParams.push(new_progress);
    }
    if (new_status !== undefined) {
      updates.push('status = ?');
      updateParams.push(new_status);
    }
    if (hours_spent > 0) {
      updates.push('actual_hours = actual_hours + ?');
      updateParams.push(hours_spent);
    }

    if (updates.length > 0) {
      updateParams.push(taskId);
      await pool.query(`UPDATE tasks SET ${updates.join(', ')} WHERE task_id = ?`, updateParams);
    }

    // 获取创建的更新记录
    const [rows] = await pool.query('SELECT LAST_INSERT_ID() as id');
    const insertId = (rows as any)[0].id;

    const [updateRows] = await pool.query(`
      SELECT
        tu.*,
        u.full_name as user_name,
        u.avatar as user_avatar
      FROM task_updates tu
      LEFT JOIN users u ON tu.user_id = u.user_id
      WHERE tu.update_id = ?
    `, [insertId]);

    return (updateRows as any[])[0];
  }

  // 获取任务更新记录
  async getTaskUpdates(taskId: number): Promise<TaskUpdate[]> {
    const query = `
      SELECT
        tu.*,
        u.full_name as user_name,
        u.avatar as user_avatar
      FROM task_updates tu
      LEFT JOIN users u ON tu.user_id = u.user_id
      WHERE tu.task_id = ?
      ORDER BY tu.created_at DESC
    `;
    const [rows] = await pool.query(query, [taskId]);
    return rows as TaskUpdate[];
  }

  // 计算项目进度（基于所有任务的完成度）
  async calculateProjectProgress(projectId: number): Promise<number> {
    const query = `
      SELECT AVG(progress) as avg_progress
      FROM tasks
      WHERE project_id = ?
    `;
    const [rows] = await pool.query(query, [projectId]);
    const result = rows as any[];

    if (result.length === 0 || result[0].avg_progress === null) {
      return 0;
    }

    return Math.round(result[0].avg_progress);
  }

  // 计算所有项目的进度
  async calculateAllProjectsProgress(): Promise<{ project_id: number; progress: number }[]> {
    // 获取所有项目
    const [projectRows] = await pool.query('SELECT project_id FROM projects');
    const projects = projectRows as any[];

    const results: { project_id: number; progress: number }[] = [];

    // 为每个项目计算进度
    for (const project of projects) {
      const progress = await this.calculateProjectProgress(project.project_id);
      results.push({
        project_id: project.project_id,
        progress
      });

      // 更新项目进度到数据库
      await pool.query(
        'UPDATE projects SET progress = ? WHERE project_id = ?',
        [progress, project.project_id]
      );
    }

    return results;
  }

  // 计算任务进度（基于子任务的完成度）
  async calculateTaskProgress(taskId: number): Promise<number> {
    // 首先检查是否有子任务
    const [childRows] = await pool.query(
      'SELECT COUNT(*) as count FROM tasks WHERE parent_id = ?',
      [taskId]
    );
    const childCount = (childRows as any[])[0].count;

    // 如果没有子任务，返回当前进度（叶子任务）
    if (childCount === 0) {
      const task = await this.getTaskById(taskId);
      return task?.progress || 0;
    }

    // 如果有子任务，计算所有子任务的平均进度
    const [progressRows] = await pool.query(
      'SELECT AVG(progress) as avg_progress FROM tasks WHERE parent_id = ?',
      [taskId]
    );
    const result = progressRows as any[];
    const avgProgress = result[0].avg_progress !== null
      ? Math.round(result[0].avg_progress)
      : 0;

    // 更新当前任务的进度
    await pool.query(
      'UPDATE tasks SET progress = ? WHERE task_id = ?',
      [avgProgress, taskId]
    );

    return avgProgress;
  }

  // 递归更新所有父任务的进度
  async updateParentProgress(taskId: number): Promise<void> {
    let currentTaskId = taskId;

    while (currentTaskId) {
      // 获取当前任务的父任务ID
      const [taskRows] = await pool.query(
        'SELECT parent_id FROM tasks WHERE task_id = ?',
        [currentTaskId]
      );
      const taskData = taskRows as any[];

      if (taskData.length === 0 || taskData[0].parent_id === null) {
        break;
      }

      const parentId = taskData[0].parent_id;

      // 计算父任务的进度
      await this.calculateTaskProgress(parentId);

      // 继续向上更新
      currentTaskId = parentId;
    }
  }

  // 获取本周工时统计
  async getWeeklyHours(userId: number): Promise<{ total: number }> {
    // 获取本周一和今天的日期
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const mondayStr = monday.toISOString().split('T')[0];

    // 查询本周的任务更新记录，累计工时
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(hours_spent), 0) as total
       FROM task_updates
       WHERE user_id = ?
       AND DATE(created_at) >= ?`,
      [userId, mondayStr]
    );

    const result = rows as any[];
    return { total: result[0]?.total || 0 };
  }
}

export default new TaskService();
