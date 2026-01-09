import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 用户登录（无需认证）
router.post('/login', login);

// 获取当前用户信息（需要认证）
router.get('/me', authMiddleware, getCurrentUser);

export default router;
