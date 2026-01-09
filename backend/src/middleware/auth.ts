import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { JWTPayload } from '../types';

// 扩展Express Request类型，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT认证中间件
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供认证Token',
      });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Token无效或已过期',
      });
      return;
    }

    // 将用户信息附加到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
    });
  }
};

/**
 * 可选认证中间件（不强制要求Token）
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
