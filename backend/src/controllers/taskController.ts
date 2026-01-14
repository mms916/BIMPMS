import { Request, Response } from 'express';
import taskService from '../services/taskService';
import { CreateTaskDto, UpdateTaskDto, CreateTaskUpdateDto, TaskFilters } from '../models/task';

export class TaskController {
  // 获取任务列表
  async getTasks(req: Request, res: Response) {
    try {
      const filters: TaskFilters = {
        project_id: req.query.project_id ? parseInt(req.query.project_id as string) : undefined,
        assigned_to: req.query.assigned_to ? parseInt(req.query.assigned_to as string) : undefined,
        status: req.query.status as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
        include_children: req.query.include_children === 'true'
      };

      const result = await taskService.getTasks(filters);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('获取任务列表失败：', error);
      res.status(500).json({ success: false, message: error.message || '获取任务列表失败' });
    }
  }

  // 获取任务详情
  async getTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(parseInt(id));

      if (!task) {
        return res.status(404).json({ success: false, message: '任务不存在' });
      }

      res.json({ success: true, data: task });
    } catch (error: any) {
      console.error('获取任务详情失败：', error);
      res.status(500).json({ success: false, message: error.message || '获取任务详情失败' });
    }
  }

  // 获取项目的任务树
  async getProjectTasks(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tasks = await taskService.getProjectTasks(parseInt(id));
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error('获取项目任务失败：', error);
      res.status(500).json({ success: false, message: error.message || '获取项目任务失败' });
    }
  }

  // 创建任务
  async createTask(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未授权' });
      }

      const dto: CreateTaskDto = req.body;
      const task = await taskService.createTask(dto, userId);
      res.json({ success: true, data: task, message: '任务创建成功' });
    } catch (error: any) {
      console.error('创建任务失败：', error);
      res.status(500).json({ success: false, message: error.message || '创建任务失败' });
    }
  }

  // 更新任务
  async updateTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto: UpdateTaskDto = req.body;
      const task = await taskService.updateTask(parseInt(id), dto);
      res.json({ success: true, data: task, message: '任务更新成功' });
    } catch (error: any) {
      console.error('更新任务失败：', error);
      res.status(500).json({ success: false, message: error.message || '更新任务失败' });
    }
  }

  // 删除任务
  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await taskService.deleteTask(parseInt(id));
      res.json({ success: true, message: '任务删除成功' });
    } catch (error: any) {
      console.error('删除任务失败：', error);
      res.status(500).json({ success: false, message: error.message || '删除任务失败' });
    }
  }

  // 获取我的任务
  async getMyTasks(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未授权' });
      }

      const filters: TaskFilters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        project_id: req.query.project_id ? parseInt(req.query.project_id as string) : undefined,
        search: req.query.search as string
      };

      const result = await taskService.getMyTasks(userId, filters);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('获取我的任务失败：', error);
      res.status(500).json({ success: false, message: error.message || '获取我的任务失败' });
    }
  }

  // 获取我的任务统计
  async getMyTaskStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未授权' });
      }

      const stats = await taskService.getMyTaskStats(userId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('获取任务统计失败：', error);
      res.status(500).json({ success: false, message: error.message || '获取任务统计失败' });
    }
  }

  // 创建任务更新记录
  async createTaskUpdate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未授权' });
      }

      const { id } = req.params;
      const dto: CreateTaskUpdateDto = req.body;
      const update = await taskService.createTaskUpdate(parseInt(id), userId, dto);
      res.json({ success: true, data: update, message: '任务进度更新成功' });
    } catch (error: any) {
      console.error('更新任务进度失败：', error);
      res.status(500).json({ success: false, message: error.message || '更新任务进度失败' });
    }
  }

  // 获取任务更新记录
  async getTaskUpdates(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = await taskService.getTaskUpdates(parseInt(id));
      res.json({ success: true, data: updates });
    } catch (error: any) {
      console.error('获取任务更新记录失败：', error);
      res.status(500).json({ success: false, message: error.message || '获取任务更新记录失败' });
    }
  }

  // 计算项目进度
  async calculateProjectProgress(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      console.log('收到计算项目进度请求，projectId:', projectId);
      const progress = await taskService.calculateProjectProgress(parseInt(projectId));
      console.log('计算的项目进度:', progress);
      res.json({ success: true, data: { progress } });
    } catch (error: any) {
      console.error('计算项目进度失败：', error);
      res.status(500).json({ success: false, message: error.message || '计算项目进度失败' });
    }
  }

  // 同步项目进度到项目台账
  async syncProjectProgress(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = (req as any).user?.user_id;
      console.log('收到同步项目进度请求，projectId:', projectId, 'userId:', userId);

      if (!userId) {
        return res.status(401).json({ success: false, message: '未授权' });
      }

      // 计算项目进度
      const progress = await taskService.calculateProjectProgress(parseInt(projectId));
      console.log('计算的项目进度:', progress);

      // 更新项目台账中的进度
      const pool = require('../config/database').default;
      await pool.query(
        'UPDATE projects SET progress = ?, updated_by = ? WHERE project_id = ?',
        [progress, userId, projectId]
      );

      res.json({ success: true, data: { progress }, message: '项目进度同步成功' });
    } catch (error: any) {
      console.error('同步项目进度失败：', error);
      res.status(500).json({ success: false, message: error.message || '同步项目进度失败' });
    }
  }

  // 计算所有项目的进度
  async calculateAllProjectsProgress(req: Request, res: Response) {
    try {
      console.log('收到计算所有项目进度请求');
      const results = await taskService.calculateAllProjectsProgress();
      console.log('计算完成，共处理', results.length, '个项目');
      res.json({
        success: true,
        data: results,
        message: `已成功计算 ${results.length} 个项目的进度`
      });
    } catch (error: any) {
      console.error('计算所有项目进度失败：', error);
      res.status(500).json({ success: false, message: error.message || '计算所有项目进度失败' });
    }
  }

  // 获取本周工时统计
  async getWeeklyHours(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id;
      if (!userId) {
        return res.status(401).json({ success: false, message: '未授权' });
      }

      const hours = await taskService.getWeeklyHours(userId);
      res.json({ success: true, data: hours });
    } catch (error: any) {
      console.error('获取本周工时失败：', error);
      res.status(500).json({ success: false, message: error.message || '获取本周工时失败' });
    }
  }
}

export default new TaskController();
