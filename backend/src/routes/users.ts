import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { isAdmin } from '../middleware/permission';

const router = Router();

// 所有路由都需要认证和管理员权限
router.use(authMiddleware);
router.use(isAdmin);

// 获取用户列表（支持搜索、筛选、分页）
router.get('/', getUsers);

// 获取用户详情
router.get('/:id', getUserById);

// 创建用户
router.post('/', createUser);

// 更新用户
router.put('/:id', updateUser);

// 删除用户
router.delete('/:id', deleteUser);

// 重置用户密码
router.put('/:id/password', resetPassword);

export default router;
