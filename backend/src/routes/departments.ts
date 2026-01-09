import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/permission';

const router = Router();

// 所有路由都需要认证和管理员权限
router.use(authMiddleware);
router.use(isAdmin);

// 获取所有部门
router.get('/', getDepartments);

// 创建部门
router.post('/', createDepartment);

// 更新部门
router.put('/:id', updateDepartment);

// 删除部门
router.delete('/:id', deleteDepartment);

export default router;
