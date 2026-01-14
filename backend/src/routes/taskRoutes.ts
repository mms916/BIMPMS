import { Router } from 'express';
import taskController from '../controllers/taskController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有任务路由都需要认证
router.use(authMiddleware);

// 任务列表（必须在动态路由之前）
router.get('/', taskController.getTasks.bind(taskController));

// 我的任务（工作台）- 必须在动态路由 :id 之前
router.get('/my', taskController.getMyTasks.bind(taskController));
router.get('/my/stats', taskController.getMyTaskStats.bind(taskController));
router.get('/my/weekly-hours', taskController.getWeeklyHours.bind(taskController));

// 项目进度计算和同步 - 必须在 /project/:id/tasks 之前
router.get('/project/:projectId/calculate-progress', taskController.calculateProjectProgress.bind(taskController));
router.post('/project/:projectId/sync-progress', taskController.syncProjectProgress.bind(taskController));
router.get('/calculate-all-progress', taskController.calculateAllProjectsProgress.bind(taskController));

// 测试路由 - 验证路由注册
router.get('/test-route', (req, res) => {
  console.log('测试路由被调用');
  res.json({ success: true, message: '任务路由测试成功' });
});

// 项目任务树 - 必须在动态路由 :id 之前
router.get('/project/:id/tasks', taskController.getProjectTasks.bind(taskController));

// 任务详情管理（动态路由）
router.get('/:id', taskController.getTaskById.bind(taskController));
router.post('/', taskController.createTask.bind(taskController));
router.put('/:id', taskController.updateTask.bind(taskController));
router.delete('/:id', taskController.deleteTask.bind(taskController));

// 任务进度更新
router.post('/:id/updates', taskController.createTaskUpdate.bind(taskController));
router.get('/:id/updates', taskController.getTaskUpdates.bind(taskController));

export default router;
