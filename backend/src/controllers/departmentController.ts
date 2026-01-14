import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 获取所有部门(树形结构)
 */
export const getDepartments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        d.dept_id,
        d.dept_name,
        d.dept_code,
        d.parent_id,
        d.created_at,
        d.updated_at,
        p.dept_name as parent_name,
        (SELECT COUNT(*) FROM users u WHERE u.dept_id = d.dept_id) as user_count
      FROM departments d
      LEFT JOIN departments p ON d.parent_id = p.dept_id
      ORDER BY d.parent_id, d.dept_id
    `;

    const [rows] = await pool.query(query);
    const departments = rows as any[];

    // 构建树形结构
    const buildTree = (parentId: number | null = null): any[] => {
      return departments
        .filter(dept => dept.parent_id === parentId)
        .map(dept => ({
          ...dept,
          key: dept.dept_id,
          title: dept.dept_name,
          value: dept.dept_id,
          children: buildTree(dept.dept_id)
        }));
    };

    const treeData = buildTree();

    res.json({
      success: true,
      data: treeData,
      flat: departments, // 同时返回扁平数据用于表格展示
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
    const { dept_name, dept_code, parent_id } = req.body;

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

    // 验证父部门是否存在(如果指定了父部门)
    if (parent_id !== null && parent_id !== undefined) {
      const [parentRows] = await pool.query(
        'SELECT dept_id FROM departments WHERE dept_id = ?',
        [parent_id]
      );

      const parents = parentRows as any[];

      if (!Array.isArray(parents) || parents.length === 0) {
        res.status(400).json({
          success: false,
          message: '父部门不存在',
        });
        return;
      }
    }

    // 创建部门
    const [result] = await pool.query(
      'INSERT INTO departments (dept_name, dept_code, parent_id) VALUES (?, ?, ?)',
      [dept_name, dept_code, parent_id || null]
    ) as any[];

    // 查询新创建的部门
    const [newDept] = await pool.query(
      `SELECT d.*, p.dept_name as parent_name
       FROM departments d
       LEFT JOIN departments p ON d.parent_id = p.dept_id
       WHERE d.dept_id = ?`,
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
    const { dept_name, dept_code, parent_id } = req.body;

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

    // 验证父部门:不能将自己设置为父部门,不能将子部门设置为父部门
    if (parent_id !== null && parent_id !== undefined) {
      if (parseInt(id) === parseInt(parent_id as string)) {
        res.status(400).json({
          success: false,
          message: '不能将自己设置为父部门',
        });
        return;
      }

      // 检查父部门是否存在
      const [parentRows] = await pool.query(
        'SELECT dept_id FROM departments WHERE dept_id = ?',
        [parent_id]
      );

      const parents = parentRows as any[];

      if (!Array.isArray(parents) || parents.length === 0) {
        res.status(400).json({
          success: false,
          message: '父部门不存在',
        });
        return;
      }

      // 检查是否形成循环引用(父部门不能是当前部门的子孙部门)
      // 使用正确的递归查询：只向下查找子部门，不向上查找父部门
      const [childRows] = await pool.query(
        `WITH RECURSIVE dept_tree AS (
          SELECT dept_id, parent_id FROM departments WHERE dept_id = ?
          UNION ALL
          SELECT d.dept_id, d.parent_id FROM departments d
          INNER JOIN dept_tree dt ON d.parent_id = dt.dept_id
        )
        SELECT dept_id FROM dept_tree WHERE dept_id = ?`,
        [id, parent_id]
      ) as any[];

      if (childRows.length > 0) {
        res.status(400).json({
          success: false,
          message: '不能将子部门设置为父部门',
        });
        return;
      }
    }

    // 更新部门
    await pool.query(
      'UPDATE departments SET dept_name = ?, dept_code = ?, parent_id = ? WHERE dept_id = ?',
      [dept_name, dept_code, parent_id || null, id]
    );

    // 查询更新后的部门
    const [updatedRows] = await pool.query(
      `SELECT d.*, p.dept_name as parent_name
       FROM departments d
       LEFT JOIN departments p ON d.parent_id = p.dept_id
       WHERE d.dept_id = ?`,
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

    // 检查是否有子部门
    const [childRows] = await pool.query(
      'SELECT COUNT(*) as count FROM departments WHERE parent_id = ?',
      [id]
    );

    const children = childRows as any[];

    if (Array.isArray(children) && children[0].count > 0) {
      res.status(400).json({
        success: false,
        message: '该部门存在子部门，无法删除。请先删除子部门。',
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
