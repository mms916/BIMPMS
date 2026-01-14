import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import pool from '../config/database';
import { User, UserRole } from '../types';

/**
 * 用户登录
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    console.log('登录请求:', { username, passwordLength: password?.length });

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
      return;
    }

    // 查询用户信息（包含部门信息）
    const [rows] = await pool.query(
      `SELECT u.*, d.dept_name, d.dept_code
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       WHERE u.username = ?`,
      [username]
    );

    const users = rows as any[];
    console.log('查询结果:', users.length, '个用户');

    if (!Array.isArray(users) || users.length === 0) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    const user = users[0];
    console.log('用户信息:', user.username, user.role);

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('密码验证结果:', isPasswordValid);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // 生成JWT Token
    console.log('开始生成Token...');
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      role: user.role as UserRole,
      dept_id: user.dept_id,
    });
    console.log('Token生成成功');

    // 返回用户信息和Token（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('登录失败：', error);
    console.error('错误详情：', JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      message: '登录失败，服务器错误',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: '未认证',
      });
      return;
    }

    // 查询完整用户信息
    const [rows] = await pool.query(
      `SELECT u.*, d.dept_name, d.dept_code
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       WHERE u.user_id = ?`,
      [user.user_id]
    );

    const users = rows as any[];

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    const { password: _, ...userWithoutPassword } = users[0];

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('获取用户信息失败：', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    });
  }
};
