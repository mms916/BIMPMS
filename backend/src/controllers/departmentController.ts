import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 获取所有部门
 */
export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        dept_id,
        dept_name,
        dept_code,
        created_at,
        updated_at
      FROM departments
      ORDER BY dept_id
    `;

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('获取部门列表失败：', error);
    res.status(500).json({
      success: false,
      message: '获取部门列表失败',
    });
  }
};

/**
 * 创建部门
 */
export const createDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { dept_name, dept_code } = req.body;

    // 验证必填字段
    if (!dept_name || !dept_code) {
      res.status(400).json({
        success: false,
        message: '部门名称和部门代码为必填项',
      });
      return;
    }

    // 检查部门代码是否已存在
    const [existingRows] = await pool.query(
      'SELECT dept_id FROM departments WHERE dept_code = ?',
      [dept_code]
    );

    const existingDepts = existingRows as any[];

    if (Array.isArray(existingDepts) && existingDepts.length > 0) {
      res.status(400).json({
        success: false,
        message: '部门代码已存在',
      });
      return;
    }

    // 创建部门
    const [result] = await pool.query(
      'INSERT INTO departments (dept_name, dept_code) VALUES (?, ?)',
      [dept_name, dept_code]
    ) as any[];

    // 查询新创建的部门
    const [newDept] = await pool.query(
      'SELECT * FROM departments WHERE dept_id = ?',
      [result.insertId]
    ) as any[];

    res.json({
      success: true,
      data: newDept[0],
      message: '部门创建成功',
    });
  } catch (error) {
    console.error('创建部门失败：', error);
    res.status(500).json({
      success: false,
      message: '创建部门失败',
    });
  }
};

/**
 * 更新部门
 */
export const updateDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { dept_name, dept_code } = req.body;

    // 验证必填字段
    if (!dept_name || !dept_code) {
      res.status(400).json({
        success: false,
        message: '部门名称和部门代码为必填项',
      });
      return;
    }

    // 检查部门是否存在
    const [deptRows] = await pool.query(
      'SELECT dept_id FROM departments WHERE dept_id = ?',
      [id]
    );

    const departments = deptRows as any[];

    if (Array.isArray(departments) && departments.length === 0) {
      res.status(404).json({
        success: false,
        message: '部门不存在',
      });
      return;
    }

    // 检查部门代码是否被其他部门使用
    const [existingRows] = await pool.query(
      'SELECT dept_id FROM departments WHERE dept_code = ? AND dept_id != ?',
      [dept_code, id]
    );

    const existingDepts = existingRows as any[];

    if (Array.isArray(existingDepts) && existingDepts.length > 0) {
      res.status(400).json({
        success: false,
        message: '部门代码已被其他部门使用',
      });
      return;
    }

    // 更新部门
    await pool.query(
      'UPDATE departments SET dept_name = ?, dept_code = ? WHERE dept_id = ?',
      [dept_name, dept_code, id]
    );

    // 查询更新后的部门
    const [updatedRows] = await pool.query(
      'SELECT * FROM departments WHERE dept_id = ?',
      [id]
    ) as any[];

    res.json({
      success: true,
      data: updatedRows[0],
      message: '部门更新成功',
    });
  } catch (error) {
    console.error('更新部门失败：', error);
    res.status(500).json({
      success: false,
      message: '更新部门失败',
    });
  }
};

/**
 * 删除部门
 */
export const deleteDepartment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查部门是否存在
    const [deptRows] = await pool.query(
      'SELECT dept_id, dept_name FROM departments WHERE dept_id = ?',
      [id]
    );

    const departments = deptRows as any[];

    if (Array.isArray(departments) && departments.length === 0) {
      res.status(404).json({
        success: false,
        message: '部门不存在',
      });
      return;
    }

    // 检查是否有关联用户
    const [userRows] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE dept_id = ?',
      [id]
    );

    const users = userRows as any[];

    if (Array.isArray(users) && users[0].count > 0) {
      res.status(400).json({
        success: false,
        message: '该部门存在关联用户，无法删除',
      });
      return;
    }

    // 检查是否有关联项目
    const [projectRows] = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE dept_id = ?',
      [id]
    );

    const projects = projectRows as any[];

    if (Array.isArray(projects) && projects[0].count > 0) {
      res.status(400).json({
        success: false,
        message: '该部门存在关联项目，无法删除',
      });
      return;
    }

    // 删除部门
    await pool.query('DELETE FROM departments WHERE dept_id = ?', [id]);

    res.json({
      success: true,
      message: '部门删除成功',
    });
  } catch (error) {
    console.error('删除部门失败：', error);
    res.status(500).json({
      success: false,
      message: '删除部门失败',
    });
  }
};
