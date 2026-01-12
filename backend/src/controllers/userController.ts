import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../types';

/**
 * 获取用户列表
 * 支持搜索、角色筛选、部门筛选、分页
 */
export const getUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user! as User;

    const {
      page = '1',
      pageSize = '20',
      search = '',
      role,
      dept_id,
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;

    // 构建查询条件
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(`(u.username LIKE ? OR u.full_name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      conditions.push(`u.role = ?`);
      params.push(role);
    }

    if (dept_id) {
      conditions.push(`u.dept_id = ?`);
      params.push(dept_id);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // 查询用户列表
    const query = `
      SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.avatar,
        u.dept_id,
        d.dept_name,
        u.role,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.dept_id = d.dept_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(pageSizeNum, offset);

    const [rows] = await pool.query(query, params) as any[];

    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countParams = params.slice(0, -2);
    const [countRows] = await pool.query(countQuery, countParams) as any[];
    const total = countRows[0].total as number;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
      },
    });
  } catch (error) {
    console.error('获取用户列表失败：', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
    });
  }
};

/**
 * 获取用户详情
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        u.user_id,
        u.username,
        u.full_name,
        u.avatar,
        u.dept_id,
        d.dept_name,
        u.role,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN departments d ON u.dept_id = d.dept_id
      WHERE u.user_id = ?
    `;

    const [rows] = await pool.query(query, [id]) as any[];

    if (rows.length > 0) {
      res.json({
        success: true,
        data: rows[0],
      });
    } else {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }
  } catch (error) {
    console.error('获取用户详情失败：', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
    });
  }
};

/**
 * 创建用户
 */
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, full_name, dept_id, role } = req.body;

    // 验证必填字段
    if (!username || !full_name || !dept_id || !role) {
      res.status(400).json({
        success: false,
        message: '用户名、姓名、部门和角色为必填项',
      });
      return;
    }

    // 验证角色合法性
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: '角色不合法',
      });
      return;
    }

    // 检查用户名是否已存在
    const [existingRows] = await pool.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    );

    const existingUsers = existingRows as any[];

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(400).json({
        success: false,
        message: '用户名已存在',
      });
      return;
    }

    // 检查部门是否存在
    const [deptRows] = await pool.query(
      'SELECT dept_id FROM departments WHERE dept_id = ?',
      [dept_id]
    );

    const departments = deptRows as any[];

    if (Array.isArray(departments) && departments.length === 0) {
      res.status(400).json({
        success: false,
        message: '部门不存在',
      });
      return;
    }

    // 加密默认密码
    const defaultPassword = await bcrypt.hash('123', 10);

    // 创建用户
    const [result] = await pool.query(
      'INSERT INTO users (username, password, full_name, dept_id, role) VALUES (?, ?, ?, ?, ?)',
      [username, defaultPassword, full_name, dept_id, role]
    ) as any[];

    // 查询新创建的用户信息
    const [newUserRows] = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, u.dept_id, d.dept_name, u.role, u.created_at
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       WHERE u.user_id = ?`,
      [result.insertId]
    ) as any[];

    res.json({
      success: true,
      data: newUserRows[0],
      message: '用户创建成功，默认密码为 123',
    });
  } catch (error) {
    console.error('创建用户失败：', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
    });
  }
};

/**
 * 更新用户
 */
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { full_name, dept_id, role } = req.body;

    // 验证必填字段
    if (!full_name || !dept_id || !role) {
      res.status(400).json({
        success: false,
        message: '姓名、部门和角色为必填项',
      });
      return;
    }

    // 验证角色合法性
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: '角色不合法',
      });
      return;
    }

    // 检查用户是否存在
    const [userRows] = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );

    const users = userRows as any[];

    if (Array.isArray(users) && users.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 检查部门是否存在
    const [deptRows] = await pool.query(
      'SELECT dept_id FROM departments WHERE dept_id = ?',
      [dept_id]
    );

    const departments = deptRows as any[];

    if (Array.isArray(departments) && departments.length === 0) {
      res.status(400).json({
        success: false,
        message: '部门不存在',
      });
      return;
    }

    // 更新用户
    await pool.query(
      'UPDATE users SET full_name = ?, dept_id = ?, role = ? WHERE user_id = ?',
      [full_name, dept_id, role, id]
    );

    // 查询更新后的用户信息
    const [updatedRows] = await pool.query(
      `SELECT u.user_id, u.username, u.full_name, u.dept_id, d.dept_name, u.role, u.updated_at
       FROM users u
       LEFT JOIN departments d ON u.dept_id = d.dept_id
       WHERE u.user_id = ?`,
      [id]
    ) as any[];

    res.json({
      success: true,
      data: updatedRows[0],
      message: '用户更新成功',
    });
  } catch (error) {
    console.error('更新用户失败：', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
    });
  }
};

/**
 * 删除用户
 */
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user! as User;

    // 不允许删除自己
    if (parseInt(id) === currentUser.user_id) {
      res.status(400).json({
        success: false,
        message: '不能删除当前登录用户',
      });
      return;
    }

    // 检查用户是否存在
    const userResult = await pool.query(
      'SELECT user_id, username FROM users WHERE user_id = ?',
      [id]
    ) as any[];

    const users = userResult[0] as any[];

    if (Array.isArray(users) && users.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 检查是否有关联项目
    const [projectRows] = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE leader_id = ?',
      [id]
    );

    const projects = projectRows as any[];

    if (Array.isArray(projects) && projects[0].count > 0) {
      res.status(400).json({
        success: false,
        message: '该用户存在关联项目，无法删除',
      });
      return;
    }

    // 检查是否是参与人员
    const [participantRows] = await pool.query(
      'SELECT COUNT(*) as count FROM project_participants WHERE user_id = ?',
      [id]
    );

    const participantProjects = participantRows as any[];

    if (Array.isArray(participantProjects) && participantProjects[0].count > 0) {
      res.status(400).json({
        success: false,
        message: '该用户参与了项目，无法删除',
      });
      return;
    }

    // 删除用户
    await pool.query('DELETE FROM users WHERE user_id = ?', [id]);

    res.json({
      success: true,
      message: '用户删除成功',
    });
  } catch (error) {
    console.error('删除用户失败：', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
    });
  }
};

/**
 * 重置用户密码
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查用户是否存在
    const [userRows] = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );

    const users = userRows as any[];

    if (Array.isArray(users) && users.length === 0) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      });
      return;
    }

    // 加密默认密码
    const defaultPassword = await bcrypt.hash('123', 10);

    // 重置密码
    await pool.query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [defaultPassword, id]
    );

    res.json({
      success: true,
      message: '密码重置成功，新密码为 123',
    });
  } catch (error) {
    console.error('重置密码失败：', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
    });
  }
};
