import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  generateContractNoHandler,
} from '../controllers/projectController';
import { authMiddleware } from '../middleware/auth';
import { canDeleteProject } from '../middleware/permission';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取项目列表
router.get('/', getProjects);

// 获取统计数据
router.get('/stats', getProjectStats);

// 生成合同编号
router.get('/contract/generate-no', generateContractNoHandler);

// 创建项目
router.post('/', createProject);

// 获取项目详情
router.get('/:id', getProjectById);

// 更新项目
router.put('/:id', updateProject);

// 删除项目（仅管理员）
router.delete('/:id', canDeleteProject, deleteProject);

export default router;
