import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT Token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload as any, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
};

/**
 * 验证JWT Token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * 从请求头中提取Token
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};
